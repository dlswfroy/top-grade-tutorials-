'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, User as UserIcon, MoreHorizontal, KeyRound } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useAuth, useCollection } from '@/firebase';
import { doc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, updateProfile, type User, sendPasswordResetEmail } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserRole } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 512;
                const MAX_HEIGHT = 512;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                 if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
};

function UserManagementCard() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    const userRolesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'user_roles');
    }, [firestore]);
    const { data: userRoles, isLoading: isLoadingUserRoles } = useCollection<UserRole>(userRolesQuery);

    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
    const [actionUser, setActionUser] = useState<UserRole | null>(null);

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'teacher') => {
        if (!firestore) return;

        setIsSaving(prev => ({ ...prev, [userId]: true }));
        try {
            const userRoleRef = doc(firestore, 'user_roles', userId);
            await updateDoc(userRoleRef, { role: newRole });
            toast({ title: 'সফল', description: 'ব্যবহারকারীর ভূমিকা আপডেট করা হয়েছে।' });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: `ভূমিকা আপডেট করতে সমস্যা হয়েছে: ${error.message}`,
            });
        } finally {
            setIsSaving(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handlePasswordReset = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            toast({ title: 'ইমেইল পাঠানো হয়েছে', description: `${email}-এ পাসওয়ার্ড রিসেট করার লিঙ্ক পাঠানো হয়েছে।` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: error.message });
        }
    };

    if (isLoadingUserRoles) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-bold text-slate-900 dark:text-slate-100">ব্যবহারকারী ম্যানেজমেন্ট</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-bold text-slate-900 dark:text-slate-100">ব্যবহারকারী ম্যানেজমেন্ট</CardTitle>
                <CardDescription>ব্যবহারকারীদের ভূমিকা নির্ধারণ করুন এবং পাসওয়ার্ড রিসেট করুন।</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>নাম</TableHead>
                            <TableHead>ইমেইল</TableHead>
                            <TableHead>ভূমিকা</TableHead>
                            <TableHead className="text-right">একশন</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {userRoles?.map((userRole) => (
                            <TableRow key={userRole.id}>
                                <TableCell className="font-medium">{userRole.name}</TableCell>
                                <TableCell>{userRole.email}</TableCell>
                                <TableCell>
                                    <Select
                                        value={userRole.role}
                                        onValueChange={(newRole: 'admin' | 'teacher') => handleRoleChange(userRole.id, newRole)}
                                        disabled={isSaving[userRole.id] || auth.currentUser?.uid === userRole.id}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="ভূমিকা" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">এডমিন</SelectItem>
                                            <SelectItem value="teacher">শিক্ষক</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setActionUser(userRole); }}>
                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                        <span>পাসওয়ার্ড রিসেট</span>
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    এই একশনের ফলে {actionUser?.name} ({actionUser?.email}) এর কাছে পাসওয়ার্ড রিসেট করার জন্য একটি ইমেইল পাঠানো হবে।
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => actionUser && handlePasswordReset(actionUser.email)}>
                                                  চালিয়ে যান
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function UserProfileCard() {
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [name, setName] = useState('');

    const userRoleRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'user_roles', user.uid);
    }, [firestore, user]);

    const { data: userRole, isLoading: isLoadingUserRole } = useDoc<UserRole>(userRoleRef);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setName(currentUser.displayName || '');
            }
        });
        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (userRole?.imageUrl) {
            setImagePreview(userRole.imageUrl);
        } else if (user?.photoURL) {
            setImagePreview(user.photoURL);
        } else {
            setImagePreview(null);
        }
    }, [userRole, user]);


    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
              toast({ title: 'ছবি প্রসেস করা হচ্ছে...', description: 'ছবি সংকুচিত করতে কয়েক মুহূর্ত সময় লাগতে পারে।' });
              const compressedDataUrl = await compressImage(file);
              setImagePreview(compressedDataUrl);
            } catch (error) {
              console.error("Image compression failed:", error);
              toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "ছবিটি সংকুচিত করতে সমস্যা হয়েছে। অনুগ্রহ করে একটি বৈধ ছবি ফাইল আপলোড করুন।",
              });
            }
        }
    };

    const handleSave = async () => {
        if (!user || !userRoleRef) return;
        setIsSaving(true);
        try {
            await updateProfile(user, { displayName: name });
            
            const userData: Partial<UserRole> = {
                name: name,
                email: user.email!,
                imageUrl: imagePreview || '',
                imageHint: 'person face'
            }
            await setDoc(userRoleRef, userData, { merge: true });

            await user.getIdToken(true);
            toast({ title: 'সফল', description: 'আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে।' });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: `প্রোফাইল আপডেট করতে সমস্যা হয়েছে: ${error.message}`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isLoading = isSaving || isLoadingUserRole;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-bold text-slate-900 dark:text-slate-100">ব্যবহারকারীর প্রোফাইল</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="user-name" className="text-slate-700 dark:text-slate-300">আপনার নাম</Label>
                    <Input
                        id="user-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading || !user}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="photo" className="text-slate-700 dark:text-slate-300">প্রোফাইল ছবি</Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={imagePreview || undefined} />
                            <AvatarFallback>
                                {isLoading ? <Loader2 className="animate-spin" /> : <UserIcon className="h-10 w-10 text-slate-400" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <Input
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="max-w-xs"
                                disabled={isLoading || !user}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isLoading || !user}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isLoading ? 'সেভ হচ্ছে...' : 'প্রোফাইল সেভ করুন'}
                </Button>
            </CardFooter>
        </Card>
    );
}


