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
import { Save, Loader2, User as UserIcon } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

const compressImage = (file: File, options: { maxWidth: number; maxHeight: number; quality: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = options.maxWidth;
                const MAX_HEIGHT = options.maxHeight;
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
                resolve(canvas.toDataURL('image/jpeg', options.quality));
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
};

function UserProfileCard() {
    const auth = useAuth();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [name, setName] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setName(currentUser.displayName || '');
                setImagePreview(currentUser.photoURL || null);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
              toast({ title: 'ছবি প্রসেস করা হচ্ছে...', description: 'ছবি সংকুচিত করতে কয়েক মুহূর্ত সময় লাগতে পারে।' });
              const compressedDataUrl = await compressImage(file, { maxWidth: 128, maxHeight: 128, quality: 0.8 });
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
        if (!user) return;
        setIsSaving(true);
        try {
            await updateProfile(user, {
                displayName: name,
                photoURL: imagePreview,
            });
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
                        disabled={isSaving || !user}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="photo" className="text-slate-700 dark:text-slate-300">প্রোফাইল ছবি</Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={imagePreview || undefined} />
                            <AvatarFallback>
                                <UserIcon className="h-10 w-10 text-slate-400" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <Input
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="max-w-xs"
                                disabled={isSaving || !user}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving || !user}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'সেভ হচ্ছে...' : 'প্রোফাইল সেভ করুন'}
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
              const compressedDataUrl = await compressImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.9 });
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
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </Button>
            </CardFooter>
        </Card>
    )
}

function SettingsPage() {
    return (
        <div className="space-y-8 p-6 rounded-lg bg-slate-50 dark:bg-slate-800/20">
            <div>
                <h1 className="text-3xl font-bold font-headline text-slate-800 dark:text-slate-200">সেটিংস</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <InstitutionSettingsCard />
                 <UserProfileCard />
            </div>
        </div>
    );
}

export default function SettingsPageContainer() {
    return (
        <SettingsPage />
    )
}
