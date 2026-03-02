
'use client';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { classNames, type Student, type Payment, type Teacher } from '@/lib/data';
import { Search, Printer, Loader2, DollarSign, Save, MessageCircle, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, where, query, getDocs, doc, addDoc, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const monthsList = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

function ReceiptDialog({ isOpen, setIsOpen, payment, student, settings }: { isOpen: boolean, setIsOpen: (open: boolean) => void, payment: Payment | null, student: Student | null, settings: InstitutionSettings | null }) {
    if (!payment || !student) return null;

    const handlePrintReceipt = () => {
        const printContent = `
            <html>
            <head>
                <title>Money Receipt</title>
                <style>
                    body { font-family: 'sans-serif'; padding: 20px; width: 400px; }
                    .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 20px; }
                    .details { line-height: 1.8; }
                    .total { font-weight: bold; font-size: 1.2em; border-top: 1px solid #ccc; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${settings?.institutionName || 'Top Grade Tutorials'}</h2>
                    <p>Money Receipt</p>
                </div>
                <div class="details">
                    <p>Receipt No: ${payment.receiptNumber}</p>
                    <p>Date: ${format(parseISO(payment.paymentDate), 'PP', { locale: bn })}</p>
                    <p>Student: ${student.name}</p>
                    <p>Class: ${student.classGrade} | Roll: ${student.rollNumber}</p>
                    <p>Fee for Month: ${format(parseISO(payment.paymentMonth), 'MMMM, yyyy', { locale: bn })}</p>
                    <p class="total">Amount Paid: BDT ${payment.amount}</p>
                    <p>Collected By: ${payment.collectorName}</p>
                </div>
            </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win?.document.write(printContent);
        win?.document.close();
        win?.print();
    };

    const handleSendSMS = () => {
        const dateObj = parseISO(payment.paymentMonth);
        const monthName = format(dateObj, 'MMMM', { locale: bn });
        const year = format(dateObj, 'yyyy', { locale: bn });
        const body = `শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${student.name}-এর ${monthName}, ${year} মাসের বেতন বাবদ ${payment.amount} টাকা সফলভাবে আদায় করা হয়েছে। রসিদ নং: ${payment.receiptNumber}। - ${settings?.institutionName || 'টপ গ্রেড টিউটোরিয়ালস'}`;
        window.location.href = `sms:${student.mobileNumber}?body=${encodeURIComponent(body)}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-bold">আদায় রসিদ</DialogTitle>
                </DialogHeader>
                <div className="p-4 border rounded-md space-y-3">
                     <div className="text-center pb-2 border-b">
                        <h3 className="font-bold text-lg">{settings?.institutionName}</h3>
                        <p className="text-xs text-muted-foreground">বেতন আদায়ের রসিদ</p>
                     </div>
                     <div className="grid grid-cols-2 text-sm gap-y-1">
                        <span className="text-muted-foreground">রসিদ নং:</span> <span className="text-right font-medium">{payment.receiptNumber}</span>
                        <span className="text-muted-foreground">তারিখ:</span> <span className="text-right">{format(parseISO(payment.paymentDate), 'PP', { locale: bn })}</span>
                        <span className="text-muted-foreground">শিক্ষার্থী:</span> <span className="text-right font-bold">{student.name}</span>
                        <span className="text-muted-foreground">শ্রেণি:</span> <span className="text-right">{student.classGrade} (রোল: {student.rollNumber})</span>
                        <span className="text-muted-foreground">মাসের নাম:</span> <span className="text-right">{format(parseISO(payment.paymentMonth), 'MMMM yyyy', { locale: bn })}</span>
                        <span className="text-lg font-bold pt-2">মোট আদায়:</span> <span className="text-right text-lg font-bold pt-2 text-green-600">৳{payment.amount}</span>
                     </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="flex-1 text-green-600 border-green-200" onClick={handleSendSMS}>
                        <MessageCircle className="mr-2 h-4 w-4" /> SMS দিন
                    </Button>
                    <Button variant="secondary" onClick={() => setIsOpen(false)}>বন্ধ করুন</Button>
                    <Button onClick={handlePrintReceipt}><Printer className="mr-2 h-4 w-4" /> প্রিন্ট</Button>
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
                const monthName = monthsList[parseInt(month, 10) - 1];
                if(monthName) acc[monthName] = payment;
            }
            return acc;
        }, {} as Record<string, Payment>);
    }, [payments]);

    const handleOpenPaymentDialog = (month: string) => {
        const monthIndex = monthsList.indexOf(month) + 1;
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

        addDoc(collection(firestore, 'payments'), paymentData)
            .then((docRef) => {
                toast({ title: 'সফল', description: 'বেতন আদায় সম্পন্ন হয়েছে।' });
                setIsPayDialogOpen(false);
                setLastPayment({ id: docRef.id, ...paymentData });
                setIsReceiptOpen(true);
            })
            .catch(() => {
                toast({ variant: 'destructive', title: 'ত্রুটি', description: 'বেতন আদায় করতে সমস্যা হয়েছে।' });
            })
            .finally(() => setIsSaving(false));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={student.imageUrl} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-xl">{student.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">শ্রেণি: {student.classGrade} | রোল: {student.rollNumber} | বেতন: ৳{student.monthlyFee}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingPayments ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>মাসের নাম</TableHead>
                                    <TableHead>পরিমাণ</TableHead>
                                    <TableHead className="text-right">একশন</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthsList.map(month => {
                                    const payment = paymentsByMonth[month];
                                    return (
                                        <TableRow key={month}>
                                            <TableCell className="font-medium">{month}</TableCell>
                                            <TableCell>{payment ? `৳${payment.amount}` : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                {payment ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">পরিশোধিত</Badge>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => handleOpenPaymentDialog(month)}>
                                                        <DollarSign className="mr-1 h-3 w-3" /> আদায়
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
            </Card>

            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>বেতন আদায় করুন</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>টাকার পরিমাণ</Label>
                            <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>আদায়কারী</Label>
                            <Select value={collectorName} onValueChange={setCollectorName}>
                                <SelectTrigger>
                                    <SelectValue placeholder="শিক্ষক নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers?.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCollectPayment} disabled={isSaving} className="w-full">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            নিশ্চিত করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ReceiptDialog 
                isOpen={isReceiptOpen}
                setIsOpen={setIsReceiptOpen}
                payment={lastPayment}
                student={student}
                settings={settings}
            />
        </div>
    );
}

function PaymentHistory() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const paymentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'payments'), orderBy('paymentDate', 'desc'), limit(50));
    }, [firestore]);
    const { data: payments, isLoading } = useCollection<Payment>(paymentsQuery);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'students');
    }, [firestore]);
    const { data: students } = useCollection<Student>(studentsQuery);
    const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s])), [students]);

    const handleDeletePayment = (paymentId: string) => {
        if (!firestore) return;
        if (!window.confirm('আপনি কি এই পেমেন্ট রেকর্ডটি মুছে ফেলতে চান?')) return;

        const paymentRef = doc(firestore, 'payments', paymentId);
        deleteDoc(paymentRef)
            .then(() => {
                toast({ title: 'সফল', description: 'পেমেন্ট রেকর্ডটি মুছে ফেলা হয়েছে।' });
            })
            .catch((error) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: paymentRef.path,
                    operation: 'delete',
                }));
            });
    };

    return (
        <Card>
            <CardHeader><CardTitle>সাম্প্রতিক আদায়ের তালিকা</CardTitle></CardHeader>
            <CardContent>
                {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
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
                                const s = studentsMap.get(p.studentId);
                                return (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{s?.name || 'Unknown'} (রোল: {s?.rollNumber})</TableCell>
                                        <TableCell>{format(parseISO(p.paymentMonth), 'MMMM yyyy', { locale: bn })}</TableCell>
                                        <TableCell>৳{p.amount}</TableCell>
                                        <TableCell className="text-xs">{format(parseISO(p.paymentDate), 'PP', { locale: bn })}</TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeletePayment(p.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {(!payments || payments.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export default function AccountingPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchRoll, setSearchRoll] = useState('');
    const [searchClass, setSearchClass] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
      if (!firestore || !searchClass || !searchRoll) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শ্রেণি এবং রোল নম্বর দিন।' });
        return;
      }
      setIsSearching(true);
      setSelectedStudent(null);
      try {
        const q = query(collection(firestore, 'students'), where('classGrade', '==', searchClass), where('rollNumber', '==', searchRoll));
        const snap = await getDocs(q);
        if (snap.empty) {
          toast({ variant: 'destructive', title: 'পাওয়া যায়নি', description: 'এই রোল নম্বরের কোনো শিক্ষার্থী নেই।' });
        } else {
          // Extra exact match check for the roll number
          const found = snap.docs.find(d => d.data().rollNumber.toString().trim() === searchRoll.trim());
          if (found) {
            setSelectedStudent({ id: found.id, ...found.data() } as Student);
          } else {
            toast({ variant: 'destructive', title: 'পাওয়া যায়নি', description: 'এই রোল নম্বরের কোনো শিক্ষার্থী নেই।' });
          }
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শিক্ষার্থী খুঁজতে সমস্যা হয়েছে। ' });
      } finally {
        setIsSearching(false);
      }
    };

    return (
        <div className="space-y-8 p-4 sm:p-8 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <h1 className="text-3xl font-bold font-headline text-amber-800 dark:text-amber-200">হিসাবরক্ষণ</h1>
            
            <Tabs defaultValue="collection" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="collection">বেতন আদায়</TabsTrigger>
                    <TabsTrigger value="history">আদায়ের তালিকা</TabsTrigger>
                </TabsList>

                <TabsContent value="collection">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-1">
                            <CardHeader><CardTitle className="text-lg">শিক্ষার্থী খুঁজুন</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>শ্রেণি</Label>
                                    <Select value={searchClass} onValueChange={setSearchClass}>
                                        <SelectTrigger><SelectValue placeholder="শ্রেণি" /></SelectTrigger>
                                        <SelectContent>
                                            {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>রোল</Label>
                                    <Input placeholder="রোল নম্বর" value={searchRoll} onChange={(e) => setSearchRoll(e.target.value)} />
                                </div>
                                <Button onClick={handleSearch} className="w-full" disabled={isSearching}>
                                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    খুঁজুন
                                </Button>
                            </CardContent>
                        </Card>
                        <div className="lg:col-span-2">
                            {selectedStudent ? <PaymentRecord student={selectedStudent} /> : (
                                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground h-full">
                                    শিক্ষার্থী খুঁজে বেতন আদায় শুরু করুন।
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="history">
                    <PaymentHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
}
