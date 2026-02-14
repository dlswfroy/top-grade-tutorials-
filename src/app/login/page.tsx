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
  deleteUser,
} from 'firebase/auth';
import { collection, doc, setDoc, runTransaction, getDoc, query, where, getDocs, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LoginForm = ({
  role,
  email,
  setEmail,
  password,
  setPassword,
  onLogin,
  onPasswordReset,
  isLoading,
  isResettingPassword
}: {
  role: 'teacher' | 'admin';
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onLogin: (role: 'teacher' | 'admin') => void;
  onPasswordReset: () => void;
  isLoading: boolean;
  isResettingPassword: boolean;
}) => (
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
      <Button onClick={() => onLogin(role)} disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        লগইন করুন
      </Button>
       <Button variant="link" onClick={onPasswordReset} disabled={isResettingPassword} className="w-full">
        {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        পাসওয়ার্ড ভুলে গেছেন?
      </Button>
    </CardContent>
  </Card>
);

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleTabChange = () => {
    setLoginEmail('');
    setLoginPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
  };

  const handleSignUp = async () => {
    if (!signupEmail || !signupPassword || !signupName) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে নাম, ইমেইল এবং পাসওয়ার্ড পূরণ করুন।' });
      return;
    }
    setIsLoading(true);
    try {
        // Step 1: Create user first to be able to read firestore.
        const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
        const user = userCredential.user;

        try {
            // Step 2: Check if user is first user or a registered teacher
            const adminMarkerRef = doc(firestore, 'user_roles_by_role', 'admin');
            const adminMarkerSnap = await getDoc(adminMarkerRef);
            const isFirstUser = !adminMarkerSnap.exists();

            let canProceed = false;
            let teacherDoc: DocumentSnapshot<DocumentData> | null = null;
            if (isFirstUser) {
                canProceed = true;
            } else {
                const teachersRef = collection(firestore, 'teachers');
                const q = query(teachersRef, where('email', '==', signupEmail));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    canProceed = true;
                    teacherDoc = querySnapshot.docs[0];
                }
            }

            if (!canProceed) {
                toast({
                    variant: 'destructive',
                    title: 'সাইন আপ ব্যর্থ হয়েছে',
                    description: 'এই ইমেইলটি শিক্ষক হিসেবে নিবন্ধন করা নেই। প্রথমে এডমিনের সাথে যোগাযোগ করে শিক্ষক হিসেবে নিবন্ধন সম্পন্ন করুন, তারপর সাইন আপ করুন।',
                    duration: 7000,
                });
                await deleteUser(user); // Clean up orphaned auth user
                setIsLoading(false);
                return;
            }
            
            // Step 3: If validation passes, create profile and user role doc atomically.
            await updateProfile(user, { displayName: signupName });
            
            const userRoleRef = doc(firestore, 'user_roles', user.uid);

            await runTransaction(firestore, async (transaction) => {
                const freshAdminMarkerSnap = await transaction.get(adminMarkerRef);
                const userRole = freshAdminMarkerSnap.exists() ? 'teacher' : 'admin';

                if (userRole === 'admin') {
                    transaction.set(adminMarkerRef, { exists: true });
                }

                const userData: any = {
                    role: userRole,
                    email: user.email,
                    name: signupName,
                };

                if (teacherDoc?.exists()) {
                    const teacherData = teacherDoc.data();
                    if (teacherData?.imageUrl) {
                        userData.imageUrl = teacherData.imageUrl;
                    }
                    if (teacherData?.imageHint) {
                        userData.imageHint = teacherData.imageHint;
                    }
                }

                if (userRole === 'teacher') {
                    userData.permissions = {
                        dashboard: true,
                        students: true,
                        teachers: true,
                        accounting: true,
                        attendance: true,
                        settings: false,
                    };
                }

                transaction.set(userRoleRef, userData);
                
                toast({ title: 'সফল', description: `আপনার ${userRole === 'admin' ? 'এডমিন' : 'শিক্ষক'} একাউন্ট সফলভাবে তৈরি হয়েছে।` });
            });

            router.push('/');

        } catch (dbError: any) {
            // If any firestore operation fails, delete the created auth user
            await deleteUser(user);
            throw dbError; // Re-throw to be caught by the outer catch block
        }

    } catch (error: any) {
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
    if (!loginEmail || !loginPassword) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।' });
        return;
      }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
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
    if (!loginEmail) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'পাসওয়ার্ড রিসেট করার জন্য আপনার ইমেইল দিন।' });
      return;
    }
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      toast({ title: 'ইমেইল পাঠানো হয়েছে', description: 'পাসওয়ার্ড রিসেট করার জন্য আপনার ইমেইলে একটি লিঙ্ক পাঠানো হয়েছে।' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: error.message });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Tabs defaultValue="teacher-login" className="w-[400px]" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teacher-login">শিক্ষক লগইন</TabsTrigger>
          <TabsTrigger value="admin-login">এডমিন লগইন</TabsTrigger>
          <TabsTrigger value="signup">সাইন আপ</TabsTrigger>
        </TabsList>
        <TabsContent value="teacher-login">
          <LoginForm 
            role="teacher" 
            email={loginEmail}
            setEmail={setLoginEmail}
            password={loginPassword}
            setPassword={setLoginPassword}
            onLogin={handleLogin}
            onPasswordReset={handlePasswordReset}
            isLoading={isLoading}
            isResettingPassword={isResettingPassword}
          />
        </TabsContent>
        <TabsContent value="admin-login">
          <LoginForm 
            role="admin" 
            email={loginEmail}
            setEmail={setLoginEmail}
            password={loginPassword}
            setPassword={setLoginPassword}
            onLogin={handleLogin}
            onPasswordReset={handlePasswordReset}
            isLoading={isLoading}
            isResettingPassword={isResettingPassword}
          />
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800 dark:text-gray-200">নতুন একাউন্ট তৈরি করুন</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                শুধুমাত্র নিবন্ধিত শিক্ষকরাই সাইন আপ করতে পারবেন। প্রথম ব্যবহারকারী স্বয়ংক্রিয়ভাবে 'এডমিন' হবেন।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">নাম</Label>
                <Input id="name" placeholder="আপনার পুরো নাম" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-300">ইমেইল</Label>
                <Input id="signup-email" type="email" placeholder="আপনার ইমেইল" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-700 dark:text-gray-300">পাসওয়ার্ড</Label>
                <Input id="signup-password" type="password" placeholder="একটি শক্তিশালী পাসওয়ার্ড দিন" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
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
