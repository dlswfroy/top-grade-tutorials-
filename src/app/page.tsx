'use client';
import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Student, Payment, Attendance } from '@/lib/data';
import { format, parseISO, isThisMonth } from 'date-fns';

function Dashboard() {
  const firestore = useFirestore();
  
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'students');
  }, [firestore]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'payments'));
  }, [firestore]);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
  
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const attendanceQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'attendance'), where('date', '==', today));
  }, [firestore, today]);
  const { data: todaysAttendance, isLoading: isLoadingAttendance } = useCollection<Attendance>(attendanceQuery);

  const totalStudents = students?.length ?? 0;
  
  const { presentStudents, absentStudents } = useMemo(() => {
    if (!todaysAttendance) return { presentStudents: 0, absentStudents: 0 };
    const present = todaysAttendance.filter(a => a.status === 'present').length;
    const absent = todaysAttendance.filter(a => a.status === 'absent').length;
    return { presentStudents: present, absentStudents: absent };
  }, [todaysAttendance]);

  const monthlyIncome = useMemo(() => {
    if (!payments) return 0;
    return payments
        .filter(p => isThisMonth(parseISO(p.paymentDate)))
        .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  return (
    <div className="space-y-8 p-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-blue-800 dark:text-blue-200">ড্যাসবোর্ড</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-gray-600 dark:text-gray-300">মোট শিক্ষার্থী</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{totalStudents}</div>}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              সকল শ্রেণির শিক্ষার্থী
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-gray-600 dark:text-gray-300">আজকের উপস্থিতি</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingStudents || isLoadingAttendance ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold flex items-center gap-4 text-gray-800 dark:text-gray-200">
                    <span>উপস্থিত: <span className="text-green-600 font-bold">{presentStudents}</span></span>
                    <span className="text-destructive flex items-center gap-1">
                        <UserX className="h-5 w-5" /> <span className="text-red-600 font-bold">{absentStudents}</span>
                    </span>
                </div>
             )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              আজকের উপস্থিত ও অনুপস্থিত শিক্ষার্থী
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-gray-600 dark:text-gray-300">মাসিক আয়</CardTitle>
            <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">৳</span>
          </CardHeader>
          <CardContent>
            {isLoadingPayments ? <Loader2 className="h-6 w-6 animate-spin" /> :
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {new Intl.NumberFormat('bn-BD').format(monthlyIncome)}
              </div>
            }
            <p className="text-xs text-gray-500 dark:text-gray-400">
              চলতি মাসের মোট আদায়
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
