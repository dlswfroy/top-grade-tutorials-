
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
import { classNames, type Student, type Attendance, type Message } from '@/lib/data';
import { Loader2, Phone, MessageCircle, MessageSquare, Users, Search, History, CheckCircle2, UserX } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, addDoc, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function MessagingPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedClass, setSelectedClass] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'absent'>('all');
  const [isSending, setIsSending] = useState<Record<string, boolean>>({});

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Fetch students
  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedClass) return null;
    return query(collection(firestore, 'students'), where('classGrade', '==', selectedClass));
  }, [firestore, selectedClass]);
  const { data: students, isLoading: isLoadingStudents } = useCollection<Student>(studentsQuery);

  // Fetch today's attendance for the class
  const attendanceQuery = useMemoFirebase(() => {
    if (!firestore || !selectedClass) return null;
    return query(collection(firestore, 'attendance'), where('classGrade', '==', selectedClass), where('date', '==', today));
  }, [firestore, selectedClass, today]);
  const { data: attendance, isLoading: isLoadingAttendance } = useCollection<Attendance>(attendanceQuery);

  // Message Logs (History)
  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'messages'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore]);
  const { data: logs } = useCollection<Message>(logsQuery);

  const studentsToDisplay = useMemo(() => {
    if (!students) return [];
    
    let filtered = [...students];
    if (filterType === 'absent' && attendance) {
        const absentIds = attendance.filter(a => a.status === 'absent').map(a => a.studentId);
        filtered = filtered.filter(s => absentIds.includes(s.id));
    }
    
    return filtered.sort((a, b) => (parseInt(a.rollNumber, 10) || 0) - (parseInt(b.rollNumber, 10) || 0));
  }, [students, filterType, attendance]);

  const handleAction = async (student: Student, type: 'sms' | 'call') => {
    if (!firestore) return;
    
    setIsSending(prev => ({ ...prev, [student.id]: true }));
    
    const messageData: Omit<Message, 'id'> = {
      studentId: student.id,
      type: type,
      timestamp: new Date().toISOString(),
      status: 'initiated'
    };

    try {
        // Log to Firestore
        await addDoc(collection(firestore, 'messages'), messageData);
        
        // Trigger Mobile Protocol
        if (type === 'call') {
            window.location.href = `tel:${student.mobileNumber}`;
        } else {
            const body = `শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${student.name} আজ কোচিং-এ উপস্থিত হয়নি। বিস্তারিত জানতে কল করুন। - টপ গ্রেড টিউটোরিয়ালস`;
            window.location.href = `sms:${student.mobileNumber}?body=${encodeURIComponent(body)}`;
        }
    } catch (err) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'messages',
            operation: 'create',
            requestResourceData: messageData
        }));
    } finally {
        setIsSending(prev => ({ ...prev, [student.id]: false }));
    }
  };

  const handleBulkSMS = () => {
      if (studentsToDisplay.length === 0) return;
      
      const numbers = studentsToDisplay.map(s => s.mobileNumber).join(',');
      const body = `শ্রদ্ধেয় অভিভাবক, আপনার সন্তানের পড়াশোনার উন্নতির জন্য আমরা সর্বদা সচেষ্ট। কোনো জিজ্ঞাসা থাকলে আমাদের সাথে যোগাযোগ করুন। - টপ গ্রেড টিউটোরিয়ালস`;
      
      window.location.href = `sms:${numbers}?body=${encodeURIComponent(body)}`;
      toast({ title: 'এসএমএস প্রস্তুত', description: 'আপনার ফোনের মেসেজ অ্যাপে সকল নম্বর পাঠানো হয়েছে।' });
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold font-headline text-purple-800 dark:text-purple-200">মেসেজ ও যোগাযোগ</h1>
        </div>
      </div>

      <Tabs defaultValue="messaging" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="messaging" className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> যোগাযোগ
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" /> ইতিহাস
              </TabsTrigger>
          </TabsList>

          <TabsContent value="messaging" className="space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle className="text-lg">শিক্ষার্থী নির্বাচন</CardTitle>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                          <div className="space-y-2">
                              <Label>শ্রেণি</Label>
                              <Select value={selectedClass} onValueChange={setSelectedClass}>
                                  <SelectTrigger>
                                      <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label>ফিল্টার</Label>
                              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="all">সকল শিক্ষার্থী</SelectItem>
                                      <SelectItem value="absent">আজকের অনুপস্থিত</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="flex items-end">
                              <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleBulkSMS} disabled={studentsToDisplay.length === 0}>
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  সবাইকে একসাথে এসএমএস
                              </Button>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent>
                      {isLoadingStudents || isLoadingAttendance ? (
                          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
                      ) : selectedClass ? (
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead className="w-16">রোল</TableHead>
                                      <TableHead>শিক্ষার্থী</TableHead>
                                      <TableHead>মোবাইল</TableHead>
                                      <TableHead className="text-center">স্ট্যাটাস</TableHead>
                                      <TableHead className="text-right">একশন</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {studentsToDisplay.map(student => {
                                      const att = attendance?.find(a => a.studentId === student.id);
                                      return (
                                          <TableRow key={student.id}>
                                              <TableCell className="font-bold">{student.rollNumber}</TableCell>
                                              <TableCell>
                                                  <div className="flex items-center gap-2">
                                                      <Avatar className="h-8 w-8">
                                                          <AvatarImage src={student.imageUrl} />
                                                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                                                      </Avatar>
                                                      <span className="font-medium">{student.name}</span>
                                                  </div>
                                              </TableCell>
                                              <TableCell className="text-xs">{student.mobileNumber}</TableCell>
                                              <TableCell className="text-center">
                                                  {att?.status === 'present' ? (
                                                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">উপস্থিত</Badge>
                                                  ) : att?.status === 'absent' ? (
                                                      <Badge variant="destructive" className="bg-red-500">অনুপস্থিত</Badge>
                                                  ) : (
                                                      <Badge variant="secondary">অজানা</Badge>
                                                  )}
                                              </TableCell>
                                              <TableCell className="text-right flex justify-end gap-2">
                                                  <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 border-blue-200" onClick={() => handleAction(student, 'call')} disabled={isSending[student.id]}>
                                                      <Phone className="h-4 w-4" />
                                                  </Button>
                                                  <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200" onClick={() => handleAction(student, 'sms')} disabled={isSending[student.id]}>
                                                      <MessageCircle className="h-4 w-4" />
                                                  </Button>
                                              </TableCell>
                                          </TableRow>
                                      );
                                  })}
                                  {studentsToDisplay.length === 0 && (
                                      <TableRow>
                                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">কোনো শিক্ষার্থী পাওয়া যায়নি।</TableCell>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      ) : (
                          <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                              যোগাযোগ শুরু করতে প্রথমে শ্রেণি নির্বাচন করুন।
                          </div>
                      )}
                  </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="history">
              <Card>
                  <CardHeader>
                      <CardTitle>যোগাযোগের ইতিহাস</CardTitle>
                      <CardDescription>সাম্প্রতিক করা কল এবং এসএমএস-এর তালিকা।</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>তারিখ ও সময়</TableHead>
                                  <TableHead>টাইপ</TableHead>
                                  <TableHead>শিক্ষার্থী আইডি</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {logs?.map(log => (
                                  <TableRow key={log.id}>
                                      <TableCell className="text-xs font-medium">
                                          {format(new Date(log.timestamp), 'PPpp', { locale: bn })}
                                      </TableCell>
                                      <TableCell>
                                          {log.type === 'sms' ? (
                                              <Badge variant="outline" className="text-green-600 border-green-200">এসএমএস</Badge>
                                          ) : (
                                              <Badge variant="outline" className="text-blue-600 border-blue-200">কল</Badge>
                                          )}
                                      </TableCell>
                                      <TableCell>
                                          <span className="text-xs">{log.studentId}</span>
                                      </TableCell>
                                  </TableRow>
                              ))}
                              {!logs || logs.length === 0 && (
                                  <TableRow>
                                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">এখনো কোনো যোগাযোগের ইতিহাস নেই।</TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
