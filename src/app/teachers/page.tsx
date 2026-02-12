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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { type Teacher } from '@/lib/data';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const defaultTeacherState: Omit<Teacher, 'id' | 'dateAdded'> = {
    name: '',
    mobileNumber: '',
    imageUrl: '',
    imageHint: '',
};

export default function TeachersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultTeacherState);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const teachersQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'teachers');
  }, [firestore]);

  const { data: teachers, isLoading } = useCollection<Teacher>(teachersQuery);

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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      // In a real app, upload this and set formData.imageUrl
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveTeacher = () => {
    if (!firestore) return;

    if (!formData.name || !formData.mobileNumber) {
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "অনুগ্রহ করে শিক্ষকের নাম এবং মোবাইল নম্বর দিন।",
        });
        return;
    }

    if (editingTeacher) {
        const teacherRef = doc(firestore, 'teachers', editingTeacher.id);
        updateDocumentNonBlocking(teacherRef, formData);
        toast({
            title: "সফল",
            description: `${formData.name}-এর তথ্য আপডেট করা হয়েছে।`,
        });
    } else {
        const teacherData = {
            ...formData,
            dateAdded: new Date().toISOString(),
            imageUrl: `https://picsum.photos/seed/${formData.mobileNumber}/200/200`,
            imageHint: 'teacher person',
        };
        addDocumentNonBlocking(collection(firestore, 'teachers'), teacherData);
        toast({
            title: "সফল",
            description: `${formData.name} কে শিক্ষক হিসেবে যোগ করা হয়েছে।`,
        });
    }

    setIsDialogOpen(false);
  };

  const handleDeleteTeacher = (teacherId: string, teacherName: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'teachers', teacherId));
    toast({
        title: "সফল",
        description: `${teacherName} কে তালিকা থেকে মুছে ফেলা হয়েছে।`,
    });
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">শিক্ষক ম্যানেজমেন্ট</h1>
        <p className="text-muted-foreground">
          নতুন শিক্ষক যোগ করুন এবং তাদের তথ্য দেখুন।
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>শিক্ষকদের তালিকা</CardTitle>
              <CardDescription>
                এখানে সকল নিবন্ধিত শিক্ষকের তালিকা দেখুন।
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  নতুন শিক্ষক
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingTeacher ? 'শিক্ষকের তথ্য এডিট করুন' : 'নতুন শিক্ষক যোগ করুন'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">নাম</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="শিক্ষকের নাম" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobileNumber" className="text-right">মোবাইল</Label>
                    <Input id="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} placeholder="মোবাইল নম্বর" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="picture" className="text-right">ছবি</Label>
                    <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
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
                  <Button onClick={handleSaveTeacher}>সেভ করুন</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                            <AvatarImage src={teacher.imageUrl} data-ai-hint={teacher.imageHint} alt={teacher.name} />
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
    </div>
  );
}
