'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { classNames, type Student } from '@/lib/data';
import { PlusCircle, Search, MoreHorizontal, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirebaseApp, useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const defaultStudentState: Omit<Student, 'id' | 'dateAdded'> = {
  name: '',
  classGrade: '',
  rollNumber: '',
  fatherName: '',
  mobileNumber: '',
  monthlyFee: 0,
  imageUrl: '',
  imageHint: 'student person',
};

export default function StudentsPage() {
  const firebaseApp = useFirebaseApp();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [activeClassFilter, setActiveClassFilter] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState(defaultStudentState);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'students');
  }, [firestore, user]);

  const { data: students, isLoading } = useCollection<Student>(studentsQuery);
  
  useEffect(() => {
    if (editingStudent) {
        setFormData(editingStudent);
        if (editingStudent.imageUrl) {
            setImagePreview(editingStudent.imageUrl);
        }
    } else {
        setFormData(defaultStudentState);
        setImagePreview(null);
    }
    setImageFile(null);
  }, [editingStudent]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    }
  }, [imagePreview]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, classGrade: value }));
  };
  
  const handleSaveStudent = async () => {
    if (!firestore || !user) return;

    if (!formData.name || !formData.classGrade || !formData.rollNumber) {
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: "অনুগ্রহ করে সকল আবশ্যকীয় তথ্য পূরণ করুন।",
        });
        return;
    }

    setIsSaving(true);

    try {
        let docRef: DocumentReference;
        const dataToSave = {
            name: formData.name,
            classGrade: formData.classGrade,
            rollNumber: formData.rollNumber,
            fatherName: formData.fatherName,
            mobileNumber: formData.mobileNumber,
            monthlyFee: Number(formData.monthlyFee) || 0,
            imageHint: formData.imageHint || 'student person',
        };

        if (editingStudent) {
            docRef = doc(firestore, 'students', editingStudent.id);
            await updateDoc(docRef, dataToSave);
            toast({ title: "সফল", description: `${formData.name}-এর তথ্য আপডেট করা হয়েছে।` });
        } else {
            const finalData = { 
                ...dataToSave, 
                imageUrl: `https://picsum.photos/seed/${formData.rollNumber}/200/200`,
                dateAdded: new Date().toISOString() 
            };
            docRef = await addDoc(collection(firestore, 'students'), finalData);
            toast({ title: "সফল", description: `${formData.name} কে শিক্ষার্থী হিসেবে যোগ করা হয়েছে।` });
        }
        
        handleCloseDialog();

        if (imageFile && firebaseApp) {
            const fileToUpload = imageFile;
            const documentRef = docRef;

            const { id: toastId, update, dismiss } = toast({
                title: "ছবি আপলোড হচ্ছে...",
                description: "শুরু হচ্ছে...",
            });

            const storage = getStorage(firebaseApp);
            const storageRef = ref(storage, `student_images/${Date.now()}_${fileToUpload.name}`);
            const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    update({ description: `${Math.round(progress)}% সম্পন্ন হয়েছে।` });
                },
                (error) => {
                    console.error("Upload failed:", error);
                    update({ variant: 'destructive', title: 'আপলোড ব্যর্থ', description: `ছবিটি আপলোড করা যায়নি।` });
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        await updateDoc(documentRef, { imageUrl: downloadURL });
                        update({ title: 'আপলোড সফল', description: 'ছবি সফলভাবে আপলোড হয়েছে।' });
                        setTimeout(() => dismiss(toastId), 3000);
                    } catch (error) {
                        console.error('Failed to get download URL or update doc:', error);
                        update({ variant: 'destructive', title: 'আপডেট ব্যর্থ', description: `ছবি আপলোড হলেও তথ্য আপডেট করা যায়নি।` });
                    }
                }
            );
        }

    } catch (error: any) {
        console.error("Error saving student:", error);
        toast({
            variant: "destructive",
            title: "ত্রুটি",
            description: `শিক্ষার্থীর তথ্য সেভ করতে সমস্যা হয়েছে: ${error.message}`,
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, 'students', studentId));
        toast({ title: "সফল", description: `${studentName} কে তালিকা থেকে মুছে ফেলা হয়েছে।` });
    } catch(error: any) {
        console.error("Error deleting student:", error);
        toast({ variant: "destructive", title: "ত্রুটি", description: `শিক্ষার্থীকে মুছে ফেলতে সমস্যা হয়েছে: ${error.message}` });
    }
  };

  const handleOpenDialog = (student: Student | null) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingStudent(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
    }
    setFormData(defaultStudentState);
    setImagePreview(null);
    setImageFile(null);
  }

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    setActiveClassFilter(classFilter);
  };

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(
      (student) =>
        (!activeClassFilter || student.classGrade === activeClassFilter) &&
        (activeSearchTerm === '' ||
         student.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
         student.rollNumber.toString().includes(activeSearchTerm))
    );
  }, [students, activeSearchTerm, activeClassFilter]);
  

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">শিক্ষার্থী ম্যানেজমেন্ট</h1>
        <p className="text-muted-foreground">
          নতুন শিক্ষার্থী যোগ করুন এবং বিদ্যমানদের তথ্য দেখুন ও সম্পাদনা করুন।
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="রোল বা নাম দিয়ে খুঁজুন..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={classFilter} onValueChange={(value) => setClassFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সকল শ্রেণি</SelectItem>
                {classNames.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              অনুসন্ধান
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); else setIsDialogOpen(true); }}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog(null)} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  নতুন শিক্ষার্থী
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingStudent ? 'শিক্ষার্থীর তথ্য এডিট করুন' : 'নতুন শিক্ষার্থী যোগ করুন'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Form Inputs */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">নাম</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="শিক্ষার্থীর নাম" className="col-span-3" disabled={isSaving} />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rollNumber" className="text-right">রোল</Label>
                    <Input id="rollNumber" value={formData.rollNumber} onChange={handleInputChange} placeholder="রোল নম্বর" className="col-span-3" disabled={isSaving} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="classGrade" className="text-right">শ্রেণি</Label>
                    <Select value={formData.classGrade} onValueChange={handleSelectChange} disabled={isSaving}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {classNames.map((c) => ( <SelectItem key={c} value={c}>{c}</SelectItem> ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fatherName" className="text-right">পিতার নাম</Label>
                    <Input id="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="পিতার নাম" className="col-span-3" disabled={isSaving} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="mobileNumber" className="text-right">মোবাইল</Label>
                    <Input id="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} placeholder="মোবাইল নম্বর" className="col-span-3" disabled={isSaving} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="monthlyFee" className="text-right">মাসিক বেতন</Label>
                    <Input id="monthlyFee" type="number" value={formData.monthlyFee} onChange={handleInputChange} placeholder="মাসিক বেতন" className="col-span-3" disabled={isSaving} />
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
                  <Button onClick={handleSaveStudent} disabled={isSaving} className="w-full">
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
                        <TableHead>ছবি</TableHead>
                        <TableHead>রোল</TableHead>
                        <TableHead>নাম</TableHead>
                        <TableHead>শ্রেণি</TableHead>
                        <TableHead>পিতার নাম</TableHead>
                        <TableHead>মোবাইল</TableHead>
                        <TableHead className="text-right">বেতন</TableHead>
                        <TableHead className="text-center">একশন</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredStudents?.map((student) => (
                        <TableRow key={student.id}>
                        <TableCell>
                            <Avatar>
                            <AvatarImage src={student.imageUrl || `https://picsum.photos/seed/${student.rollNumber}/200/200`} data-ai-hint={student.imageHint || 'student person'} alt={student.name} />
                            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell>{student.rollNumber}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.classGrade}</TableCell>
                        <TableCell>{student.fatherName}</TableCell>
                        <TableCell>{student.mobileNumber}</TableCell>
                        <TableCell className="text-right">৳{student.monthlyFee}</TableCell>
                        <TableCell className="text-center">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(student)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>এডিট</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteStudent(student.id, student.name)}>
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
