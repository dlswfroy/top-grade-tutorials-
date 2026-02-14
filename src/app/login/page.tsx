
'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { collection, doc, setDoc, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে নাম, ইমেইল এবং পাসওয়ার্ড পূরণ করুন।' });
      return;
    }
    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });
        
        let userRole = 'teacher';

        try {
            await runTransaction(firestore, async (transaction) => {
                const adminMarkerRef = doc(firestore, 'user_roles_by_role', 'admin');
                const adminMarkerDoc = await transaction.get(adminMarkerRef);

                const userRoleRef = doc(firestore, 'user_roles', user.uid);

                if (adminMarkerDoc.exists()) {
                    // Admin already exists, create this user as a teacher.
                    userRole = 'teacher';
                    transaction.set(userRoleRef, {
                        role: 'teacher',
                        email: user.email,
                        name: name,
                    });
                } else {
                    // No admin exists, create this user as admin and set the marker.
                    userRole = 'admin';
                    transaction.set(userRoleRef, {
                        role: 'admin',
                        email: user.email,
                        name: name,
                    });
                    transaction.set(adminMarkerRef, { exists: true });
                }
            });
            
             if(userRole === 'admin') {
                toast({ title: 'সফল', description: 'আপনার এডমিন একাউন্ট সফলভাবে তৈরি হয়েছে।' });
             } else {
                toast({ title: 'সফল', description: 'আপনার শিক্ষক একাউন্ট সফলভাবে তৈরি হয়েছে।' });
             }

        } catch(e) {
            console.error("Transaction to create user role failed: ", e);
            // If transaction fails, it's safer to not grant admin rights.
            await setDoc(doc(firestore, 'user_roles', user.uid), {
                role: 'teacher',
                email: user.email,
                name: name,
            });
            toast({ title: 'সফল', description: 'আপনার শিক্ষক একাউন্ট সফলভাবে তৈরি হয়েছে।' });
        }

        router.push('/');

    } catch (error: any) {
        console.error("Signup error", error);
        toast({ variant: 'destructive', title: 'সাইন আপ করতে সমস্যা হয়েছে', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।' });
        return;
      }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'সফল', description: 'সফলভাবে লগইন করেছেন।' });
      router.push('/');
    } catch (error: any) {
        console.error("Login error", error);
        let description = 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = 'আপনার দেওয়া ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।';
        } else {
            description = error.message;
        }
        toast({ variant: 'destructive', title: 'লগইন করতে সমস্যা হয়েছে', description: description });
    } finally {
        setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'পাসওয়ার্ড রিসেট করার জন্য আপনার ইমেইল দিন।' });
      return;
    }
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'ইমেইল পাঠানো হয়েছে', description: 'পাসওয়ার্ড রিসেট করার জন্য আপনার ইমেইলে একটি লিঙ্ক পাঠানো হয়েছে।' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: error.message });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">লগইন</TabsTrigger>
          <TabsTrigger value="signup">সাইন আপ</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">লগইন করুন</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                আপনার একাউন্টে প্রবেশ করতে ইমেইল ও পাসওয়ার্ড দিন।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-700 dark:text-gray-300">ইমেইল</Label>
                <Input id="login-email" type="email" placeholder=" আপনার ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-700 dark:text-gray-300">পাসওয়ার্ড</Label>
                <Input id="login-password" type="password" placeholder="আপনার পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                লগইন করুন
              </Button>
               <Button variant="link" onClick={handlePasswordReset} disabled={isResettingPassword} className="w-full">
                {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                পাসওয়ার্ড ভুলে গেছেন?
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">নতুন একাউন্ট তৈরি করুন</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                প্রথম ব্যবহারকারী স্বয়ংক্রিয়ভাবে 'এডমিন' হবেন।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">নাম</Label>
                <Input id="name" placeholder="আপনার পুরো নাম" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-300">ইমেইল</Label>
                <Input id="signup-email" type="email" placeholder="আপনার ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-700 dark:text-gray-300">পাসওয়ার্ড</Label>
                <Input id="signup-password" type="password" placeholder="একটি শক্তিশালী পাসওয়ার্ড দিন" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button onClick={handleSignUp} disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                সাইন আপ করুন
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
