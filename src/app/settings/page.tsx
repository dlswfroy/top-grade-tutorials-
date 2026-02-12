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
import { Save } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [institutionName, setInstitutionName] = useState('টপ গ্রেড টিউটোরিয়ালস');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
        setLogoPreview(settings.logoUrl);
      }
    }
  }, [settings]);


  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
      // In a real app, you would upload this file to Firebase Storage 
      // and get the URL to save in Firestore.
    }
  };

  const handleSave = () => {
    if (!settingsRef) return;
    
    // For now, we only save the institution name.
    // Logo saving requires file upload to storage which is a more complex setup.
    const settingsData = {
        institutionName: institutionName,
        lastUpdated: new Date().toISOString(),
        // In a real app, you'd get this from your storage service after upload
        // logoUrl: logoPreview 
    };

    setDocumentNonBlocking(settingsRef, settingsData, { merge: true });

    toast({
        title: 'সফল',
        description: 'সেটিংস সফলভাবে সেভ করা হয়েছে।',
    });
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
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="max-w-xs"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            সেভ করুন
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