function InstitutionSettingsCard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [institutionName, setInstitutionName] = useState('টপ গ্রেড টিউটোরিয়ালস');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
  
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'institution_settings', 'default');
    }, [firestore]);

    const { data: settings, isLoading } = useDoc<InstitutionSettings>(settingsRef);

    useEffect(() => {
        if (settings) {
        if (settings.institutionName) {
            setInstitutionName(settings.institutionName);
        }
        if (settings.logoUrl) {
            setLogoUrl(settings.logoUrl);
        }
        }
    }, [settings]);

    const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
              toast({ title: 'ছবি প্রসেস করা হচ্ছে...', description: 'লোগো সংকুচিত করতে কয়েক মুহূর্ত সময় লাগতে পারে।' });
              const compressedDataUrl = await compressImage(file);
              setLogoUrl(compressedDataUrl);
            } catch (error) {
              console.error("Logo compression failed:", error);
              toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: "লোগো সংকুচিত করতে সমস্যা হয়েছে।",
              });
            }
        }
    };

    const handleSave = async () => {
        if (!settingsRef) return;
        setIsSaving(true);
        try {
            const settingsData: Partial<InstitutionSettings & {lastUpdated: string}> = {
                institutionName: institutionName,
                lastUpdated: new Date().toISOString(),
                logoUrl: logoUrl,
            };
            await setDoc(settingsRef, settingsData, { merge: true });
            toast({
                title: 'সফল',
                description: 'প্রতিষ্ঠানের তথ্য সেভ করা হয়েছে।',
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: `সেটিংস সেভ করতে সমস্যা হয়েছে: ${error.message}`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-bold text-slate-900 dark:text-slate-100">প্রতিষ্ঠানের তথ্য</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                <Label htmlFor="institution-name" className="text-slate-700 dark:text-slate-300">প্রতিষ্ঠানের নাম</Label>
                <Input
                    id="institution-name"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    disabled={isSaving || isLoading}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="logo" className="text-slate-700 dark:text-slate-300">প্রতিষ্ঠানের লোগো</Label>
                <div className="flex items-center gap-4">
                    {logoUrl && (
                    <div className="w-20 h-20 relative">
                        <img
                        src={logoUrl}
                        alt="Logo Preview"
                        className="rounded-md border p-1 object-cover w-full h-full"
                        />
                    </div>
                    )}
                    <div className="flex-1">
                    <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="max-w-xs"
                        disabled={isSaving || isLoading}
                    />
                    </div>
                </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                    {isSaving || isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving || isLoading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </Button>
            </CardFooter>
        </Card>
    )
}

function SettingsPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const [user, setUser] = useState<User | null>(null);
    const [authLoaded, setAuthLoaded] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoaded(true);
        });
        return () => unsubscribe();
    }, [auth]);
    
    const userRoleRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'user_roles', user.uid);
    }, [firestore, user]);

    const { data: userRole, isLoading: isLoadingUserRole } = useDoc<UserRole>(userRoleRef);

    const isLoading = !authLoaded || (user && isLoadingUserRole);

    return (
        <div className="space-y-8 p-8 rounded-xl bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
            <div>
                <h1 className="text-3xl font-bold font-headline text-slate-800 dark:text-slate-200">সেটিংস</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <InstitutionSettingsCard />
                 <UserProfileCard />
            </div>
            {isLoading ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-bold text-slate-900 dark:text-slate-100">এডমিন সেকশন লোড হচ্ছে...</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </CardContent>
                </Card>
            ) : userRole?.role === 'admin' && (
                <div className="mt-8">
                    <UserManagementCard />
                </div>
            )}
        </div>
    );
}

export default function SettingsPageContainer() {
    return (
        <SettingsPage />
    )
}
