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
  updateProfile,
  signOut,
} from 'firebase/auth';
import { collection, doc, setDoc, runTransaction, getDoc } from 'firebase/firestore';
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
        
        try {
            await runTransaction(firestore, async (transaction) => {
                const adminMarkerRef = doc(firestore, 'user_roles_by_role', 'admin');
                const adminMarkerDoc = await transaction.get(adminMarkerRef);

                const userRoleRef = doc(firestore, 'user_roles', user.uid);
                let userRole = 'teacher';

                if (adminMarkerDoc.exists()) {
                    userRole = 'teacher';
                } else {
                    userRole = 'admin';
                    transaction.set(adminMarkerRef, { exists: true });
                }
                
                transaction.set(userRoleRef, {
                    role: userRole,
                    email: user.email,
                    name: name,
                });
                
                toast({ title: 'সফল', description: `আপনার ${userRole === 'admin' ? 'এডমিন' : 'শিক্ষক'} একাউন্ট সফলভাবে তৈরি হয়েছে।` });

            });
        } catch(e) {
            console.error("Transaction to create user role failed: ", e);
            // Fallback for safety
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
        let description = 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।';
        if (error.code === 'auth/email-already-in-use') {
            description = 'এই ইমেইল দিয়ে ইতিমধ্যে একটি একাউন্ট তৈরি করা আছে।';
        } else {
            description = error.message;
        }
        toast({ variant: 'destructive', title: 'সাইন আপ করতে সমস্যা হয়েছে', description });
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = async (role: 'teacher' | 'admin') => {
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।' });
        return;
      }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRoleRef = doc(firestore, 'user_roles', user.uid);
      const userRoleSnap = await getDoc(userRoleRef);

      if (userRoleSnap.exists() && userRoleSnap.data().role === role) {
        toast({ title: 'সফল', description: 'সফলভাবে লগইন করেছেন।' });
        router.push('/');
      } else {
        await signOut(auth);
        const expectedRoleText = role === 'admin' ? 'এডমিন' : 'শিক্ষক';
        toast({ 
            variant: 'destructive', 
            title: 'লগইন ব্যর্থ হয়েছে', 
            description: `আপনি '${expectedRoleText}' হিসেবে লগইন করার চেষ্টা করছেন। আপনার ভূমিকা সঠিক নয়।` 
        });
      }
    } catch (error: any) {
        console.error("Login error", error);
        let description = 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = 'আপনার দেওয়া ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।';
        } else {
            description = error.message;
        }
        toast({ variant: 'destructive', title: 'লগইন করতে সমস্যা হয়েছে', description });
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

  const LoginForm = ({ role }: { role: 'teacher' | 'admin' }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-gray-200">{role === 'teacher' ? 'শিক্ষক লগইন' : 'এডমিন লগইন'}</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          আপনার একাউন্টে প্রবেশ করতে ইমেইল ও পাসওয়ার্ড দিন।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${role}-email`} className="text-gray-700 dark:text-gray-300">ইমেইল</Label>
          <Input id={`${role}-email`} type="email" placeholder="আপনার ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${role}-password`} className="text-gray-700 dark:text-gray-300">পাসওয়ার্ড</Label>
          <Input id={`${role}-password`} type="password" placeholder="আপনার পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button onClick={() => handleLogin(role)} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          লগইন করুন
        </Button>
         <Button variant="link" onClick={handlePasswordReset} disabled={isResettingPassword} className="w-full">
          {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          পাসওয়ার্ড ভুলে গেছেন?
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Tabs defaultValue="teacher-login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teacher-login">শিক্ষক লগইন</TabsTrigger>
          <TabsTrigger value="admin-login">এডমিন লগইন</TabsTrigger>
          <TabsTrigger value="signup">সাইন আপ</TabsTrigger>
        </TabsList>
        <TabsContent value="teacher-login">
          <LoginForm role="teacher" />
        </TabsContent>
        <TabsContent value="admin-login">
          <LoginForm role="admin" />
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
