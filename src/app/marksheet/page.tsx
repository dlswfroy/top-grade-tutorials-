'use client';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { classNames, type Student, type Marksheet } from '@/lib/data';
import { useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, getDocs, addDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Printer, Save, PlusCircle, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

const subjects = ['বাংলা', 'ইংরেজি', 'গণিত', 'বিজ্ঞান', 'সমাজবিজ্ঞান', 'ধর্ম'];
const examTypes = ['অর্ধ-বার্ষিক', 'বার্ষিক'];

const getGradeInfo = (marks: number): { grade: string; gpa: number } => {
  if (marks >= 80) return { grade: 'A+', gpa: 5.0 };
  if (marks >= 70) return { grade: 'A', gpa: 4.0 };
  if (marks >= 60) return { grade: 'A-', gpa: 3.5 };
  if (marks >= 50) return { grade: 'B', gpa: 3.0 };
  if (marks >= 40) return { grade: 'C', gpa: 2.0 };
  if (marks >= 33) return { grade: 'D', gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
};

function CreateMarksheet() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRoll, setSearchRoll] = useState('');
  const [searchClass, setSearchClass] = useState('');
  const [examType, setExamType] = useState('');
  const [marks, setMarks] = useState<Record<string, number | string>>({});
  const [isSaving, setIsSaving] = useState(false);

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
        setSelectedStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);
      }
    } catch (error) {
      console.error("Error searching for student:", error);
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শিক্ষার্থী খুঁজতে গিয়ে সমস্যা হয়েছে।' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMarkChange = (subject: string, value: string) => {
    const numericValue = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
    setMarks(prev => ({ ...prev, [subject]: numericValue }));
  };
  
  const handleSaveMarksheet = () => {
      if (!firestore || !selectedStudent || !examType) {
          toast({ variant: 'destructive', title: 'ত্রুটি', description: 'শিক্ষার্থী এবং পরীক্ষার ধরন নির্বাচন করুন।'});
          return;
      }
      
      const subjectMarks = subjects.map(subject => ({
          subject,
          marks: Number(marks[subject] || 0)
      }));

      const totalMarks = subjectMarks.reduce((sum, item) => sum + item.marks, 0);
      const isFailed = subjectMarks.some(item => item.marks < 33);
      const gpa = isFailed ? 0 : subjectMarks.reduce((sum, item) => sum + getGradeInfo(item.marks).gpa, 0) / subjects.length;

      const marksheetData: Omit<Marksheet, 'id'> = {
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          classGrade: selectedStudent.classGrade,
          rollNumber: selectedStudent.rollNumber,
          examType: examType,
          year: new Date().getFullYear().toString(),
          marks: subjectMarks,
          totalMarks,
          gpa: parseFloat(gpa.toFixed(2)),
          grade: isFailed ? 'F' : getGradeInfo(totalMarks / subjects.length).grade,
          dateCreated: new Date().toISOString(),
      };
      
      setIsSaving(true);
      const marksheetCollection = collection(firestore, 'marksheets');
      addDoc(marksheetCollection, marksheetData)
        .then(() => {
            toast({ title: 'সফল', description: 'মার্কশিট সফলভাবে সেভ করা হয়েছে।'});
            setSelectedStudent(null);
            setSearchRoll('');
            setSearchClass('');
            setExamType('');
            setMarks({});
        })
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: marksheetCollection.path,
                operation: 'create',
                requestResourceData: marksheetData
            }))
        })
        .finally(() => {
            setIsSaving(false);
        });

  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-bold text-purple-900 dark:text-purple-100">নতুন মার্কশিট তৈরি করুন</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={searchClass} onValueChange={setSearchClass}>
            <SelectTrigger><SelectValue placeholder="শ্রেণি নির্বাচন" /></SelectTrigger>
            <SelectContent>{classNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="রোল নম্বর" value={searchRoll} onChange={e => setSearchRoll(e.target.value)} />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />} শিক্ষার্থী খুঁজুন
          </Button>
        </div>
        {selectedStudent && (
          <Card>
            <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-200">শিক্ষার্থীর নাম: {selectedStudent.name}</CardTitle>
                <CardDescription>শ্রেণি: {selectedStudent.classGrade} | রোল: {selectedStudent.rollNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger><SelectValue placeholder="পরীক্ষার ধরন নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                        {examTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                </Select>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(subject => (
                        <div key={subject} className="space-y-2">
                            <Label htmlFor={subject} className="text-slate-700 dark:text-slate-300">{subject}</Label>
                            <Input
                                id={subject}
                                type="number"
                                placeholder="নম্বর (০-১০০)"
                                value={marks[subject] || ''}
                                onChange={e => handleMarkChange(subject, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSaveMarksheet} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} মার্কশিট সেভ করুন
                    </Button>
                </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

function MarksheetList() {
    const firestore = useFirestore();
    const marksheetsQuery = useMemoFirebase(() => {
        if(!firestore) return null;
        return collection(firestore, 'marksheets');
    }, [firestore]);
    const { data: marksheets, isLoading } = useCollection<Marksheet>(marksheetsQuery);
    
    const [selectedMarksheet, setSelectedMarksheet] = useState<Marksheet | null>(null);

    const handlePrint = (marksheet: Marksheet) => {
        const printContent = `
            <html>
                <head>
                    <title>Marksheet</title>
                    <style>
                        body { font-family: sans-serif; margin: 20px; }
                        .marksheet { border: 2px solid #000; padding: 20px; width: 100%; max-width: 800px; margin: auto; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .student-info { margin-bottom: 20px; }
                        .student-info table { width: 100%; border-collapse: collapse; }
                        .student-info td { padding: 5px; }
                        .marks-table { width: 100%; border-collapse: collapse; }
                        .marks-table th, .marks-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                        .marks-table th { background-color: #f2f2f2; }
                        .summary { margin-top: 20px; text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="marksheet">
                        <div class="header">
                            <h2>Top Grade Tutorials</h2>
                            <h3>${marksheet.examType} পরীক্ষার মার্কশিট - ${marksheet.year}</h3>
                        </div>
                        <div class="student-info">
                            <table>
                                <tr><td>শিক্ষার্থীর নাম: ${marksheet.studentName}</td><td>রোল: ${marksheet.rollNumber}</td></tr>
                                <tr><td>শ্রেণি: ${marksheet.classGrade}</td><td></td></tr>
                            </table>
                        </div>
                        <table class="marks-table">
                            <thead>
                                <tr><th>বিষয়</th><th>নম্বর</th><th>গ্রেড</th><th>জি.পি.এ</th></tr>
                            </thead>
                            <tbody>
                                ${marksheet.marks.map(m => `
                                    <tr>
                                        <td>${m.subject}</td>
                                        <td>${m.marks}</td>
                                        <td>${getGradeInfo(m.marks).grade}</td>
                                        <td>${getGradeInfo(m.marks).gpa.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="summary">
                            <p><strong>মোট নম্বর:</strong> ${marksheet.totalMarks}</p>
                            <p><strong>গ্রেড:</strong> ${marksheet.grade}</p>
                            <p><strong>জি.পি.এ:</strong> ${marksheet.gpa.toFixed(2)}</p>
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


    if (isLoading) {
        return <div className="flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-bold text-purple-900 dark:text-purple-100">সকল মার্কশিট</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>নাম</TableHead>
                            <TableHead>শ্রেণি</TableHead>
                            <TableHead>রোল</TableHead>
                            <TableHead>পরীক্ষা</TableHead>
                            <TableHead>জি.পি.এ</TableHead>
                            <TableHead>তারিখ</TableHead>
                            <TableHead className="text-right">একশন</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {marksheets?.map(ms => (
                            <TableRow key={ms.id}>
                                <TableCell>{ms.studentName}</TableCell>
                                <TableCell>{ms.classGrade}</TableCell>
                                <TableCell>{ms.rollNumber}</TableCell>
                                <TableCell>{ms.examType}</TableCell>
                                <TableCell>{ms.gpa.toFixed(2)}</TableCell>
                                <TableCell>{format(new Date(ms.dateCreated), 'PP', { locale: bn })}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => handlePrint(ms)}>
                                        <Printer className="mr-2 h-4 w-4" /> প্রিন্ট
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function MarksheetPage() {
    return (
        <div className="space-y-8 p-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
             <div>
                <h1 className="text-3xl font-bold font-headline text-purple-800 dark:text-purple-200">মার্কশিট</h1>
             </div>
            <CreateMarksheet />
            <MarksheetList />
        </div>
    );
}
