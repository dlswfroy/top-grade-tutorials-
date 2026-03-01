
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
import { Search, Printer, Loader2, DollarSign, Save, PlusCircle, TrendingDown, ChevronsRight, MoreHorizontal, Pencil, Trash2, MessageCircle } from 'lucide-react';
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

    const handleSendSMS = () => {
        const monthName = months[parseInt(payment.paymentMonth.split('-')[1], 10) - 1];
        const year = payment.paymentMonth.split('-')[0];
        const body = `শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${student.name}-এর ${monthName}, ${year} মাসের বেতন বাবদ ${payment.amount} টাকা সফলভাবে আদায় করা হয়েছে। রসিদ নং: ${payment.receiptNumber}। - টপ গ্রেড টিউটোরিয়ালস`;
        window.location.href = `sms:${student.mobileNumber}?body=${encodeURIComponent(body)}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-bold">আদায় রসিদ</DialogTitle>
                </DialogHeader>
                <div id="receipt-content" className="text-sm">
                    <div className="p-4 border rounded-md">
                        <div className="text-center mb-4">
                             {settings?.logoUrl && <Avatar className="mx-auto h-16 w-16 mb-2"><AvatarImage src={settings.logoUrl} /></Avatar>}
                             <h3 className="font-bold text-slate-800 dark:text-slate-200">{settings?.institutionName}</h3>
                             <p className="text-xs text-slate-600 dark:text-slate-400">টাকা আদায়ের রসিদ</p>
                        </div>
                        <div className="space-y-2 text-slate-700 dark:text-slate-300">
                             <p><strong>রসিদ নং:</strong> {payment.receiptNumber}</p>
                             <p><strong>তারিখ:</strong> {format(parseISO(payment.paymentDate), 'PP', { locale: bn })}</p>
                             <p><strong>শিক্ষার্থী:</strong> {student.name} (রোল: {student.rollNumber})</p>
                             <p><strong>শ্রেণি:</strong> {student.classGrade}</p>
                             <p><strong>বেতন মাস:</strong> {format(parseISO(payment.paymentMonth), 'MMMM, yyyy')}</p>
                             <p className="font-bold text-lg text-slate-900 dark:text-slate-100">আদায়: ৳{payment.amount}</p>
                             <p><strong>আদায়কারী:</strong> {payment.collectorName}</p>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="text-green-600 border-green-200" onClick={handleSendSMS}>
                        <MessageCircle className="mr-2 h-4 w-4" /> এসএমএস দিন
                    </Button>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>বন্ধ করুন</Button>
                    <Button onClick={handlePrintReceipt}><Printer className="mr-2 h-4 w-4" /> প্রিন্ট করুন</Button>
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
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন।।' });
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

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={student.imageUrl} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="font-bold text-slate-900 dark:text-slate-100">{student.name}</CardTitle>
                            <p className="text-slate-600 dark:text-slate-400">
                                শ্রেণি: {student.classGrade} | রোল: {student.rollNumber} | মাসিক বেতন: ৳{student.monthlyFee}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingPayments ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>মাসের নাম</TableHead>
                                    <TableHead>পেমেন্টের তারিখ</TableHead>
                                    <TableHead>পরিমাণ</TableHead>
                                    <TableHead className="text-right">একশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {months.map(month => {
                                    const payment = paymentsByMonth[month];
                                    return (
                                        <TableRow key={month}>
                                            <TableCell className="font-medium">{month}</TableCell>
                                            <TableCell>{payment ? format(parseISO(payment.paymentDate), 'PP', { locale: bn }) : '-'}</TableCell>
                                            <TableCell>{payment ? `৳${payment.amount}` : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                {payment ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">পরিশোধিত</Badge>
                                                ) : (
                                                    <Button size="sm" onClick={() => handleOpenPaymentDialog(month)}>
                                                        <DollarSign className="mr-2 h-4 w-4" /> আদায়
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
                            <DialogTitle className="font-bold">{months[parseInt(selectedMonth.split('-')[1], 10) - 1]} মাসের বেতন আদায়</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">টাকার পরিমাণ</Label>
                                <Input id="amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} disabled={isSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="collector">আদায়কারী</Label>
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
                            <Button onClick={handleCollectPayment} disabled={isSaving} className="w-full">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                বেতন আদায় করুন
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
        return query(collection(firestore, 'payments'), orderBy('paymentDate', 'desc'));
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
    
    const handleOpenReceiptDialog = (payment: Payment) => {
        setReceiptPayment(payment);
        setIsReceiptOpen(true);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-bold text-amber-900 dark:text-amber-100">সকল আদায়ের তালিকা</CardTitle>
                </CardHeader>
                <CardContent>
                {isLoadingPayments ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>শিক্ষার্থী</TableHead>
                                <TableHead>মাস</TableHead>
                                <TableHead>পরিমাণ</TableHead>
                                <TableHead>তারিখ</TableHead>
                                <TableHead className="text-right">একশন</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments?.map(p => {
                                const student = studentsMap.get(p.studentId);
                                return (
                                <TableRow key={p.id}>
                                    <TableCell className="text-gray-800 dark:text-gray-200">
                                        {student ? `${student.name} (রোল: ${student.rollNumber})` : 'অজানা'}
                                    </TableCell>
                                    <TableCell>{format(parseISO(p.paymentMonth), 'MMMM yyyy', {locale: bn})}</TableCell>
                                    <TableCell>৳{p.amount}</TableCell>
                                    <TableCell>{format(parseISO(p.paymentDate), 'PP', {locale: bn})}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenReceiptDialog(p)}>
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>

            {receiptPayment && studentsMap.get(receiptPayment.studentId) && (
                <ReceiptDialog
                    isOpen={isReceiptOpen}
                    setIsOpen={setIsReceiptOpen}
                    payment={receiptPayment}
                    student={studentsMap.get(receiptPayment.studentId)!}
                    settings={settings}
                />
            )}
        </div>
    )
}

// Simplified Export
export default function AccountingPageContainer() {
  const tabTriggerClasses = "font-semibold border-2 border-amber-600/30 text-amber-800 data-[state=active]:bg-amber-700 data-[state=active]:text-white data-[state=active]:border-amber-700 hover:bg-amber-200/50 dark:border-amber-400/50 dark:text-amber-200 dark:data-[state=active]:bg-amber-500 dark:data-[state=active]:text-black dark:hover:bg-amber-400/20";
  return (
    <div className="space-y-8 p-4 sm:p-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
      <h1 className="text-3xl font-bold font-headline text-amber-800 dark:text-amber-200">হিসাবরক্ষণ</h1>

      <Tabs defaultValue="collection" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap items-center justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="collection" className={tabTriggerClasses}>বেতন আদায়</TabsTrigger>
            <TabsTrigger value="payment-list" className={tabTriggerClasses}>আদায়ের তালিকা</TabsTrigger>
        </TabsList>
        <TabsContent value="collection">
            <FeeCollection />
        </TabsContent>
        <TabsContent value="payment-list">
            <PaymentList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper badge component
function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode, variant?: "default" | "outline" | "destructive" | "secondary", className?: string }) {
    const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        outline: "text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    };
    return <div className={cn(base, variants[variant], className)}>{children}</div>;
}
