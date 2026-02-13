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
import { Save, Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

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

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Ensure the result is a string before setting it
                if (typeof reader.result === 'string') {
                    setLogoUrl(reader.result);
                }
            };
            reader.readAsDataURL(file);
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
                <CardTitle className="text-slate-900 dark:text-slate-100">প্রতিষ্ঠানের তথ্য</CardTitle>
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
            <InstitutionSettingsCard />
        </div>
    );
}

export default function SettingsPageContainer() {
    return (
        <SettingsPage />
    )
}
