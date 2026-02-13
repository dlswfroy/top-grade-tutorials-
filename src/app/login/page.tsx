'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDocs, collection, writeBatch, query, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { DEFAULT_TEACHER_PERMISSIONS } from '@/hooks/usePermissions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = async (action: 'login' | 'signup') => {
    setIsLoading(true);
    try {
      if (action === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
            toast({
                variant: 'destructive',
                title: 'ইমেইল যাচাইকরণ আবশ্যক',
                description: 'অনুগ্রহ করে আপনার ইমেইল যাচাই করুন। আপনার ইনবক্সে একটি যাচাইকরণ লিঙ্ক পাঠানো হয়েছে।',
            });
            setIsLoading(false);
            return;
        }
        toast({ title: 'সফল', description: 'সফলভাবে লগইন করেছেন।' });
      } else {
        if (!name || !mobileNumber) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে আপনার নাম ও মোবাইল নম্বর দিন।' });
            setIsLoading(false);
            return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        
        const batch = writeBatch(firestore);

        // Create teacher document in Firestore
        const teacherRef = doc(firestore, 'teachers', user.uid);
        batch.set(teacherRef, {
            id: user.uid,
            name: name,
            mobileNumber: mobileNumber,
            imageUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
            imageHint: 'teacher person',
            dateAdded: new Date().toISOString()
        });

        // Create role document for the teacher
        const teacherRoleRef = doc(firestore, 'roles_teacher', user.uid);
        batch.set(teacherRoleRef, { active: true });
        
        // Create default permissions for the teacher
        const permissionsRef = doc(firestore, 'teacher_permissions', user.uid);
        batch.set(permissionsRef, DEFAULT_TEACHER_PERMISSIONS);

        // Check if any admin exists. If not, make this user the first admin.
        const adminRolesCollection = collection(firestore, 'roles_admin');
        const q = query(adminRolesCollection, limit(1));
        const adminRolesQuery = await getDocs(q);

        if (adminRolesQuery.empty) {
            const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
            batch.set(adminRoleRef, { active: true });
            toast({ title: 'প্রধান শিক্ষক', description: 'আপনি প্রথম ব্যবহারকারী হওয়ায় আপনাকে প্রধান শিক্ষক হিসাবে সেট করা হয়েছে।' });
        }
        
        await batch.commit();
        await sendEmailVerification(user);

        toast({ title: 'সফল', description: 'আপনার একাউন্ট সফলভাবে তৈরি হয়েছে। অনুগ্রহ করে আপনার ইমেইল যাচাই করুন।' });
      }
      router.push('/');
    } catch (error: any) {
      console.error(error);
      let errorMessage;
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'আপনার দেওয়া ইমেইল বা পাসওয়ার্ডটি সঠিক নয়।';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'এই ইমেইলটি ইতিমধ্যে ব্যবহার করা হয়েছে। অন্য ইমেইল ব্যবহার করুন অথবা লগইন করুন।';
          break;
        case 'auth/weak-password':
          errorMessage = 'পাসওয়ার্ডটি যথেষ্ট শক্তিশালী নয়। কমপক্ষে ৬টি অক্ষর থাকতে হবে।';
          break;
        default:
          errorMessage = 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
          break;
      }
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে আপনার ইমেইল ঠিকানা দিন।' });
        return;
    }
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({ title: 'ইমেইল পাঠানো হয়েছে', description: 'পাসওয়ার্ড রিসেট করার জন্য আপনার ইমেইলে একটি লিঙ্ক পাঠানো হয়েছে।' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'পাসওয়ার্ড রিসেট ইমেইল পাঠাতে সমস্যা হয়েছে।' });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">লগইন</TabsTrigger>
          <TabsTrigger value="signup">সাইন আপ</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>লগইন</CardTitle>
              <CardDescription>আপনার একাউন্টে প্রবেশ করুন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">পাসওয়ার্ড</Label>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-xs">পাসওয়ার্ড ভুলে গেছেন?</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>পাসওয়ার্ড রিসেট</DialogTitle>
                                <DialogDescription>আপনার একাউন্টের ইমেইল ঠিকানা দিন। আমরা আপনাকে পাসওয়ার্ড রিসেট করার জন্য একটি লিঙ্ক পাঠাব।</DialogDescription>
                            </DialogHeader>
                             <div className="space-y-2 pt-4">
                                <Label htmlFor="reset-email">ইমেইল</Label>
                                <Input
                                id="reset-email"
                                type="email"
                                placeholder=" আপনার ইমেইল"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">বাতিল</Button>
                                </DialogClose>
                                <Button onClick={handlePasswordReset} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    রিসেট লিঙ্ক পাঠান
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleAuthAction('login')} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                লগইন করুন
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>সাইন আপ</CardTitle>
              <CardDescription>নতুন একাউন্ট তৈরি করুন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="name-signup">নাম</Label>
                <Input
                  id="name-signup"
                  type="text"
                  placeholder="আপনার নাম"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="mobile-signup">মোবাইল নম্বর</Label>
                <Input
                  id="mobile-signup"
                  type="tel"
                  placeholder="আপনার মোবাইল নম্বর"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signup">ইমেইল</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">পাসওয়ার্ড</Label>
                <Input
                  id="password-signup"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleAuthAction('signup')} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                সাইন আপ করুন
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
