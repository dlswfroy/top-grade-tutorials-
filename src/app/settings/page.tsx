'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { Progress } from '@/components/ui/progress';
import { Save, Loader2 } from 'lucide-react';
import { useFirebaseApp, useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

export default function SettingsPage() {
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [institutionName, setInstitutionName] = useState('টপ গ্রেড টিউটোরিয়ালস');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'institution_settings', 'default');
  }, [firestore, user]);

  const { data: settings, isLoading } = useDoc<InstitutionSettings>(settingsRef);

  useEffect(() => {
    if (settings) {
      if (settings.institutionName) {
        setInstitutionName(settings.institutionName);
      }
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    }
  }, [settings]);


  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!settingsRef || !firebaseApp || !user) return;

    setIsSaving(true);
    setUploadProgress(0);

    try {
        let newLogoUrl = settings?.logoUrl || null;

        if (logoFile) {
            const storage = getStorage(firebaseApp);
            const storageRef = ref(storage, `institution_assets/logo_${Date.now()}`);
            const uploadTask = uploadBytesResumable(storageRef, logoFile);

            await new Promise<void>((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                    (error) => {
                        console.error('Upload failed:', error);
                        reject(error);
                    },
                    async () => {
                        try {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            newLogoUrl = url;
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
        }

        const settingsData = {
            institutionName: institutionName,
            lastUpdated: new Date().toISOString(),
            logoUrl: newLogoUrl
        };

        await setDoc(settingsRef, settingsData, { merge: true });

        toast({
            title: 'সফল',
            description: 'সেটিংস সফলভাবে সেভ করা হয়েছে।',
        });
        setLogoFile(null);
    } catch (error: any) {
        console.error("Error saving settings:", error);
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: `সেটিংস সেভ করতে সমস্যা হয়েছে: ${error.message}`,
        });
    } finally {
        setIsSaving(false);
        setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">সেটিংস</h1>
        <p className="text-muted-foreground">
          প্রতিষ্ঠানের সাধারণ তথ্য পরিবর্তন করুন।
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>প্রতিষ্ঠানের তথ্য</CardTitle>
          <CardDescription>
            এখানে আপনার প্রতিষ্ঠানের নাম ও লোগো পরিবর্তন করতে পারবেন।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="institution-name">প্রতিষ্ঠানের নাম</Label>
            <Input
              id="institution-name"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">প্রতিষ্ঠানের লোগো</Label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <Image
                  src={logoPreview}
                  alt="Logo Preview"
                  width={80}
                  height={80}
                  className="rounded-md border p-1 object-cover"
                  data-ai-hint="education logo"
                />
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="max-w-xs"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
            {isSaving && logoFile && (
                <div className="w-full text-left">
                    <Progress value={uploadProgress} className="w-full max-w-sm" />
                    <p className="text-xs text-muted-foreground mt-1">
                    {uploadProgress < 100 ? `লোগো আপলোড হচ্ছে... ${Math.round(uploadProgress)}%` : 'সেটিংস সেভ হচ্ছে...'}
                    </p>
                </div>
            )}
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
