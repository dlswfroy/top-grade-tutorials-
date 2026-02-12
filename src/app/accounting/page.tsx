'use client';
import { useState, useMemo } from 'react';
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
import { classNames, type Student, type Teacher } from '@/lib/data';
import { Search, Printer, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, where, query, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';


export default function AccountingPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRoll, setSearchRoll] = useState('');
  const [searchClass, setSearchClass] = useState('');

  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [paymentCollectorId, setPaymentCollectorId] = useState('');

  const teachersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'teachers');
  }, [firestore]);
  const { data: teachers } = useCollection<Teacher>(teachersQuery);

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
        setPaymentAmount(studentData.monthlyFee);
      }
    } catch (error) {
      console.error("Error searching for student:", error);
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শিক্ষার্থী খুঁজতে গিয়ে সমস্যা হয়েছে।' });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePayment = () => {
      if (!firestore || !selectedStudent || !paymentMonth || !paymentAmount || !paymentCollectorId) {
          toast({ variant: 'destructive', title: 'ত্রুটি', description: 'অনুগ্রহ করে সকল পেমেন্ট তথ্য পূরণ করুন।'});
          return;
      }

      // In a real app with auth, you'd get the teacher's UID. Here we use the selected teacher's doc id.
      const teacherId = paymentCollectorId; 

      const paymentData = {
          studentId: selectedStudent.id,
          teacherId: teacherId,
          amount: Number(paymentAmount),
          paymentMonth,
          paymentDate: new Date().toISOString(),
          receiptNumber: `RCPT-${Date.now()}` // simple receipt number
      };

      addDocumentNonBlocking(collection(firestore, 'payments'), paymentData);

      toast({ title: 'সফল', description: 'বেতন সফলভাবে আদায় করা হয়েছে।'});
      // Reset form
      setPaymentMonth('');
      setPaymentCollectorId('');
  }

  const handlePrint = () => {
    // This print function is simplified and will print a generated receipt.
    // In a real scenario, you'd fetch the saved payment record.
    const receiptContent = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ccc; width: 300px; margin: auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px; margin: 0;">টপ গ্রেড টিউটোরিয়ালস</h1>
                <p style="margin: 0;">বেতন আদায়ের রসিদ</p>
            </div>
            <p><strong>শিক্ষার্থীর নাম:</strong> ${selectedStudent?.name}</p>
            <p><strong>শ্রেণি:</strong> ${selectedStudent?.classGrade}</p>
            <p><strong>রোল:</strong> ${selectedStudent?.rollNumber}</p>
            <p><strong>মাস:</strong> ${paymentMonth}</p>
            <p><strong>তারিখ:</strong> ${new Date().toLocaleDateString('bn-BD')}</p>
            <hr style="margin: 20px 0;" />
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                <span>মোট প্রদত্ত:</span>
                <span>৳${paymentAmount}</span>
            </div>
            <hr style="margin: 20px 0;" />
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 50px;">
                <span>আদায়কারীর স্বাক্ষর</span>
                <span>অভিভাবকের স্বাক্ষর</span>
            </div>
        </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.print();
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
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedStudent.imageUrl} data-ai-hint={selectedStudent.imageHint} alt={selectedStudent.name} />
                    <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedStudent.name}</CardTitle>
                    <CardDescription>
                      শ্রেণি: {selectedStudent.classGrade} | রোল: {selectedStudent.rollNumber}
                    </CardDescription>
                    <p className="text-sm font-semibold mt-1">মাসিক বেতন: ৳{selectedStudent.monthlyFee}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">বেতন আদায় ফরম</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="month">মাসের নাম</Label>
                          <Select value={paymentMonth} onValueChange={setPaymentMonth}>
                            <SelectTrigger id="month">
                              <SelectValue placeholder="মাস নির্বাচন করুন" />
                            </SelectTrigger>
                            <SelectContent>
                              {['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">টাকার পরিমাণ</Label>
                          <Input id="amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                        </div>
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
                      <div className="flex gap-4">
                         <Button onClick={handlePayment}>বেতন আদায় করুন</Button>
                         <Button variant="outline" onClick={handlePrint}>
                          <Printer className="mr-2 h-4 w-4" />
                          রসিদ প্রিন্ট করুন
                        </Button>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-full">
              {isSearching ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <p className="text-muted-foreground">শিক্ষার্থীর তথ্য দেখার জন্য শ্রেণি ও রোল দিয়ে খুঁজুন।</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
