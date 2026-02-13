'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { type Teacher } from '@/lib/data';
import { MoreHorizontal, Pencil, Trash2, Loader2, Save, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestore, useCollection, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const defaultTeacherState: Omit<Teacher, 'id' | 'dateAdded'> = {
    name: '',
    mobileNumber: '',
    imageUrl: '',
    imageHint: 'teacher person',
};

export default function TeachersPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Teacher, 'id' | 'dateAdded'>>(defaultTeacherState);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const teachersQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return collection(firestore, 'teachers');
  }, [firestore, user]);

  const { data: teachers, isLoading } = useCollection<Teacher>(teachersQuery);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, imageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveTeacher = async () => {
    if (!firestore || !auth) return;

    if (!formData.name || !formData.mobileNumber) {
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "অনুগ্রহ করে শিক্ষকের নাম এবং মোবাইল নম্বর দিন।",
        });
        return;
    }

    setIsSaving(true);

    try {
        if (editingTeacher) {
            const teacherData = {
                name: formData.name,
                mobileNumber: formData.mobileNumber,
                imageUrl: formData.imageUrl,
            };
            const docRef = doc(firestore, 'teachers', editingTeacher.id);
            await updateDoc(docRef, teacherData);
            toast({ title: "সফল", description: `${formData.name}-এর তথ্য আপডেট করা হয়েছে।` });
        } else {
            if (!email || !password) {
                toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।' });
                setIsSaving(false);
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newTeacherUser = userCredential.user;
            await updateProfile(newTeacherUser, { displayName: formData.name });

            const teacherData = {
                name: formData.name,
                mobileNumber: formData.mobileNumber,
                imageUrl: formData.imageUrl || `https://picsum.photos/seed/${newTeacherUser.uid}/200/200`,
                imageHint: formData.imageHint || 'teacher person',
                dateAdded: new Date().toISOString()
            };

            await setDoc(doc(firestore, 'teachers', newTeacherUser.uid), teacherData);
            await setDoc(doc(firestore, 'roles_teacher', newTeacherUser.uid), { active: true });
            
            toast({ title: "সফল", description: `${formData.name} কে শিক্ষক হিসেবে যোগ করা হয়েছে।` });
        }
        
        handleCloseDialog();
      
    } catch (error: any) {
        console.error("Error saving teacher:", error);
        let errorMessage = 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'এই ইমেইল ঠিকানাটি দিয়ে ইতিমধ্যে একটি একাউন্ট তৈরি করা আছে।';
                break;
            case 'auth/weak-password':
                errorMessage = 'পাসওয়ার্ডটি যথেষ্ট শক্তিশালী নয়। কমপক্ষে ৬টি অক্ষর ব্যবহার করুন।';
                break;
            case 'auth/invalid-email':
                errorMessage = 'আপনার দেওয়া ইমেইল ঠিকানাটি সঠিক নয়।';
                break;
        }
        toast({ 
            variant: "destructive", 
            title: "ত্রুটি", 
            description: errorMessage 
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, 'teachers', teacherId));
        await deleteDoc(doc(firestore, 'roles_teacher', teacherId));
        toast({ title: "সফল", description: `${teacherName} কে তালিকা থেকে মুছে ফেলা হয়েছে।` });
    } catch (error: any) {
        console.error("Error deleting teacher:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: `শিক্ষককে মুছে ফেলতে সমস্যা হয়েছে: ${error.message}` });
    }
  };

  const handleOpenDialog = (teacher: Teacher | null) => {
    setEditingTeacher(teacher);
    if(teacher) {
        setFormData(teacher);
        setImagePreview(teacher.imageUrl || null);
    }
    setIsDialogOpen(true);
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTeacher(null);
    setFormData(defaultTeacherState);
    setImagePreview(null);
    setEmail('');
    setPassword('');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">শিক্ষক ম্যানেজমেন্ট</h1>
        <p className="text-muted-foreground">
          নিবন্ধিত শিক্ষকদের তথ্য দেখুন এবং সম্পাদনা করুন।
        </p>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setIsDialogOpen(true); }}>
        <Card>
            <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                <CardTitle>শিক্ষকদের তালিকা</CardTitle>
                <CardDescription>
                    এখানে সকল নিবন্ধিত শিক্ষকের তালিকা দেখুন।
                </CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        নতুন শিক্ষক
                    </Button>
                </DialogTrigger>
            </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>ছবি</TableHead>
                            <TableHead>নাম</TableHead>
                            <TableHead>মোবাইল নম্বর</TableHead>
                            <TableHead className="text-center">একশন</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {teachers?.map((teacher) => (
                            <TableRow key={teacher.id}>
                            <TableCell>
                                <Avatar>
                                <AvatarImage src={teacher.imageUrl || `https://picsum.photos/seed/${teacher.mobileNumber}/200/200`} data-ai-hint={teacher.imageHint} alt={teacher.name} />
                                <AvatarFallback>{teacher.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{teacher.name}</TableCell>
                            <TableCell>{teacher.mobileNumber}</TableCell>
                            <TableCell className="text-center">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenDialog(teacher)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>এডিট</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>ডিলিট</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{editingTeacher ? 'শিক্ষকের তথ্য এডিট করুন' : 'নতুন শিক্ষক যোগ করুন'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                {!editingTeacher && (
                    <>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">ইমেইল</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="শিক্ষকের ইমেইল" className="col-span-3" disabled={isSaving} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">পাসওয়ার্ড</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="নতুন পাসওয়ার্ড" className="col-span-3" disabled={isSaving} />
                        </div>
                    </>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">নাম</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="শিক্ষকের নাম" className="col-span-3" disabled={isSaving} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobileNumber" className="text-right">মোবাইল</Label>
                    <Input id="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} placeholder="মোবাইল নম্বর" className="col-span-3" disabled={isSaving} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="picture" className="text-right">ছবি</Label>
                    <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" disabled={isSaving} />
                </div>
                {imagePreview && (
                    <div className="grid grid-cols-4 items-center gap-4">
                    <div className="col-start-2 col-span-3">
                        <Image src={imagePreview} alt="Image Preview" width={100} height={100} className="rounded-md object-cover" />
                    </div>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button onClick={handleSaveTeacher} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </div>
  );
}
