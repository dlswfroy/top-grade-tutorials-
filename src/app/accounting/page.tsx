'use client';
import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { classNames, type Student, type Teacher, type Payment } from '@/lib/data';
import { Search, Printer, Loader2, DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, where, query, getDocs, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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

const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

type InstitutionSettings = {
    institutionName?: string;
    logoUrl?: string;
};

function PaymentRecord({ student }: { student: Student }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [paymentAmount, setPaymentAmount] = useState<number | string>('');
    const [paymentCollectorId, setPaymentCollectorId] = useState('');

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
        return payments.reduce((acc, payment) => {
            acc[payment.paymentMonth] = payment;
            return acc;
        }, {} as Record<string, Payment>);
    }, [payments]);
    
    const getTeacherName = (teacherId: string) => {
        return teachers?.find(t => t.id === teacherId)?.name || 'N/A';
    }

    const handleOpenPaymentDialog = (month: string) => {
        setSelectedMonth(month);
        setPaymentAmount(student.monthlyFee);
        setIsDialogOpen(true);
    };

    const handleCollectPayment = () => {
        if (!firestore || !selectedMonth || !paymentAmount || !paymentCollectorId) {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল তথ্য পূরণ করুন।' });
            return;
        }

        const paymentData = {
            studentId: student.id,
            teacherId: paymentCollectorId,
            amount: Number(paymentAmount),
            paymentMonth: selectedMonth,
            paymentDate: new Date().toISOString(),
            receiptNumber: `RCPT-${Date.now()}`
        };

        addDocumentNonBlocking(collection(firestore, 'payments'), paymentData);
        toast({ title: 'সফল', description: 'বেতন সফলভাবে আদায় করা হয়েছে।' });
        setIsDialogOpen(false);
        setPaymentCollectorId('');
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
                        <h3>বেতন আদায় কার্ড</h3>
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
                                    <td>${paymentsByMonth[month] ? format(new Date(paymentsByMonth[month]!.paymentDate), 'PP', { locale: bn }) : ''}</td>
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
                        <AvatarImage src={student.imageUrl} data-ai-hint={student.imageHint || 'student person'} alt={student.name} />
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
                                        <TableCell>{payment ? format(new Date(payment.paymentDate), 'PP', { locale: bn }) : 'N/A'}</TableCell>
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
                        <DialogTitle>{selectedMonth} মাসের বেতন আদায়</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">টাকার পরিমাণ</Label>
                          <Input id="amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="collector">আদায়কারী</Label>
                            <Select value={paymentCollectorId} onValueChange={setPaymentCollectorId}>
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
                        <Button onClick={handleCollectPayment}>বেতন আদায় করুন</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export default function AccountingPage() {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">হিসাবরক্ষণ</h1>
        <p className="text-muted-foreground">শিক্ষার্থীদের মাসিক বেতন আদায় করুন এবং রসিদ প্রিন্ট করুন।</p>
      </div>

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
    </div>
  );
}
