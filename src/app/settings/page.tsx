
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
import { Save, Loader2, User as UserIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useAuth, useCollection, errorEmitter, FirestorePermissionError, useFirebaseApp } from '@/firebase';
import { doc, setDoc, updateDoc, collection, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, updateProfile, type User } from 'firebase/auth';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { compressImage } from '@/lib/utils';

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

const permissionsList = [
    { id: 'dashboard', label: 'ড্যাসবোর্ড' },
    { id: 'students', label: 'শিক্ষার্থী' },
    { id: 'teachers', label: 'শিক্ষক' },
    { id: 'accounting', label: 'হিসাব' },
    { id: 'attendance', label: 'হাজিরা' },
    { id: 'datastore', label: 'প্রশ্ন জেনারেটর' },
    { id: 'marksheet', label: 'মার্কশিট' },
    { id: 'board-books', label: 'বোর্ড বই' },
    { id: 'settings', label: 'সেটিংস' },
];

function ManagePermissionsDialog({ user, isOpen, onOpenChange, onSaveSuccess }: { user: UserRole | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onSaveSuccess: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.permissions) {
            setPermissions(user.permissions);
        } else if (user) {
            // If no permissions are set, default them for a teacher
            const defaultPerms = permissionsList.reduce((acc, p) => ({ ...acc, [p.id]: p.id !== 'settings' }), {});
            setPermissions(defaultPerms);
        }
    }, [user]);

    if (!user) return null;

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        setPermissions(prev => ({ ...prev, [permissionId]: checked }));
    };

    const handleSave = () => {
        if (!firestore || !user) return;
        setIsSaving(true);
        
        const userRoleRef = doc(firestore, 'user_roles', user.id);
        const updatedPermissions = { permissions };
        
        updateDoc(userRoleRef, updatedPermissions)
            .then(() => {
                toast({ title: 'সফল', description: `${user.name}-এর পারমিশন আপডেট করা হয়েছে।` });
                onSaveSuccess();
                onOpenChange(false);
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userRoleRef.path,
                    operation: 'update',
                    requestResourceData: updatedPermissions,
                }));
            })
            .finally(() => {
                setIsSaving(false);
            });
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>পারমিশন ম্যানেজ করুন: {user.name}</DialogTitle>
                    <DialogDescription>
                        এই শিক্ষক কোন কোন সেকশন ব্যবহার করতে পারবেন তা নির্ধারণ করুন।
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {permissionsList.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`perm-${permission.id}`}
                                checked={permissions[permission.id] || false}
                                onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                disabled={isSaving}
                            />
                            <label
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {permission.label}
                            </label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        সেভ করুন
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UserManagementCard() {
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();

    const userRolesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'user_roles');
    }, [firestore]);
    const { data: userRoles, isLoading: isLoadingUserRoles, forceRefetch } = useCollection<UserRole>(userRolesQuery);

    const [isSavingRole, setIsSavingRole] = useState<Record<string, boolean>>({});
    
    const [userToManagePerms, setUserToManagePerms] = useState<UserRole | null>(null);
    const [isPermsDialogOpen, setIsPermsDialogOpen] = useState(false);
    
    const [userToDelete, setUserToDelete] = useState<UserRole | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleRoleChange = (userId: string, newRole: 'admin' | 'teacher') => {
        if (!firestore) return;

        setIsSavingRole(prev => ({ ...prev, [userId]: true }));
        const userRoleRef = doc(firestore, 'user_roles', userId);
        const updatedRole = { role: newRole };
        
        updateDoc(userRoleRef, updatedRole)
            .then(() => {
                toast({ title: 'সফল', description: 'ব্যবহারকারীর ভূমিকা আপডেট করা হয়েছে।' });
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userRoleRef.path,
                    operation: 'update',
                    requestResourceData: updatedRole,
                }));
            })
            .finally(() => {
                setIsSavingRole(prev => ({ ...prev, [userId]: false }));
            });
    };
    
    const handleDeleteUser = () => {
        if (!firestore || !userToDelete) return;
        setIsDeleting(true);
        const userRoleRef = doc(firestore, 'user_roles', userToDelete.id);
        
        deleteDoc(userRoleRef)
            .then(() => {
                toast({ title: 'সফল', description: `${userToDelete.name}-কে সফলভাবে ডিলিট করা হয়েছে।` });
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userRoleRef.path,
                    operation: 'delete',
                }));
            })
            .finally(() => {
                setIsDeleting(false);
            });
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
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-bold text-slate-900 dark:text-slate-100">ব্যবহারকারী ম্যানেজমেন্ট</CardTitle>
                    <CardDescription>ব্যবহারকারীদের ভূমিকা নির্ধারণ এবং পারমিশন ম্যানেজ করুন।</CardDescription>
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
                                            disabled={isSavingRole[userRole.id] || auth.currentUser?.uid === userRole.id}
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
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={auth.currentUser?.uid === userRole.id}>
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    onClick={() => { setUserToManagePerms(userRole); setIsPermsDialogOpen(true); }}
                                                    disabled={userRole.role === 'admin'}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    <span>পারমিশন ম্যানেজ</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-destructive" 
                                                    onClick={() => { setUserToDelete(userRole); setIsDeleteDialogOpen(true); }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>ডিলিট করুন</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ManagePermissionsDialog 
                user={userToManagePerms}
                isOpen={isPermsDialogOpen}
                onOpenChange={(open) => {
                    if (!open) setUserToManagePerms(null);
                    setIsPermsDialogOpen(open);
                }}
                onSaveSuccess={forceRefetch}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                        <AlertDialogDescription>
                            আপনি {userToDelete?.name}-কে ডিলিট করতে যাচ্ছেন। এই কাজটি আর ফেরানো যাবে না।
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>বাতিল</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            ডিলিট করুন
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
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
    const [isMigrating, setIsMigrating] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);

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
        if (firestore && user && user?.email && userRole && !userRole.imageUrl && userRole.role === 'teacher' && !isLoadingUserRole && !isMigrating) {
            const migrateImageUrl = async () => {
                setIsMigrating(true);
                try {
                    const teachersRef = collection(firestore, 'teachers');
                    const q = query(teachersRef, where('email', '==', user.email));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const teacherDoc = querySnapshot.docs[0];
                        const teacherData = teacherDoc.data();
                        if (teacherData?.imageUrl) {
                            const userRoleRefToUpdate = doc(firestore, 'user_roles', user.uid);
                            await updateDoc(userRoleRefToUpdate, { 
                                imageUrl: teacherData.imageUrl,
                                imageHint: teacherData.imageHint || 'teacher person'
                            });
                            toast({ title: 'প্রোফাইল ছবি আপডেট', description: 'আপনার প্রোফাইল ছবি সিঙ্ক করা হয়েছে।' });
                        }
                    }
                } catch (err) {
                    console.error("Failed to migrate image URL:", err);
                } finally {
                    setIsMigrating(false);
                }
            };
            migrateImageUrl();
        }
    }, [firestore, user, userRole, isLoadingUserRole, isMigrating, toast]);


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
            setIsCompressing(true);
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
            } finally {
                setIsCompressing(false);
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
            };
    
            if (imagePreview) {
                userData.imageUrl = imagePreview;
                userData.imageHint = 'person face';
            }
    
            setDoc(userRoleRef, userData, { merge: true })
                .then(async () => {
                    await user.getIdToken(true);
                    toast({ title: 'সফল', description: 'আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে।' });
                })
                .catch(() => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userRoleRef.path,
                        operation: 'update',
                        requestResourceData: userData,
                    }));
                })
                .finally(() => {
                    setIsSaving(false);
                });
    
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "ত্রুটি",
                description: `প্রোফাইল আপডেট করতে সমস্যা হয়েছে: ${error.message}`,
            });
            setIsSaving(false);
        }
    };

    const isLoading = isSaving || isLoadingUserRole || isMigrating || isCompressing;
    const buttonText = isSaving ? 'সেভ হচ্ছে...' : isCompressing ? 'ছবি প্রসেস হচ্ছে...' : isMigrating ? 'তথ্য সিঙ্ক হচ্ছে...' : 'প্রোফাইল সেভ করুন';

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
                    {buttonText}
                </Button>
            </CardFooter>
        </Card>
    );
}


