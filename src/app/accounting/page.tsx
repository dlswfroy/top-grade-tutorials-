'use client';
import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { classNames, type Student, type Teacher, type Payment, type Expense } from '@/lib/data';
import { Search, Printer, Loader2, DollarSign, Save, PlusCircle, TrendingDown, ChevronsRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, where, query, getDocs, doc, addDoc, setDoc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isThisMonth, isThisYear, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

// Fee Collection Component
function FeeCollection() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchRoll, setSearchRoll] = useState('');
    const [searchClass, setSearchClass] = useState('');
  
    const handleSearch = async () => {
      if (!firestore || !searchClass || !searchRoll) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শ্রেণি এবং রোল নম্বর দিন।' });
        return;
      }
      setIsSearching(true);
      setSelectedStudent(null);
      try {
        const studentsRef = collection(firestore, 'students');
        const q = query(studentsRef, where('classGrade', '==', searchClass), where('rollNumber', '==', searchRoll));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          toast({ variant: 'destructive', title: 'পাওয়া যায়নি', description: 'এই রোল নম্বরের কোনো শিক্ষার্থী এই শ্রেণিতে নেই।' });
        } else {
          const studentDoc = querySnapshot.docs[0];
          const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
          setSelectedStudent(studentData);
        }
      } catch (error) {
        console.error("Error searching for student:", error);
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শিক্ষার্থী খুঁজতে গিয়ে সমস্যা হয়েছে।' });
      } finally {
        setIsSearching(false);
      }
    };
  
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                <CardTitle>শিক্ষার্থী খুঁজুন</CardTitle>
                <CardDescription>বেতন আদায়ের জন্য শিক্ষার্থী খুঁজুন।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="search-class">শ্রেণি</Label>
                    <Select value={searchClass} onValueChange={setSearchClass}>
                    <SelectTrigger id="search-class">
                        <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                        {classNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="search-roll">রোল</Label>
                    <Input
                    id="search-roll"
                    placeholder="রোল নম্বর লিখুন"
                    value={searchRoll}
                    onChange={(e) => setSearchRoll(e.target.value)}
                    />
                </div>
                <Button onClick={handleSearch} className="w-full" disabled={isSearching}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    খুঁজুন
                </Button>
                </CardContent>
            </Card>
            </div>
    
            <div className="lg:col-span-2">
            {selectedStudent ? (
                <PaymentRecord student={selectedStudent} />
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-full">
                {isSearching ? (
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                        <p>শিক্ষার্থী খোঁজা হচ্ছে...</p>
                    </div>
                ) : (
                    <p className="text-muted-foreground">শিক্ষার্থীর পেমেন্ট রেকর্ড দেখার জন্য শ্রেণি ও রোল দিয়ে খুঁজুন।</p>
                )}
                </div>
            )}
            </div>
        </div>
    );
}


