'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = async (action: 'login' | 'signup') => {
    setIsLoading(true);
    try {
      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
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
        
        // Create teacher document in Firestore
        const teacherRef = doc(firestore, 'teachers', user.uid);
        await setDoc(teacherRef, {
            name: name,
            mobileNumber: mobileNumber,
            imageUrl: `https://picsum.photos/seed/${user.uid}/200/200`,
            imageHint: 'teacher person',
            dateAdded: new Date().toISOString()
        });

        // Create role document for the teacher
        const teacherRoleRef = doc(firestore, 'roles_teacher', user.uid);
        await setDoc(teacherRoleRef, { active: true });

        toast({ title: 'সফল', description: 'আপনার একাউন্ট সফলভাবে তৈরি হয়েছে।' });
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
                <Label htmlFor="password">পাসওয়ার্ড</Label>
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
