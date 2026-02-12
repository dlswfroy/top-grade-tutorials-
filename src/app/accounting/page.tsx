'use client';
import { useState } from 'react';
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
import { students, teachers, classNames, type Student } from '@/lib/data';
import { Search, Printer } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function AccountingPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchRoll, setSearchRoll] = useState('');
  const [searchClass, setSearchClass] = useState('');

  const handleSearch = () => {
    const student = students.find(
      (s) => s.roll.toString() === searchRoll && s.class === searchClass
    );
    setSelectedStudent(student || null);
  };

  const handlePrint = () => {
    const printableContent = document.getElementById('receipt')?.innerHTML;
    if (printableContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printableContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
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
              <Button onClick={handleSearch} className="w-full">
                <Search className="mr-2 h-4 w-4" />
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
                    <AvatarImage src={selectedStudent.image} data-ai-hint={selectedStudent.imageHint} alt={selectedStudent.name} />
                    <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedStudent.name}</CardTitle>
                    <CardDescription>
                      শ্রেণি: {selectedStudent.class} | রোল: {selectedStudent.roll}
                    </CardDescription>
                    <p className="text-sm font-semibold mt-1">মাসিক বেতন: ৳{selectedStudent.monthlyFee}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div id="receipt" className="space-y-4">
                  <div className="print:hidden">
                    <h3 className="text-lg font-semibold mb-4">বেতন আদায় ফরম</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="month">মাসের নাম</Label>
                          <Select>
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
                          <Input id="amount" type="number" defaultValue={selectedStudent.monthlyFee} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="collector">আদায়কারী</Label>
                        <Select>
                          <SelectTrigger id="collector">
                            <SelectValue placeholder="আদায়কারীর নাম নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-4">
                         <Button>বেতন আদায় করুন</Button>
                         <Button variant="outline" onClick={handlePrint}>
                          <Printer className="mr-2 h-4 w-4" />
                          রসিদ প্রিন্ট করুন
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Printable receipt structure (hidden by default) */}
                  <div className="hidden print:block p-4 border rounded-lg">
                      <div className="text-center space-y-2 mb-4">
                        <h1 className="text-2xl font-bold">টপ গ্রেড টিউটোরিয়ালস</h1>
                        <p>বেতন আদায়ের রসিদ</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <p><strong>শিক্ষার্থীর নাম:</strong> {selectedStudent.name}</p>
                        <p><strong>শ্রেণি:</strong> {selectedStudent.class}</p>
                        <p><strong>রোল:</strong> {selectedStudent.roll}</p>
                        <p><strong>পিতার নাম:</strong> {selectedStudent.fatherName}</p>
                        <p><strong>তারিখ:</strong> {new Date().toLocaleDateString('bn-BD')}</p>
                        <p><strong>মাস:</strong> জুন</p>
                      </div>
                      <Separator className="my-4"/>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>মোট প্রদত্ত:</span>
                        <span>৳{selectedStudent.monthlyFee}</span>
                      </div>
                      <Separator className="my-4"/>
                      <div className="flex justify-between text-xs mt-8">
                        <span>আদায়কারীর স্বাক্ষর</span>
                        <span>অভিভাবকের স্বাক্ষর</span>
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-full">
              <p className="text-muted-foreground">শিক্ষার্থীর তথ্য দেখার জন্য শ্রেণি ও রোল দিয়ে খুঁজুন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
