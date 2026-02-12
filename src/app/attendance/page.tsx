'use client';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { classNames, type Student, type Attendance } from '@/lib/data';
import { Loader2, Save, ChevronsRight, Info } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


type AttendanceStatus = 'present' | 'absent';

export default function AttendancePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);

  const formattedDate = useMemo(() => {
    return selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  }, [selectedDate]);

  // Fetch students of the selected class
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedClass || !user) return null;
    return query(collection(firestore, 'students'), where('classGrade', '==', selectedClass));
  }, [firestore, selectedClass, user]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  // Fetch existing attendance for the selected class and date
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !selectedClass || !formattedDate || !user) return null;
    return query(collection(firestore, 'attendance'), where('classGrade', '==', selectedClass), where('date', '==', formattedDate));
  }, [firestore, selectedClass, formattedDate, user]);
  const { data: existingAttendance, isLoading: isLoadingAttendance } = useCollection<Attendance>(attendanceQuery);
  
  const isAttendanceAlreadySaved = useMemo(() => {
      return !isLoadingAttendance && existingAttendance && existingAttendance.length > 0;
  }, [existingAttendance, isLoadingAttendance]);

  // Pre-fill attendance state with existing data
  useMemo(() => {
    if (existingAttendance) {
      const newAttendance = existingAttendance.reduce((acc, record) => {
        acc[record.studentId] = record.status;
        return acc;
      }, {} as Record<string, AttendanceStatus>);
      setAttendance(newAttendance);
    } else {
        // Reset if no existing attendance
        setAttendance({});
    }
  }, [existingAttendance]);
  
  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!firestore || !user || !students || students.length === 0 || !formattedDate) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শ্রেণি ও তারিখ নির্বাচন করুন এবং অন্তত একজন শিক্ষার্থী থাকতে হবে।' });
        return;
    }
    
    setIsSaving(true);
    try {
        const batch = writeBatch(firestore);
        
        students.forEach(student => {
            const status = attendance[student.id] || 'absent'; // Default to absent if not marked
            const attendanceId = `${student.id}_${formattedDate}`;
            const attendanceRef = doc(firestore, 'attendance', attendanceId);
            
            const attendanceData: Omit<Attendance, 'id'> = {
                studentId: student.id,
                classGrade: selectedClass,
                date: formattedDate,
                status: status,
                recordedByTeacherId: user.uid,
            };
            batch.set(attendanceRef, attendanceData, { merge: true });
        });
        
        await batch.commit();
        toast({ title: 'সফল', description: 'হাজিরা সফলভাবে সেভ করা হয়েছে।' });

    } catch (error: any) {
        console.error("Error saving attendance:", error);
        toast({
            variant: 'destructive',
            title: 'ত্রুটি',
            description: `হাজিরা সেভ করতে সমস্যা হয়েছে: ${error.message}`
        });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">হাজিরা খাতা</h1>
        <p className="text-muted-foreground">শিক্ষার্থীদের দৈনিক উপস্থিতি নিন।</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-auto flex-1 space-y-2">
                <Label>শ্রেণি</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                    <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                    {classNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
                </Select>
            </div>
            <div className="w-full sm:w-auto flex-1 space-y-2">
                <Label>তারিখ</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                        )}
                    >
                        <ChevronsRight className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: bn }) : <span>একটি তারিখ নির্বাচন করুন</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {(isLoadingStudents || isLoadingAttendance) && selectedClass ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : students && students.length > 0 ? (
                <>
                {isAttendanceAlreadySaved && (
                    <Alert className="mb-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>হাজিরা সম্পন্ন</AlertTitle>
                        <AlertDescription>
                            এই শ্রেণি এবং তারিখের জন্য হাজিরা ইতিমধ্যে নেওয়া হয়েছে।
                        </AlertDescription>
                    </Alert>
                )}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>রোল</TableHead>
                            <TableHead>নাম</TableHead>
                            <TableHead className="text-center">হাজিরা</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map(student => (
                             <TableRow key={student.id}>
                                <TableCell>{student.rollNumber}</TableCell>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell className="text-center">
                                    <RadioGroup 
                                        value={attendance[student.id] || ''} 
                                        onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceStatus)}
                                        className="justify-center"
                                        disabled={isAttendanceAlreadySaved}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="present" id={`present-${student.id}`} />
                                            <Label htmlFor={`present-${student.id}`}>হাজির</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="absent" id={`absent-${student.id}`} />
                                            <Label htmlFor={`absent-${student.id}`}>অনুপস্থিত</Label>
                                        </div>
                                    </RadioGroup>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveAttendance} disabled={isSaving || isAttendanceAlreadySaved}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isAttendanceAlreadySaved ? 'হাজিরা সেভ করা হয়েছে' : 'হাজিরা সেভ করুন'}
                    </Button>
                </div>
                </>
            ) : (
                 <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-full">
                    <p className="text-muted-foreground">শিক্ষার্থীদের তালিকা দেখার জন্য শ্রেণি ও তারিখ নির্বাচন করুন।</p>
                 </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