function PaymentRecord({ student }: { student: Student }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [paymentAmount, setPaymentAmount] = useState<number | string>('');
    const [paymentCollectorId, setPaymentCollectorId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'institution_settings', 'default');
    }, [firestore, user]);
    const { data: settings } = useDoc<InstitutionSettings>(settingsRef);

    const teachersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'teachers');
    }, [firestore, user]);
    const { data: teachers } = useCollection<Teacher>(teachersQuery);

    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'payments'), where('studentId', '==', student.id));
    }, [firestore, user, student.id]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);

    const paymentsByMonth = useMemo(() => {
        if (!payments) return {};
        const currentYear = new Date().getFullYear().toString();
        return payments.reduce((acc, payment) => {
            const [year, month] = payment.paymentMonth.split('-');
            if (year === currentYear) {
                const monthName = months[parseInt(month, 10) -1];
                if(monthName) acc[monthName] = payment;
            }
            return acc;
        }, {} as Record<string, Payment>);
    }, [payments]);
    
    const getTeacherName = (teacherId: string) => {
        return teachers?.find(t => t.id === teacherId)?.name || 'N/A';
    }

    const handleOpenPaymentDialog = (month: string) => {
        const monthIndex = months.indexOf(month) + 1;
        const year = new Date().getFullYear();
        setSelectedMonth(`${year}-${monthIndex.toString().padStart(2, '0')}`);
        setPaymentAmount(student.monthlyFee);
        setIsDialogOpen(true);
    };

    const handleCollectPayment = async () => {
        if (!firestore || !selectedMonth || !paymentAmount || !paymentCollectorId) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন।' });
            return;
        }
        
        setIsSaving(true);
        try {
            const paymentData = {
                studentId: student.id,
                teacherId: paymentCollectorId,
                amount: Number(paymentAmount),
                paymentMonth: selectedMonth,
                paymentDate: new Date().toISOString(),
                receiptNumber: `RCPT-${Date.now()}`
            };
    
            await addDoc(collection(firestore, 'payments'), paymentData);
            toast({ title: 'সফল', description: 'বেতন সফলভাবে আদায় করা হয়েছে।' });
            setIsDialogOpen(false);
            setPaymentCollectorId('');

        } catch (error: any) {
            console.error("Error collecting payment:", error);
            toast({
                variant: 'destructive',
                title: 'ত্রুটি',
                description: `বেতন আদায় করতে সমস্যা হয়েছে: ${error.message}`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = () => {
        const printContent = `
            <html>
                <head>
                    <title>বেতন আদায় কার্ড</title>
                    <style>
                        body { font-family: 'sans-serif'; padding: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header h1 { font-size: 24px; margin: 0; }
                        .header p { margin: 0; }
                        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        .info-table td { border: 1px solid #000; padding: 5px; }
                        .payments-table { width: 100%; border-collapse: collapse; }
                        .payments-table th, .payments-table td { border: 1px solid #000; padding: 8px; text-align: center; }
                        .payments-table th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${settings?.institutionName || 'টপ গ্রেড টিউটোরিয়ালস'}</h1>
                        <p>বীরগঞ্জ পৌরসভা, বীরগঞ্জ, দিনাজপুর।</p>
                        <h3>বেতন আদায় কার্ড - ${new Date().getFullYear()}</h3>
                    </div>
                    <table class="info-table">
                        <tr>
                            <td><strong>ক্রমিক নং:</strong> ${student.rollNumber}</td>
                            <td><strong>শিক্ষার্থীর নাম:</strong> ${student.name}</td>
                            <td><strong>পিতার নাম:</strong> ${student.fatherName}</td>
                        </tr>
                        <tr>
                            <td><strong>শ্রেণি:</strong> ${student.classGrade}</td>
                            <td colspan="2"><strong>মাসিক বেতন:</strong> ${student.monthlyFee}</td>
                        </tr>
                    </table>
                    <table class="payments-table">
                        <thead>
                            <tr>
                                <th>মাসের নাম</th>
                                <th>আদায়ের তারিখ</th>
                                <th>মাসিক বেতন</th>
                                <th>মোট আদায়</th>
                                <th>আদায়কারীর স্বাক্ষর</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${months.map(month => `
                                <tr>
                                    <td>${month}</td>
                                    <td>${paymentsByMonth[month] ? format(parseISO(paymentsByMonth[month]!.paymentDate), 'PP', { locale: bn }) : ''}</td>
                                    <td>${student.monthlyFee}</td>
                                    <td>${paymentsByMonth[month]?.amount || ''}</td>
                                    <td>${paymentsByMonth[month] ? getTeacherName(paymentsByMonth[month]!.teacherId) : ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
    };


    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={student.imageUrl || `https://picsum.photos/seed/${student.rollNumber}/200/200`} data-ai-hint={student.imageHint || 'student person'} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{student.name}</CardTitle>
                        <CardDescription>
                            শ্রেণি: {student.classGrade} | রোল: {student.rollNumber} | পিতার নাম: {student.fatherName}
                        </CardDescription>
                        <p className="text-lg font-semibold mt-1">মাসিক বেতন: ৳{student.monthlyFee}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    কার্ড প্রিন্ট করুন
                </Button>
            </CardHeader>
            <CardContent>
                {isLoadingPayments ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>মাসের নাম</TableHead>
                                <TableHead>পেমেন্টের তারিখ</TableHead>
                                <TableHead>টাকার পরিমাণ</TableHead>
                                <TableHead>আদায়কারী</TableHead>
                                <TableHead className="text-right">একশন</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {months.map(month => {
                                const payment = paymentsByMonth[month];
                                return (
                                    <TableRow key={month}>
                                        <TableCell className="font-medium">{month}</TableCell>
                                        <TableCell>{payment ? format(parseISO(payment.paymentDate), 'PP', { locale: bn }) : 'N/A'}</TableCell>
                                        <TableCell>{payment ? `৳${payment.amount}` : 'N/A'}</TableCell>
                                        <TableCell>{payment ? getTeacherName(payment.teacherId) : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            {payment ? (
                                                <span className="text-green-600 font-semibold">পরিশোধিত</span>
                                            ) : (
                                                <Button size="sm" onClick={() => handleOpenPaymentDialog(month)}>
                                                    <DollarSign className="mr-2 h-4 w-4" />
                                                    বেতন নিন
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{months[parseInt(selectedMonth.split('-')[1], 10) - 1]} মাসের বেতন আদায়</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">টাকার পরিমাণ</Label>
                          <Input id="amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="collector">আদায়কারী</Label>
                            <Select value={paymentCollectorId} onValueChange={setPaymentCollectorId} disabled={isSaving}>
                                <SelectTrigger id="collector">
                                    <SelectValue placeholder="আদায়কারীর নাম নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCollectPayment} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'আদায় করা হচ্ছে...' : 'বেতন আদায় করুন'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// Payment List Component
function PaymentList() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'payments');
    }, [firestore, user]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'students');
    }, [firestore, user]);
    const { data: students } = useCollection<Student>(studentsQuery);
    
    const teachersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'teachers');
    }, [firestore, user]);
    const { data: teachers } = useCollection<Teacher>(teachersQuery);

    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editAmount, setEditAmount] = useState<number | string>('');
    const [editPaymentDate, setEditPaymentDate] = useState<Date | undefined>();
    const [editTeacherId, setEditTeacherId] = useState('');

    const { dailyTotal, monthlyTotal, yearlyTotal } = useMemo(() => {
        if (!payments) return { dailyTotal: 0, monthlyTotal: 0, yearlyTotal: 0 };
        return payments.reduce((acc, p) => {
            const paymentDate = parseISO(p.paymentDate);
            if (isToday(paymentDate)) acc.dailyTotal += p.amount;
            if (isThisMonth(paymentDate)) acc.monthlyTotal += p.amount;
            if (isThisYear(paymentDate)) acc.yearlyTotal += p.amount;
            return acc;
        }, { dailyTotal: 0, monthlyTotal: 0, yearlyTotal: 0 });
    }, [payments]);

    const getTeacherName = (teacherId: string) => {
        return teachers?.find(t => t.id === teacherId)?.name || 'N/A';
    }
    
    const handleOpenEditDialog = (payment: Payment) => {
        setEditingPayment(payment);
        setEditAmount(payment.amount);
        setEditPaymentDate(parseISO(payment.paymentDate));
        setEditTeacherId(payment.teacherId);
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        setEditingPayment(null);
    };

    const handleUpdatePayment = async () => {
        if (!firestore || !editingPayment || !editAmount || !editPaymentDate || !editTeacherId) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন।' });
            return;
        }

        setIsSaving(true);
        try {
            const paymentRef = doc(firestore, 'payments', editingPayment.id);
            await updateDoc(paymentRef, {
                amount: Number(editAmount),
                paymentDate: editPaymentDate.toISOString(),
                teacherId: editTeacherId,
            });
            toast({ title: 'সফল', description: 'পেমেন্টের তথ্য আপডেট করা হয়েছে।' });
            handleCloseEditDialog();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: `আপডেট করতে সমস্যা হয়েছে: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeletePayment = async (paymentId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'payments', paymentId));
            toast({ title: 'সফল', description: 'পেমেন্ট মুছে ফেলা হয়েছে।' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: `মুছে ফেলতে সমস্যা হয়েছে: ${error.message}` });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">দৈনিক আদায়</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{dailyTotal}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">মাসিক আদায়</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{monthlyTotal}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">বাৎসরিক আদায়</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">৳{yearlyTotal}</div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>সকল আদায়ের তালিকা</CardTitle>
                </CardHeader>
                <CardContent>
                {isLoadingPayments ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>শিক্ষার্থী</TableHead>
                                <TableHead>শ্রেণি</TableHead>
                                <TableHead>মাস</TableHead>
                                <TableHead>পরিমাণ</TableHead>
                                <TableHead>আদায়ের তারিখ</TableHead>
                                <TableHead>আদায়কারী</TableHead>
                                <TableHead className="text-right">একশন</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments?.map(p => {
                                const student = students?.find(s => s.id === p.studentId);
                                return (
                                <TableRow key={p.id}>
                                    <TableCell>{student ? `${student.name} (রোল: ${student.rollNumber})` : 'N/A'}</TableCell>
                                    <TableCell>{student?.classGrade || 'N/A'}</TableCell>
                                    <TableCell>{format(parseISO(p.paymentDate), 'MMMM yyyy', {locale: bn})}</TableCell>
                                    <TableCell>৳{p.amount}</TableCell>
                                    <TableCell>{format(parseISO(p.paymentDate), 'PP', {locale: bn})}</TableCell>
                                    <TableCell>{getTeacherName(p.teacherId)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEditDialog(p)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    <span>এডিট</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePayment(p.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>ডিলিট</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>পেমেন্টের তথ্য এডিট করুন</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">টাকার পরিমাণ</Label>
                            <Input id="edit-amount" type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-date">আদায়ের তারিখ</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !editPaymentDate && "text-muted-foreground")} disabled={isSaving}>
                                        <ChevronsRight className="mr-2 h-4 w-4" />
                                        {editPaymentDate ? format(editPaymentDate, "PPP", { locale: bn }) : <span>একটি তারিখ নির্বাচন করুন</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={editPaymentDate} onSelect={setEditPaymentDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-collector">আদায়কারী</Label>
                            <Select value={editTeacherId} onValueChange={setEditTeacherId} disabled={isSaving}>
                                <SelectTrigger id="edit-collector">
                                    <SelectValue placeholder="আদায়কারীর নাম নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdatePayment} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Expense Component
function Expenses() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | string>('');
    const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'expenses');
    }, [firestore, user]);
    const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

    const teachersQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'teachers');
    }, [firestore, user]);
    const { data: teachers } = useCollection<Teacher>(teachersQuery);

    const getTeacherName = (teacherId: string) => {
        return teachers?.find(t => t.id === teacherId)?.name || 'N/A';
    }

    const handleSaveExpense = async () => {
        if (!firestore || !description || !amount || !expenseDate || !user) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন।' });
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(firestore, 'expenses'), {
                description,
                amount: Number(amount),
                expenseDate: expenseDate.toISOString(),
                spentByTeacherId: user.uid // Assuming logged in user is a teacher
            });
            toast({ title: 'সফল', description: 'খরচ সফলভাবে যোগ করা হয়েছে।' });
            setIsDialogOpen(false);
            setDescription('');
            setAmount('');
            setExpenseDate(new Date());
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: `খরচ যোগ করতে সমস্যা হয়েছে: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleDeleteExpense = async (expenseId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'expenses', expenseId));
            toast({ title: 'সফল', description: 'খরচ মুছে ফেলা হয়েছে।' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: `খরচ মুছে ফেলতে সমস্যা হয়েছে: ${error.message}` });
        }
    };


    return (
         <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>খরচের তালিকা</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" />নতুন খরচ</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>নতুন খরচ যোগ করুন</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input placeholder="খরচের বিবরণ" value={description} onChange={e => setDescription(e.target.value)} />
                                <Input type="number" placeholder="টাকার পরিমাণ" value={amount} onChange={e => setAmount(e.target.value)} />
                                 <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !expenseDate && "text-muted-foreground"
                                        )}
                                    >
                                        <ChevronsRight className="mr-2 h-4 w-4" />
                                        {expenseDate ? format(expenseDate, "PPP", { locale: bn }) : <span>একটি তারিখ নির্বাচন করুন</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={expenseDate} onSelect={setExpenseDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveExpense} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'সেভ করুন'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {isLoadingExpenses ? (
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>বিবরণ</TableHead>
                                    <TableHead>পরিমাণ</TableHead>
                                    <TableHead>খরচের তারিখ</TableHead>
                                    <TableHead>খরচ করেছেন</TableHead>
                                    <TableHead className="text-right">একশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses?.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell>{e.description}</TableCell>
                                        <TableCell>৳{e.amount}</TableCell>
                                        <TableCell>{format(parseISO(e.expenseDate), 'PP', {locale: bn})}</TableCell>
                                        <TableCell>{getTeacherName(e.spentByTeacherId)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteExpense(e.id)}>
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
    )
}

function Report() {
    const firestore = useFirestore();
    const { user } = useUser();
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'payments');
    }, [firestore, user]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'expenses');
    }, [firestore, user]);
    const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);
    
    const totalIncome = useMemo(() => payments?.reduce((sum, p) => sum + p.amount, 0) || 0, [payments]);
    const totalExpense = useMemo(() => expenses?.reduce((sum, e) => sum + e.amount, 0) || 0, [expenses]);
    const netBalance = totalIncome - totalExpense;

    return (
        <Card>
            <CardHeader>
                <CardTitle>আয়-ব্যয় রিপোর্ট</CardTitle>
                <CardDescription>প্রতিষ্ঠানের মোট আয়, ব্যয় এবং বর্তমান ব্যালেন্স দেখুন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {(isLoadingPayments || isLoadingExpenses) ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                         <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <CardHeader>
                                <CardTitle className="text-green-800 dark:text-green-300">মোট আয়</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-green-900 dark:text-green-200">৳{totalIncome}</p>
                            </CardContent>
                         </Card>
                         <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                            <CardHeader>
                                <CardTitle className="text-red-800 dark:text-red-300">মোট ব্যয়</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-red-900 dark:text-red-200">৳{totalExpense}</p>
                            </CardContent>
                         </Card>
                         <Card className={cn(netBalance >= 0 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800")}>
                            <CardHeader>
                                <CardTitle className={cn(netBalance >= 0 ? "text-blue-800 dark:text-blue-300" : "text-orange-800 dark:text-orange-300")}>বর্তমান ব্যালেন্স</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">৳{netBalance}</p>
                            </CardContent>
                         </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function AccountingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">হিসাবরক্ষণ</h1>
        <p className="text-muted-foreground">শিক্ষার্থীদের মাসিক বেতন আদায়, খরচ এবং আয়-ব্যয়ের রিপোর্ট দেখুন।</p>
      </div>

      <Tabs defaultValue="collection" className="space-y-4">
        <TabsList>
            <TabsTrigger value="collection">বেতন আদায়</TabsTrigger>
            <TabsTrigger value="payment-list">আদায়ের তালিকা</TabsTrigger>
            <TabsTrigger value="expenses">খরচের হিসাব</TabsTrigger>
            <TabsTrigger value="report">রিপোর্ট</TabsTrigger>
        </TabsList>
        <TabsContent value="collection">
            <FeeCollection />
        </TabsContent>
        <TabsContent value="payment-list">
            <PaymentList />
        </TabsContent>
        <TabsContent value="expenses">
            <Expenses />
        </TabsContent>
        <TabsContent value="report">
            <Report />
        </TabsContent>
      </Tabs>
    </div>
  );
}
