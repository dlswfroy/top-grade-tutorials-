'use client';
import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { DashboardChart } from './dashboard-chart';
import type { Student, Payment, Attendance } from '@/lib/data';
import { format, parseISO, isThisMonth } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'students');
  }, [firestore, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'payments');
  }, [firestore, user]);
  const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const attendanceQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'attendance'), where('date', '==', today));
  }, [firestore, user, today]);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">ড্যাসবোর্ড</h1>
        <p className="text-muted-foreground">
          আপনার প্রতিষ্ঠানের তথ্যের সারসংক্ষেপ দেখুন।
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">মোট শিক্ষার্থী</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{totalStudents}</div>}
            <p className="text-xs text-muted-foreground">
              সকল শ্রেণির শিক্ষার্থী
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">আজকের উপস্থিতি</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingStudents || isLoadingAttendance ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold flex items-center gap-4">
                    <span>উপস্থিত: {presentStudents}</span>
                    <span className="text-destructive flex items-center gap-1">
                        <UserX className="h-5 w-5" /> {absentStudents}
                    </span>
                </div>
             )}
            <p className="text-xs text-muted-foreground">
              আজকের উপস্থিত ও অনুপস্থিত শিক্ষার্থী
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">মাসিক আয়</CardTitle>
            <span className="text-2xl font-bold">৳</span>
          </CardHeader>
          <CardContent>
            {isLoadingPayments ? <Loader2 className="h-6 w-6 animate-spin" /> :
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('bn-BD').format(monthlyIncome)}
              </div>
            }
            <p className="text-xs text-muted-foreground">
              চলতি মাসের মোট আদায়
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>শ্রেণিভিত্তিক শিক্ষার্থী</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <DashboardChart students={students} isLoading={isLoadingStudents} />
        </CardContent>
      </Card>
    </div>
  );
}
