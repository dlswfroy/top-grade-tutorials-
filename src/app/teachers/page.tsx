'use client';
import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { type Teacher } from '@/lib/data';
import { PlusCircle, Search, MoreHorizontal, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const defaultTeacherState: Omit<Teacher, 'id' | 'dateAdded'> = {
  name: '',
  subject: '',
  mobileNumber: '',
  email: '',
  imageUrl: '',
  imageHint: 'teacher person',
};

function TeachersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultTeacherState);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const teachersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'teachers');
  }, [firestore]);

  const { data: teachers, isLoading } = useCollection<Teacher>(teachersQuery);
  
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
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
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
  };

  useEffect(() => {
    if (editingTeacher) {
        setFormData(editingTeacher);
        if (editingTeacher.imageUrl) {
            setImagePreview(editingTeacher.imageUrl);
        }
    } else {
        setFormData(defaultTeacherState);
        setImagePreview(null);
    }
  }, [editingTeacher]);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        try {
          toast({ title: 'ছবি প্রসেস করা হচ্ছে...', description: 'ছবি সংকুচিত করতে কয়েক মুহূর্ত সময় লাগতে পারে।' });
          const compressedDataUrl = await compressImage(file);
          setImagePreview(compressedDataUrl);
          setFormData(prev => ({ ...prev, imageUrl: compressedDataUrl }));
        } catch (error) {
          console.error("Image compression failed:", error);
          toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "ছবিটি সংকুচিত করতে সমস্যা হয়েছে।",
          });
        }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSaveTeacher = async () => {
    if (!firestore) return;

    if (!formData.name || !formData.subject) {
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "অনুগ্রহ করে শিক্ষকের নাম এবং বিষয় পূরণ করুন।",
        });
        return;
    }

    setIsSaving(true);

    try {
        const teacherData = {
            name: formData.name,
            subject: formData.subject,
            mobileNumber: formData.mobileNumber,
            email: formData.email,
            imageUrl: formData.imageUrl,
            imageHint: formData.imageHint || 'teacher person',
        };

        if (editingTeacher) {
            await updateDoc(doc(firestore, 'teachers', editingTeacher.id), teacherData);
            toast({ title: "সফল", description: `${formData.name}-এর তথ্য আপডেট করা হয়েছে।` });
        } else {
            await addDoc(collection(firestore, 'teachers'), { 
                ...teacherData,
                dateAdded: new Date().toISOString()
            });
            toast({ title: "সফল", description: `${formData.name} কে শিক্ষক হিসেবে যোগ করা হয়েছে।` });
        }
        
        handleCloseDialog();

    } catch (error: any) {
        console.error("Error saving teacher:", error);
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: `শিক্ষকের তথ্য সেভ করতে সমস্যা হয়েছে: ${error.message}`,
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, 'teachers', teacherId));
        toast({ title: "সফল", description: `${teacherName} কে তালিকা থেকে মুছে ফেলা হয়েছে।` });
    } catch(error: any) {
        console.error("Error deleting teacher:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: `শিক্ষককে মুছে ফেলতে সমস্যা হয়েছে: ${error.message}` });
    }
  };

  const handleOpenDialog = (teacher: Teacher | null) => {
    setEditingTeacher(teacher);
    setIsDialogOpen(true);
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTeacher(null);
    setFormData(defaultTeacherState);
    setImagePreview(null);
  }

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };

  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    return teachers.filter(
      (teacher) =>
        activeSearchTerm === '' ||
         teacher.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
         teacher.subject.toLowerCase().includes(activeSearchTerm.toLowerCase())
    );
  }, [teachers, activeSearchTerm]);
  

  return (
    <div className="space-y-8 p-8 rounded-xl bg-indigo-100/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-indigo-800 dark:text-indigo-200">শিক্ষক ম্যানেজমেন্ট</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="নাম বা বিষয় দিয়ে খুঁজুন..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              অনুসন্ধান
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setIsDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog(null)} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  নতুন শিক্ষক
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-bold text-slate-800 dark:text-slate-200">{editingTeacher ? 'শিক্ষকের তথ্য এডিট করুন' : 'নতুন শিক্ষক যোগ করুন'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Form Inputs */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-slate-700 dark:text-slate-300">নাম</Label>
                    <Input id="name" value={formData.name || ''} onChange={handleInputChange} placeholder="শিক্ষকের নাম" className="col-span-3" disabled={isSaving} />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right text-slate-700 dark:text-slate-300">বিষয়</Label>
                    <Input id="subject" value={formData.subject || ''} onChange={handleInputChange} placeholder="বিষয়" className="col-span-3" disabled={isSaving} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobileNumber" className="text-right text-slate-700 dark:text-slate-300">মোবাইল</Label>
                    <Input id="mobileNumber" value={formData.mobileNumber || ''} onChange={handleInputChange} placeholder="মোবাইল নম্বর" className="col-span-3" disabled={isSaving} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right text-slate-700 dark:text-slate-300">ইমেইল</Label>
                    <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} placeholder="ইমেইল" className="col-span-3" disabled={isSaving} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="picture" className="text-right text-slate-700 dark:text-slate-300">ছবি</Label>
                    <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" disabled={isSaving} />
                  </div>
                  {imagePreview && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="col-start-2 col-span-3">
                         <img src={imagePreview} alt="Image Preview" width={100} height={100} className="rounded-md object-cover" />
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
        </CardHeader>
        <CardContent className="pt-4">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="font-bold text-indigo-700 dark:text-indigo-300">ছবি</TableHead>
                        <TableHead className="font-bold text-indigo-700 dark:text-indigo-300">নাম</TableHead>
                        <TableHead className="font-bold text-indigo-700 dark:text-indigo-300">বিষয়</TableHead>
                        <TableHead className="font-bold text-indigo-700 dark:text-indigo-300">মোবাইল</TableHead>
                        <TableHead className="font-bold text-indigo-700 dark:text-indigo-300">ইমেইল</TableHead>
                        <TableHead className="text-center font-bold text-indigo-700 dark:text-indigo-300">একশন</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredTeachers?.map((teacher) => (
                        <TableRow key={teacher.id}>
                        <TableCell>
                            <Avatar>
                            <AvatarImage src={teacher.imageUrl} data-ai-hint={teacher.imageHint || 'teacher person'} alt={teacher.name} />
                            <AvatarFallback>{teacher.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium text-gray-800 dark:text-gray-200">{teacher.name}</TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">{teacher.subject}</TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">{teacher.mobileNumber}</TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">{teacher.email || 'N/A'}</TableCell>
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
    </div>
  );
}

export default TeachersPage;
