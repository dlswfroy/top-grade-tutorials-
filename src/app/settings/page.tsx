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
import { Save, Loader2, Shield, Users } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { collection } from 'firebase/firestore';
import { UserRole } from '@/lib/data';

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

function UserManagementCard() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'user_roles');
    }, [firestore]);

    const { data: users, isLoading } = useCollection<UserRole>(usersQuery);

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'teacher') => {
        if (!firestore) return;
        try {
            const userDocRef = doc(firestore, 'user_roles', userId);
            await updateDoc(userDocRef, { role: newRole });
            toast({ title: 'সফল', description: 'ব্যবহারকারীর ভূমিকা পরিবর্তন করা হয়েছে।' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: `ভূমিকা পরিবর্তনে সমস্যা হয়েছে: ${error.message}` });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>ব্যবহারকারী ব্যবস্থাপনা</CardTitle>
                <CardDescription>
                    ব্যবহারকারীদের ভূমিকা নির্ধারণ করুন। এডমিনরা সকল কিছু পরিবর্তন করতে পারে।
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>নাম</TableHead>
                                <TableHead>ইমেইল</TableHead>
                                <TableHead className="w-[180px]">ভূমিকা</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.role}
                                            onValueChange={(value: 'admin' | 'teacher') => handleRoleChange(user.id, value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">এডমিন</SelectItem>
                                                <SelectItem value="teacher">টিচার</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function SettingsPage() {
    const { role } = useUser();

    if (role && role !== 'admin') {
        return (
            <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertTitle>প্রবেশাধিকার নেই</AlertTitle>
                <AlertDescription>
                এই পেজটি দেখার জন্য আপনার অনুমতি নেই। শুধুমাত্র এডমিন এই পেজটি দেখতে পারবেন।
                </AlertDescription>
            </Alert>
        );
    }
  
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">সেটিংস</h1>
                <p className="text-muted-foreground">
                প্রতিষ্ঠানের সাধারণ তথ্য এবং ব্যবহারকারীদের ভূমিকা পরিচালনা করুন।
                </p>
            </div>
            <UserManagementCard />
            <InstitutionSettingsCard />
        </div>
    );
}

export default function SettingsPageContainer() {
    return (
        <SettingsPage />
    )
}