function InstitutionSettingsCard({ userRole, isLoadingUserRole }: { userRole: UserRole | null | undefined, isLoadingUserRole: boolean }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [institutionName, setInstitutionName] = useState('টপ গ্রেড টিউটোরিয়ালস');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);

    const isAdmin = userRole?.role === 'admin';
  
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
            setIsCompressing(true);
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
            } finally {
              setIsCompressing(false);
            }
        }
    };

    const handleSave = () => {
        if (!settingsRef || !isAdmin) return;
        setIsSaving(true);
        const settingsData: Partial<InstitutionSettings & {lastUpdated: string}> = {
            institutionName: institutionName,
            lastUpdated: new Date().toISOString(),
            logoUrl: logoUrl,
        };
        setDoc(settingsRef, settingsData, { merge: true })
            .then(() => {
                toast({
                    title: 'সফল',
                    description: 'প্রতিষ্ঠানের তথ্য সেভ করা হয়েছে।',
                });
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'write',
                    requestResourceData: settingsData,
                }))
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    const isButtonLoading = isSaving || isLoading || isCompressing || isLoadingUserRole;
    const buttonText = isSaving || isLoading ? 'সেভ হচ্ছে...' : isCompressing ? 'লোগো প্রসেস হচ্ছে...' : 'সেভ করুন';


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
                    disabled={isButtonLoading || !isAdmin}
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
                        disabled={isButtonLoading || !isAdmin}
                    />
                    </div>
                </div>
                </div>
            </CardContent>
            {isAdmin && (
                <CardFooter>
                    <Button onClick={handleSave} disabled={isButtonLoading}>
                        {isButtonLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {buttonText}
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

function FirebaseProjectCard({ userRole, isLoadingUserRole }: { userRole: UserRole | null | undefined, isLoadingUserRole: boolean }) {
    const { toast } = useToast();
    const firebaseApp = useFirebaseApp();
    const [newProjectId, setNewProjectId] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const currentProjectId = firebaseApp?.options.projectId;
    const isAdmin = userRole?.role === 'admin';

    const handleConnect = () => {
        if (!newProjectId) {
            toast({
                variant: 'destructive',
                title: 'ত্রুটি',
                description: 'অনুগ্রহ করে একটি ফায়ারবেস প্রজেক্ট আইডি দিন।',
            });
            return;
        }
        setIsConnecting(true);
        
        toast({
            title: 'সংযোগ করা হচ্ছে...',
            description: `আপনার অ্যাপটি "${newProjectId}" প্রজেক্টের সাথে সংযোগ করা হচ্ছে। এটি সম্পন্ন হলে আপনাকে জানানো হবে।`,
        });

        // In a real scenario, this would trigger a backend call which then uses UpdateFirebaseProjectTool
        // For this prototype, we inform the user what will happen.
        setTimeout(() => {
            setIsConnecting(false);
            toast({
                title: 'সংযোগের জন্য অনুরোধ করা হয়েছে',
                description: `Firebase Studio এখন আপনার অ্যাপটিকে নতুন প্রজেক্টের সাথে কনফিগার করবে। এটি কয়েক মুহূর্ত সময় নিতে পারে।`,
            });
        }, 2000);
    };

    const isLoading = isLoadingUserRole || isConnecting;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-bold text-slate-900 dark:text-slate-100">ফায়ারবেস প্রজেক্ট কনফিগারেশন</CardTitle>
                <CardDescription>আপনার সফটওয়্যারটি অন্য কোনো ফায়ারবেস প্রজেক্টের সাথে সংযোগ করতে এখানে নতুন প্রজেক্ট আইডি দিন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="current-project-id" className="text-slate-700 dark:text-slate-300">বর্তমান প্রজেক্ট আইডি</Label>
                    <Input
                        id="current-project-id"
                        value={currentProjectId || 'লোড হচ্ছে...'}
                        readOnly
                        className="bg-slate-100 dark:bg-slate-800"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="project-id" className="text-slate-700 dark:text-slate-300">নতুন ফায়ারবেস প্রজেক্ট আইডি</Label>
                    <Input
                        id="project-id"
                        value={newProjectId}
                        onChange={(e) => setNewProjectId(e.target.value)}
                        placeholder="আপনার ফায়ারবেস প্রজেক্ট আইডি দিন"
                        disabled={isLoading || !isAdmin}
                    />
                </div>
            </CardContent>
            {isAdmin && (
                <CardFooter>
                    <Button onClick={handleConnect} disabled={isLoading}>
                        {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        সংযোগ করুন
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
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
                 <InstitutionSettingsCard userRole={userRole} isLoadingUserRole={isLoadingUserRole} />
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
                <div className="space-y-8 mt-8">
                    <UserManagementCard />
                    <FirebaseProjectCard userRole={userRole} isLoadingUserRole={isLoadingUserRole} />
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
