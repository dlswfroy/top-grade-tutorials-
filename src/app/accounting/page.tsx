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
import { classNames, type Student, type Payment, type Expense, type Teacher } from '@/lib/data';
import { Search, Printer, Loader2, DollarSign, Save, PlusCircle, TrendingDown, ChevronsRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
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
  DialogClose,
  DialogDescription,
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
                <CardTitle className="font-bold text-amber-900 dark:text-amber-100">শিক্ষার্থী খুঁজুন</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="search-class" className="text-amber-800 dark:text-amber-300">শ্রেণি</Label>
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
                    <Label htmlFor="search-roll" className="text-amber-800 dark:text-amber-300">রোল</Label>
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
                        <p className="text-amber-700 dark:text-amber-300">শিক্ষার্থী খোঁজা হচ্ছে...</p>
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

function ReceiptDialog({ isOpen, setIsOpen, payment, student, settings }: { isOpen: boolean, setIsOpen: (open: boolean) => void, payment: Payment | null, student: Student | null, settings: InstitutionSettings | null }) {
    if (!payment || !student) return null;

    const handlePrintReceipt = () => {
        const printContent = `
            <html>
            <head>
                <title>Money Receipt</title>
                <style>
                    body { font-family: 'sans-serif'; margin: 0; padding: 20px; width: 450px; }
                    .receipt-container { border: 1px solid #000; padding: 20px; }
                    .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 15px; margin-bottom: 15px; }
                    .header img { max-width: 80px; max-height: 80px; margin-bottom: 10px; }
                    .header h2 { font-size: 20px; font-weight: bold; margin: 0; }
                    .header p { margin: 5px 0 0; font-size: 14px; }
                    .details-table { width: 100%; font-size: 14px; border-collapse: collapse; margin-top: 20px;}
                    .details-table td { padding: 5px 0; }
                    .details-table .label { font-weight: bold; padding-right: 15px; }
                    .details-table .value { text-align: right; }
                    .total-amount-row td { border-top: 1px solid #000; padding-top: 10px; font-weight: bold; font-size: 16px; }
                    .collected-by { font-size: 14px; margin-top: 25px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        ${settings?.logoUrl ? `<img src="${settings.logoUrl}" alt="logo"/>` : ''}
                        <h2>${settings?.institutionName || 'Top Grade Tutorials'}</h2>
                        <p>Money Receipt</p>
                    </div>
                    <table class="details-table">
                        <tr>
                            <td class="label">Receipt No:</td>
                            <td class="value">${payment.receiptNumber}</td>
                        </tr>
                        <tr>
                            <td class="label">Date:</td>
                            <td class="value">${format(parseISO(payment.paymentDate), 'PP', { locale: bn })}</td>
                        </tr>
                         <tr>
                            <td class="label">Student Name:</td>
                            <td class="value">${student.name}</td>
                        </tr>
                        <tr>
                            <td class="label">Class:</td>
                            <td class="value">${student.classGrade}</td>
                        </tr>
                         <tr>
                            <td class="label">Roll:</td>
                            <td class="value">${student.rollNumber}</td>
                        </tr>
                        <tr>
                            <td class="label">Fee for Month:</td>
                            <td class="value">${format(parseISO(payment.paymentMonth), 'MMMM, yyyy')}</td>
                        </tr>
                        <tr class="total-amount-row">
                            <td class="label">Amount Paid:</td>
                            <td class="value">BDT ${payment.amount}</td>
                        </tr>
                    </table>
                     <p class="collected-by"><strong>Collected By:</strong> ${payment.collectorName}</p>
                    <div class="footer">
                        Thank you!
                    </div>
                </div>
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-bold">Payment Receipt</DialogTitle>
                </DialogHeader>
                <div id="receipt-content" className="text-sm">
                    <div className="p-4 border rounded-md">
                        <div className="text-center mb-4">
                             {settings?.logoUrl && <Avatar className="mx-auto h-16 w-16 mb-2"><AvatarImage src={settings.logoUrl} /></Avatar>}
                             <h3 className="font-bold text-slate-800 dark:text-slate-200">{settings?.institutionName}</h3>
                             <p className="text-xs text-slate-600 dark:text-slate-400">Money Receipt</p>
                        </div>
                        <div className="space-y-2 text-slate-700 dark:text-slate-300">
                             <p><strong>Receipt No:</strong> {payment.receiptNumber}</p>
                             <p><strong>Date:</strong> {format(parseISO(payment.paymentDate), 'PP', { locale: bn })}</p>
                             <p><strong>Student:</strong> {student.name} (Roll: {student.rollNumber})</p>
                             <p><strong>Class:</strong> {student.classGrade}</p>
                             <p><strong>Fee for:</strong> {format(parseISO(payment.paymentMonth), 'MMMM, yyyy')}</p>
                             <p className="font-bold text-lg text-slate-900 dark:text-slate-100">Amount: ৳{payment.amount}</p>
                             <p><strong>Collected by:</strong> {payment.collectorName}</p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
                    <Button onClick={handlePrintReceipt}><Printer className="mr-2 h-4 w-4" /> Print Receipt</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PaymentRecord({ student }: { student: Student }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [paymentAmount, setPaymentAmount] = useState<number | string>('');
    const [collectorName, setCollectorName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [lastPayment, setLastPayment] = useState<Payment | null>(null);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'institution_settings', 'default');
    }, [firestore]);
    const { data: settings } = useDoc<InstitutionSettings>(settingsRef);
    
    const teachersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'teachers');
    }, [firestore]);
    const { data: teachers } = useCollection<Teacher>(teachersQuery);

    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'payments'), where('studentId', '==', student.id));
    }, [firestore, student.id]);
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

    const handleOpenPaymentDialog = (month: string) => {
        const monthIndex = months.indexOf(month) + 1;
        const year = new Date().getFullYear();
        setSelectedMonth(`${year}-${monthIndex.toString().padStart(2, '0')}`);
        setPaymentAmount(student.monthlyFee);
        setCollectorName('');
        setIsPayDialogOpen(true);
    };

    const handleCollectPayment = () => {
        if (!firestore || !selectedMonth || !paymentAmount || !collectorName) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন।' });
            return;
        }
        
        setIsSaving(true);
        const paymentData: Omit<Payment, 'id'> = {
            studentId: student.id,
            collectorName: collectorName,
            amount: Number(paymentAmount),
            paymentMonth: selectedMonth,
            paymentDate: new Date().toISOString(),
            receiptNumber: `RCPT-${Date.now()}`
        };

        const paymentsCollection = collection(firestore, 'payments');
        addDoc(paymentsCollection, paymentData)
            .then((docRef) => {
                toast({ title: 'সফল', description: 'বেতন সফলভাবে আদায় করা হয়েছে।' });
                setIsPayDialogOpen(false);
                
                const newPayment: Payment = { id: docRef.id, ...paymentData };
                setLastPayment(newPayment);
                setIsReceiptOpen(true);
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: paymentsCollection.path,
                    operation: 'create',
                    requestResourceData: paymentData,
                }));
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    const handlePrint = () => {
        const printContent = `
            <html>
                <head>
                    <title>বেতন আদায় কার্ড</title>
                    <style>
                        body { font-family: 'sans-serif'; padding: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .header img { max-height: 60px; margin-bottom: 10px; }
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
                        ${settings?.logoUrl ? `<img src="${settings.logoUrl}" alt="logo"/>` : ''}
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
                                    <td>${paymentsByMonth[month]?.collectorName || ''}</td>
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
        <>
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={student.imageUrl || `https://picsum.photos/seed/${student.rollNumber}/200/200`} data-ai-hint={student.imageHint || 'student person'} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="font-bold text-slate-900 dark:text-slate-100">{student.name}</CardTitle>
                            <p className="text-slate-600 dark:text-slate-400">
                                শ্রেণি: {student.classGrade} | রোল: {student.rollNumber} | পিতার নাম: {student.fatherName}
                            </p>
                            <p className="text-lg font-semibold mt-1 text-slate-800 dark:text-slate-200">মাসিক বেতন: ৳{student.monthlyFee}</p>
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
                                    <TableHead className="font-bold text-slate-500">মাসের নাম</TableHead>
                                    <TableHead className="font-bold text-slate-500">পেমেন্টের তারিখ</TableHead>
                                    <TableHead className="font-bold text-slate-500">টাকার পরিমাণ</TableHead>
                                    <TableHead className="font-bold text-slate-500">আদায়কারী</TableHead>
                                    <TableHead className="text-right font-bold text-slate-500">একশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {months.map(month => {
                                    const payment = paymentsByMonth[month];
                                    return (
                                        <TableRow key={month}>
                                            <TableCell className="font-medium text-slate-700 dark:text-slate-300">{month}</TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-400">{payment ? format(parseISO(payment.paymentDate), 'PP', { locale: bn }) : 'N/A'}</TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-400">{payment ? `৳${payment.amount}` : 'N/A'}</TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-400">{payment ? payment.collectorName : 'N/A'}</TableCell>
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

                <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="font-bold text-slate-800 dark:text-slate-200">{months[parseInt(selectedMonth.split('-')[1], 10) - 1]} মাসের বেতন আদায়</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                            <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300">টাকার পরিমাণ</Label>
                            <Input id="amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} disabled={isSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="collector" className="text-slate-700 dark:text-slate-300">আদায়কারী</Label>
                                <Select value={collectorName} onValueChange={setCollectorName} disabled={isSaving}>
                                    <SelectTrigger id="collector">
                                        <SelectValue placeholder="আদায়কারী নির্বাচন করুন" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers?.map(teacher => (
                                            <SelectItem key={teacher.id} value={teacher.name}>{teacher.name}</SelectItem>
                                        ))}
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
            <ReceiptDialog 
                isOpen={isReceiptOpen}
                setIsOpen={setIsReceiptOpen}
                payment={lastPayment}
                student={student}
                settings={settings}
            />
        </>
    );
}

// Payment List Component
function PaymentList() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'payments');
    }, [firestore]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);
    const { data: students } = useCollection<Student>(studentsQuery);
    
    const studentsMap = useMemo(() => {
        if (!students) return new Map<string, Student>();
        return new Map(students.map(s => [s.id, s]));
    }, [students]);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'institution_settings', 'default');
    }, [firestore]);
    const { data: settings } = useDoc<InstitutionSettings>(settingsRef);
    
    const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editAmount, setEditAmount] = useState<number | string>('');
    const [editPaymentDate, setEditPaymentDate] = useState<Date | undefined>();
    const [editCollectorName, setEditCollectorName] = useState('');

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
    
    const studentForReceipt = useMemo(() => {
        if (!receiptPayment || !studentsMap) return null;
        return studentsMap.get(receiptPayment.studentId) || null;
    }, [receiptPayment, studentsMap]);
    
    const handleOpenReceiptDialog = (payment: Payment) => {
        setReceiptPayment(payment);
        setIsReceiptOpen(true);
    };

    const handleOpenEditDialog = (payment: Payment) => {
        setEditingPayment(payment);
        setEditAmount(payment.amount);
        setEditPaymentDate(parseISO(payment.paymentDate));
        setEditCollectorName(payment.collectorName);
        setIsEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        setEditingPayment(null);
    };

    const handleUpdatePayment = () => {
        if (!firestore || !editingPayment || !editAmount || !editPaymentDate || !editCollectorName) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন।' });
            return;
        }

        setIsSaving(true);
        const paymentRef = doc(firestore, 'payments', editingPayment.id);
        const updatedData = {
            amount: Number(editAmount),
            paymentDate: editPaymentDate.toISOString(),
            collectorName: editCollectorName,
        };

        updateDoc(paymentRef, updatedData)
            .then(() => {
                toast({ title: 'সফল', description: 'পেমেন্টের তথ্য আপডেট করা হয়েছে।' });
                handleCloseEditDialog();
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: paymentRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                }));
            })
            .finally(() => {
                setIsSaving(false);
            });
    };
    
    const handleDeletePayment = (paymentId: string) => {
        if (!firestore) return;
        
        const paymentRef = doc(firestore, 'payments', paymentId);
        deleteDoc(paymentRef)
            .then(() => {
                toast({ title: 'সফল', description: 'পেমেন্ট মুছে ফেলা হয়েছে।' });
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: paymentRef.path,
                    operation: 'delete',
                }));
            });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-gray-600 dark:text-gray-300">দৈনিক আদায়</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">৳{dailyTotal}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-gray-600 dark:text-gray-300">মাসিক আদায়</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">৳{monthlyTotal}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-gray-600 dark:text-gray-300">বাৎসরিক আদায়</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">৳{yearlyTotal}</div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-bold text-amber-900 dark:text-amber-100">সকল আদায়ের তালিকা</CardTitle>
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
                                <TableHead className="font-bold text-amber-700 dark:text-amber-300">শিক্ষার্থী</TableHead>
                                <TableHead className="font-bold text-amber-700 dark:text-amber-300">শ্রেণি</TableHead>
                                <TableHead className="font-bold text-amber-700 dark:text-amber-300">মাস</TableHead>
                                <TableHead className="font-bold text-amber-700 dark:text-amber-300">পরিমাণ</TableHead>
                                <TableHead className="font-bold text-amber-700 dark:text-amber-300">আদায়ের তারিখ</TableHead>
                                <TableHead className="font-bold text-amber-700 dark:text-amber-300">আদায়কারী</TableHead>
                                <TableHead className="text-right font-bold text-amber-700 dark:text-amber-300">একশন</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments?.map(p => {
                                const student = studentsMap.get(p.studentId);
                                return (
                                <TableRow key={p.id}>
                                    <TableCell className="text-gray-800 dark:text-gray-200">{student ? `${student.name} (রোল: ${student.rollNumber})` : 'N/A'}</TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">{student?.classGrade || 'N/A'}</TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">{format(parseISO(p.paymentDate), 'MMMM yyyy', {locale: bn})}</TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">৳{p.amount}</TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">{format(parseISO(p.paymentDate), 'PP', {locale: bn})}</TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">{p.collectorName}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenReceiptDialog(p)}>
                                                    <Printer className="mr-2 h-4 w-4" />
                                                    <span>রসিদ প্রিন্ট</span>
                                                </DropdownMenuItem>
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
                        <DialogTitle className="font-bold text-slate-800 dark:text-slate-200">পেমেন্টের তথ্য এডিট করুন</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount" className="text-slate-700 dark:text-slate-300">টাকার পরিমাণ</Label>
                            <Input id="edit-amount" type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} disabled={isSaving} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-date" className="text-slate-700 dark:text-slate-300">আদায়ের তারিখ</Label>
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
                            <Label htmlFor="edit-collector" className="text-slate-700 dark:text-slate-300">আদায়কারী</Label>
                            <Input id="edit-collector" value={editCollectorName} onChange={(e) => setEditCollectorName(e.target.value)} placeholder="আদায়কারীর নাম" disabled={isSaving} />
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

            {receiptPayment && studentForReceipt && (
                <ReceiptDialog
                    isOpen={isReceiptOpen}
                    setIsOpen={setIsReceiptOpen}
                    payment={receiptPayment}
                    student={studentForReceipt}
                    settings={settings}
                />
            )}
        </div>
    )
}

