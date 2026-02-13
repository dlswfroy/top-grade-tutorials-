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
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

export default function SettingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [institutionName, setInstitutionName] = useState('টপ গ্রেড টিউটোরিয়ালস');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
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
        setLogoUrl(settings.logoUrl);
      }
    }
  }, [settings]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
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
                resolve(canvas.toDataURL('image/jpeg', 0.9)); // Adjust quality as needed
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Firestore document field size limit is approx 1MB. We check for a slightly smaller size.
      if (file.size > 1000000) { 
        try {
          toast({ title: 'ছবি প্রসেস করা হচ্ছে...', description: 'বড় ছবি সংকুচিত করতে কয়েক মুহূর্ত সময় লাগতে পারে।' });
          const compressedDataUrl = await compressImage(file);
          setLogoUrl(compressedDataUrl);
        } catch (error) {
          console.error("Image compression failed:", error);
          toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "ছবিটি সংকুচিত করতে সমস্যা হয়েছে। অনুগ্রহ করে ১MB এর ছোট ফাইল আপলোড করুন।",
          });
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = async () => {
    if (!settingsRef || !user) return;

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
              {logoUrl && (
                <Image
                  src={logoUrl}
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
