import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';
import { students } from '@/lib/data';
import { DashboardChart } from './dashboard-chart';

const totalStudents = students.length;
const presentStudents = Math.floor(totalStudents * 0.9); // Mock data
const absentStudents = totalStudents - presentStudents; // Mock data

export default function DashboardPage() {
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
            <div className="text-2xl font-bold">{totalStudents}</div>
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
            <div className="text-2xl font-bold flex items-center gap-4">
              <span>উপস্থিত: {presentStudents}</span>
              <span className="text-destructive flex items-center gap-1">
                <UserX className="h-5 w-5" /> {absentStudents}
              </span>
            </div>
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
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('bn-BD').format(125000)}
            </div>
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
          <DashboardChart />
        </CardContent>
      </Card>
    </div>
  );
}
