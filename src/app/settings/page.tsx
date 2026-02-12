'use client';
import { useState } from 'react';
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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    PlaceHolderImages.find((p) => p.id === 'logo-placeholder')?.imageUrl || null
  );

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
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
              defaultValue="টপ গ্রেড টিউটোরিয়ালস"
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
                  className="rounded-md border p-1"
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
          <Button>
            <Save className="mr-2 h-4 w-4" />
            সেভ করুন
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
