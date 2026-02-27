'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserCircle, Calculator, CalendarCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { classNames, type Student, type Attendance, type Payment } from '@/lib/data';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const months = [
  { value: '01', label: 'জানুয়ারি' },
  { value: '02', label: 'ফেব্রুয়ারি' },
  { value: '03', label: 'মার্চ' },
  { value: '04', label: 'এপ্রিল' },
  { value: '05', label: 'মে' },
  { value: '06', label: 'জুন' },
  { value: '07', label: 'জুলাই' },
  { value: '08', label: 'আগস্ট' },
  { value: '09', label: 'সেপ্টেম্বর' },
  { value: '10', label: 'অক্টোবর' },
  { value: '11', label: 'নভেম্বর' },
  { value: '12', label: 'ডিসেম্বর' },
];

export default function StudentProfilePage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const [isSearching, setIsSearching] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ present: number; absent: number; total: number; percentage: number }>({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0,
  });
  const [paymentData, setPaymentData] = useState<{ paid: number; unpaid: number; total: number; isPaid: boolean }>({
    paid: 0,
    unpaid: 0,
    total: 0,
    isPaid: false,
  });

  const reportHero = PlaceHolderImages.find(img => img.id === 'student-search-hero');

  const handleSearch = async () => {
    if (!firestore || !selectedClass || !rollNumber) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শ্রেণি এবং রোল নম্বর প্রদান করুন।' });
      return;
    }

    setIsSearching(true);
    try {
      const studentsRef = collection(firestore, 'students');
      const q = query(studentsRef, where('classGrade', '==', selectedClass), where('rollNumber', '==', rollNumber));
      const studentSnap = await getDocs(q);

      if (studentSnap.empty) {
        toast({ variant: 'destructive', title: 'পাওয়া যায়নি', description: 'এই রোল নম্বরের কোনো শিক্ষার্থী এই শ্রেণিতে নেই।' });
        setIsSearching(false);
        return;
      }

      const student = { id: studentSnap.docs[0].id, ...studentSnap.docs[0].data() } as Student;
      setStudentData(student);

      const monthPrefix = `${selectedYear}-${selectedMonth}`;
      const attendanceRef = collection(firestore, 'attendance');
      const attSnap = await getDocs(query(attendanceRef, where('studentId', '==', student.id)));
      
      const filteredAtt = attSnap.docs
        .map(doc => doc.data() as Attendance)
        .filter(att => att.date.startsWith(monthPrefix));

      const present = filteredAtt.filter(a => a.status === 'present').length;
      const total = filteredAtt.length;
      const absent = total - present;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setAttendanceData({ present, absent, total, percentage });

      const paymentMonthStr = `${selectedYear}-${selectedMonth}`;
      const paymentsRef = collection(firestore, 'payments');
      const payQuery = query(paymentsRef, where('studentId', '==', student.id), where('paymentMonth', '==', paymentMonthStr));
      const paySnap = await getDocs(payQuery);

      let paidAmount = 0;
      paySnap.docs.forEach(doc => {
        paidAmount += (doc.data() as Payment).amount;
      });

      const monthlyFee = student.monthlyFee || 0;
      const isPaid = paidAmount >= monthlyFee;
      const unpaid = isPaid ? 0 : monthlyFee - paidAmount;

      setPaymentData({
        paid: paidAmount,
        unpaid: unpaid,
        total: monthlyFee,
        isPaid: isPaid
      });

      setShowReport(true);
    } catch (error: any) {
      console.error("Error searching profile:", error);
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'তথ্য খুঁজতে সমস্যা হয়েছে।' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 rounded-xl bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800">
      <div className="flex items-center gap-3">
        <UserCircle className="h-8 w-8 text-pink-600" />
        <h1 className="text-3xl font-bold font-headline text-pink-800 dark:text-pink-200">শিক্ষার্থী প্রোফাইল অনুসন্ধান</h1>
      </div>

      <Card className="border-pink-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <Label>শ্রেণি নির্বাচন করুন</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="শ্রেণি" />
                </SelectTrigger>
                <SelectContent>
                  {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>রোল নম্বর</Label>
              <Input 
                placeholder="রোল" 
                value={rollNumber} 
                onChange={(e) => setRollNumber(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>মাস</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="মাস" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>বছর</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="বছর" />
                </SelectTrigger>
                <SelectContent>
                  {['2024', '2025', '2026'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-4 flex justify-center mt-4">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching} 
                className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto px-12"
              >
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                রিপোর্ট দেখুন
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-pink-700 flex items-center gap-2">
              <UserCircle className="h-6 w-6" />
              শিক্ষার্থী মাসিক রিপোর্ট
            </DialogTitle>
            <DialogDescription>
              {studentData?.name} | শ্রেণি: {studentData?.classGrade} | রোল: {studentData?.rollNumber}
              <br />
              রিপোর্ট মাস: {months.find(m => m.value === selectedMonth)?.label}, {selectedYear}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {reportHero && (
              <img 
                src={reportHero.imageUrl} 
                alt={reportHero.description} 
                className="w-full h-40 object-cover rounded-lg shadow-sm" 
                data-ai-hint={reportHero.imageHint}
              />
            )}

            <section className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-700">
                <CalendarCheck className="h-5 w-5" />
                হাজিরা তথ্য
              </h3>
              <Table className="border rounded-lg overflow-hidden">
                <TableHeader className="bg-cyan-50">
                  <TableRow>
                    <TableHead className="text-center">মোট কার্যদিবস</TableHead>
                    <TableHead className="text-center">উপস্থিতি</TableHead>
                    <TableHead className="text-center">অনুপস্থিতি</TableHead>
                    <TableHead className="text-center">শতকরা হার (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-center font-semibold">{attendanceData.total} দিন</TableCell>
                    <TableCell className="text-center text-green-600 font-bold">{attendanceData.present} দিন</TableCell>
                    <TableCell className="text-center text-red-600 font-bold">{attendanceData.absent} দিন</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        attendanceData.percentage >= 80 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {attendanceData.percentage}%
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold flex items-center gap-2 text-amber-700">
                <Calculator className="h-5 w-5" />
                বেতন ও পেমেন্ট তথ্য
              </h3>
              <Table className="border rounded-lg overflow-hidden">
                <TableHeader className="bg-amber-50">
                  <TableRow>
                    <TableHead className="text-center">মাসিক বেতন</TableHead>
                    <TableHead className="text-center">পরিশোধিত</TableHead>
                    <TableHead className="text-center">বকেয়া/অপরিশোধিত</TableHead>
                    <TableHead className="text-center">স্ট্যাটাস</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-center font-semibold">৳{paymentData.total}</TableCell>
                    <TableCell className="text-center text-green-600 font-bold">৳{paymentData.paid}</TableCell>
                    <TableCell className="text-center text-red-600 font-bold">৳{paymentData.unpaid}</TableCell>
                    <TableCell className="text-center">
                      {paymentData.isPaid ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">পরিশোধিত</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">বকেয়া</span>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </section>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowReport(false)} variant="outline">বন্ধ করুন</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