// Expense Component
function Expenses() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | string>('');
    const [spentByName, setSpentByName] = useState('');
    const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
    
    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'expenses');
    }, [firestore]);
    const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

    const handleSaveExpense = () => {
        if (!firestore || !description || !amount || !expenseDate || !spentByName) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন।' });
            return;
        }
        setIsSaving(true);
        
        const expenseData = {
            description,
            amount: Number(amount),
            expenseDate: expenseDate.toISOString(),
            spentByName: spentByName,
        };
        const expensesCollection = collection(firestore, 'expenses');
        addDoc(expensesCollection, expenseData)
            .then(() => {
                toast({ title: 'সফল', description: 'খরচ সফলভাবে যোগ করা হয়েছে।' });
                setIsDialogOpen(false);
                setDescription('');
                setAmount('');
                setSpentByName('');
                setExpenseDate(new Date());
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: expensesCollection.path,
                    operation: 'create',
                    requestResourceData: expenseData,
                }));
            })
            .finally(() => {
                setIsSaving(false);
            });
    }
    
    const handleDeleteExpense = (expenseId: string) => {
        if (!firestore) return;
        const expenseRef = doc(firestore, 'expenses', expenseId);
        deleteDoc(expenseRef)
            .then(() => {
                toast({ title: 'সফল', description: 'খরচ মুছে ফেলা হয়েছে।' });
            })
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: expenseRef.path,
                    operation: 'delete',
                }));
            });
    };


    return (
         <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="font-bold text-amber-900 dark:text-amber-100">খরচের তালিকা</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" />নতুন খরচ</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-bold text-slate-800 dark:text-slate-200">নতুন খরচ যোগ করুন</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input placeholder="খরচের বিবরণ" value={description} onChange={e => setDescription(e.target.value)} />
                                <Input type="number" placeholder="টাকার পরিমাণ" value={amount} onChange={e => setAmount(e.target.value)} />
                                <Input placeholder="খরচ করেছেন" value={spentByName} onChange={e => setSpentByName(e.target.value)} />
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
                                    <TableHead className="font-bold text-amber-700 dark:text-amber-300">বিবরণ</TableHead>
                                    <TableHead className="font-bold text-amber-700 dark:text-amber-300">পরিমাণ</TableHead>
                                    <TableHead className="font-bold text-amber-700 dark:text-amber-300">খরচের তারিখ</TableHead>
                                    <TableHead className="font-bold text-amber-700 dark:text-amber-300">খরচ করেছেন</TableHead>
                                    <TableHead className="text-right font-bold text-amber-700 dark:text-amber-300">একশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses?.map(e => (
                                    <TableRow key={e.id}>
                                        <TableCell className="text-gray-800 dark:text-gray-200">{e.description}</TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400">৳{e.amount}</TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400">{format(parseISO(e.expenseDate), 'PP', {locale: bn})}</TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400">{e.spentByName}</TableCell>
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

function Cashbook() {
    const firestore = useFirestore();
    const studentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'students') : null, [firestore]);
    const { data: students } = useCollection<Student>(studentsQuery);
    
    const paymentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'payments') : null, [firestore]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
    
    const expensesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
    const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

    const studentsMap = useMemo(() => {
        if (!students) return new Map();
        return new Map(students.map(s => [s.id, s]));
    }, [students]);

    const transactions = useMemo(() => {
        if (!payments || !expenses) return [];

        const combined = [
            ...payments.map(p => {
                const student = studentsMap.get(p.studentId);
                return {
                    date: parseISO(p.paymentDate),
                    particulars: `বেতন আদায়: ${student?.name || 'Unknown'} (রোল: ${student?.rollNumber || 'N/A'})`,
                    income: p.amount,
                    expense: 0,
                    type: 'income' as const
                };
            }),
            ...expenses.map(e => ({
                date: parseISO(e.expenseDate),
                particulars: e.description,
                income: 0,
                expense: e.amount,
                type: 'expense' as const
            }))
        ];

        combined.sort((a, b) => a.date.getTime() - b.date.getTime());

        let balance = 0;
        return combined.map(t => {
            balance += t.income - t.expense;
            return { ...t, balance };
        });
    }, [payments, expenses, studentsMap]);

    if (isLoadingPayments || isLoadingExpenses) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-bold text-amber-900 dark:text-amber-100">ক্যাশবুক</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-bold text-amber-700 dark:text-amber-300">তারিখ</TableHead>
                            <TableHead className="font-bold text-amber-700 dark:text-amber-300">বিবরণ</TableHead>
                            <TableHead className="text-right font-bold text-amber-700 dark:text-amber-300">আয় (৳)</TableHead>
                            <TableHead className="text-right font-bold text-amber-700 dark:text-amber-300">ব্যয় (৳)</TableHead>
                            <TableHead className="text-right font-bold text-amber-700 dark:text-amber-300">ব্যালেন্স (৳)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((t, index) => (
                            <TableRow key={index}>
                                <TableCell className="text-gray-600 dark:text-gray-400">{format(t.date, 'PP', { locale: bn })}</TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">{t.particulars}</TableCell>
                                <TableCell className="text-right text-green-600">{t.income > 0 ? t.income.toFixed(2) : '-'}</TableCell>
                                <TableCell className="text-right text-red-600">{t.expense > 0 ? t.expense.toFixed(2) : '-'}</TableCell>
                                <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-400">{t.balance.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function LedgerBook() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    // New states for search
    const [searchClass, setSearchClass] = useState('');
    const [searchRoll, setSearchRoll] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // This query will now depend on selectedStudent
    const studentPaymentsQuery = useMemoFirebase(() => {
        if (!firestore || !selectedStudent) return null;
        return query(collection(firestore, 'payments'), where('studentId', '==', selectedStudent.id));
    }, [firestore, selectedStudent]);
    const { data: studentPayments, isLoading: isLoadingPayments } = useCollection<Payment>(studentPaymentsQuery);

    const totalPaid = useMemo(() => {
        if (!studentPayments) return 0;
        return studentPayments.reduce((sum, p) => sum + p.amount, 0);
    }, [studentPayments]);

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
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-bold text-amber-900 dark:text-amber-100">শিক্ষার্থী লেজার</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="ledger-search-class" className="text-amber-800 dark:text-amber-300">শ্রেণি</Label>
                            <Select value={searchClass} onValueChange={setSearchClass}>
                                <SelectTrigger id="ledger-search-class">
                                    <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="ledger-search-roll" className="text-amber-800 dark:text-amber-300">রোল</Label>
                            <Input
                                id="ledger-search-roll"
                                placeholder="রোল নম্বর লিখুন"
                                value={searchRoll}
                                onChange={(e) => setSearchRoll(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <Button onClick={handleSearch} disabled={isSearching} className="w-full">
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                খুঁজুন
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isSearching && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            
            {selectedStudent ? (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-bold text-slate-900 dark:text-slate-100">লেজার: {selectedStudent.name}</CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-400">রোল: {selectedStudent.rollNumber}, শ্রেণি: {selectedStudent.classGrade}, মাসিক বেতন: ৳{selectedStudent.monthlyFee}</p>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPayments ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-bold text-slate-600 dark:text-slate-400">রসিদ নং</TableHead>
                                        <TableHead className="font-bold text-slate-600 dark:text-slate-400">মাস</TableHead>
                                        <TableHead className="font-bold text-slate-600 dark:text-slate-400">আদায়ের তারিখ</TableHead>
                                        <TableHead className="text-right font-bold text-slate-600 dark:text-slate-400">পরিমাণ (৳)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentPayments && studentPayments.length > 0 ? (
                                        studentPayments.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-gray-800 dark:text-gray-200">{p.receiptNumber}</TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">{format(parseISO(p.paymentMonth), 'MMMM, yyyy')}</TableCell>
                                                <TableCell className="text-gray-600 dark:text-gray-400">{format(parseISO(p.paymentDate), 'PP', { locale: bn })}</TableCell>
                                                <TableCell className="text-right text-gray-700 dark:text-gray-300">{p.amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-gray-500">এই শিক্ষার্থীর জন্য কোনো পেমেন্ট পাওয়া যায়নি।</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                    <CardFooter className="justify-end font-bold text-slate-800 dark:text-slate-200">
                        মোট পরিশোধিত: ৳{totalPaid.toFixed(2)}
                    </CardFooter>
                </Card>
            ) : (
                !isSearching && (
                    <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-48">
                        <p className="text-muted-foreground">শিক্ষার্থীর লেজার দেখার জন্য শ্রেণি ও রোল দিয়ে খুঁজুন।</p>
                    </div>
                )
            )}
        </div>
    );
}

function Report() {
    const firestore = useFirestore();
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'payments');
    }, [firestore]);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'expenses');
    }, [firestore]);
    const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);
    
    const totalIncome = useMemo(() => payments?.reduce((sum, p) => sum + p.amount, 0) || 0, [payments]);
    const totalExpense = useMemo(() => expenses?.reduce((sum, e) => sum + e.amount, 0) || 0, [expenses]);
    const netBalance = totalIncome - totalExpense;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-bold text-amber-900 dark:text-amber-100">আয়-ব্যয় রিপোর্ট</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {(isLoadingPayments || isLoadingExpenses) ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                         <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <CardHeader>
                                <CardTitle className="font-bold text-green-800 dark:text-green-300">মোট আয়</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-green-900 dark:text-green-200">৳{totalIncome}</p>
                            </CardContent>
                         </Card>
                         <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                            <CardHeader>
                                <CardTitle className="font-bold text-red-800 dark:text-red-300">মোট ব্যয়</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-red-900 dark:text-red-200">৳{totalExpense}</p>
                            </CardContent>
                         </Card>
                         <Card className={cn(netBalance >= 0 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800")}>
                            <CardHeader>
                                <CardTitle className={cn("font-bold", netBalance >= 0 ? "text-blue-800 dark:text-blue-300" : "text-orange-800 dark:text-orange-300")}>বর্তমান ব্যালেন্স</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">৳{netBalance}</p>
                            </CardContent>
                         </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AccountingPage() {
  return (
    <div className="space-y-8 p-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-amber-800 dark:text-amber-200">হিসাবরক্ষণ</h1>
      </div>

      <Tabs defaultValue="collection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="collection">বেতন আদায়</TabsTrigger>
            <TabsTrigger value="payment-list">আদায়ের তালিকা</TabsTrigger>
            <TabsTrigger value="cashbook">ক্যাশবুক</TabsTrigger>
            <TabsTrigger value="ledger">শিক্ষার্থী লেজার</TabsTrigger>
            <TabsTrigger value="expenses">খরচের লেজার</TabsTrigger>
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
        <TabsContent value="cashbook">
            <Cashbook />
        </TabsContent>
        <TabsContent value="ledger">
            <LedgerBook />
        </TabsContent>
        <TabsContent value="report">
            <Report />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountingPageContainer() {
    return (
        <AccountingPage />
    )
}
