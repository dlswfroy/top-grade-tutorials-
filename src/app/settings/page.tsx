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
import { Save, Loader2 } from 'lucide-react';
import { useFirebaseApp, useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, DocumentReference, DocumentData, updateDoc } from 'firebase/firestore';
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

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    }
  }, [logoPreview]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
       if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadAndSaveUrl = (file: File, docRef: DocumentReference<DocumentData>) => {
    if (!firebaseApp) return;
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, `institution_assets/logo_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const { id: toastId, update: updateToast, dismiss: dismissToast } = toast({
      title: "লোগো আপলোড হচ্ছে...",
      description: `0% সম্পন্ন হয়েছে।`,
    });

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        updateToast({ description: `${Math.round(progress)}% সম্পন্ন হয়েছে।` });
      },
      (error) => {
        console.error('Upload failed:', error);
        updateToast({
          variant: 'destructive',
          title: 'লোগো আপলোড ব্যর্থ',
          description: `লোগোটি আপলোড করা যায়নি।`,
        });
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(docRef, { logoUrl: downloadURL });
          updateToast({
            title: 'লোগো আপলোড সফল',
            description: 'প্রতিষ্ঠানের লোগো সফলভাবে আপলোড হয়েছে।',
          });
          setTimeout(() => dismissToast(), 5000);
        } catch (error: any) {
          console.error('Failed to update logo URL:', error);
          updateToast({
            variant: 'destructive',
            title: 'ত্রুটি',
            description: `লোগোর URL সেভ করতে সমস্যা হয়েছে: ${error.message}`,
          });
        }
      }
    );
  };

  const handleSave = async () => {
    if (!settingsRef || !firebaseApp || !user) return;

    setIsSaving(true);
    
    try {
        const settingsData = {
            institutionName: institutionName,
            lastUpdated: new Date().toISOString(),
            logoUrl: logoPreview,
        };

        await setDoc(settingsRef, settingsData, { merge: true });
        toast({
            title: 'সফল',
            description: 'সেটিংস সফলভাবে সেভ করা হয়েছে।',
        });
        
        if (logoFile) {
            uploadAndSaveUrl(logoFile, settingsRef);
        }
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
              disabled={isSaving || isLoading}
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
                  disabled={isSaving || isLoading}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
