'use client';
import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { BookOpen, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { classNames } from '@/lib/data';
import { boardBooks } from '@/lib/board-books';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function DataStorePage() {
  const [selectedClass, setSelectedClass] = useState('');

  const filteredBooks = useMemo(() => {
    if (!selectedClass) return [];
    return boardBooks.filter(book => book.classGrade === selectedClass);
  }, [selectedClass]);

  return (
    <div className="space-y-8 p-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-purple-800 dark:text-purple-200">তথ্য ভান্ডার</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-purple-900 dark:text-purple-100">বোর্ড বইসমূহ</CardTitle>
          <CardContent className="p-0 pt-4">
              <div className="w-full sm:w-auto flex-1 space-y-2">
                  <Label htmlFor="class-select" className="text-purple-800 dark:text-purple-300">শ্রেণি নির্বাচন করুন</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class-select" className="sm:max-w-xs">
                      <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                      {classNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                  </Select>
              </div>
          </CardContent>
        </CardHeader>
        <CardContent>
          {selectedClass ? (
             filteredBooks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredBooks.map((book) => (
                        <Card key={book.subject} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="aspect-[3/4] relative">
                                    <Image
                                        src={book.coverImageUrl}
                                        alt={book.subject}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={book.imageHint}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="p-2 flex-col items-start space-y-2">
                                <h3 className="font-bold text-sm text-purple-900 dark:text-purple-100">{book.subject}</h3>
                                <Button asChild size="sm" className="w-full">
                                    <Link href={book.downloadUrl} target="_blank">
                                        <Download className="mr-2 h-4 w-4" />
                                        ডাউনলোড
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-48">
                    <p className="text-muted-foreground">এই শ্রেণির জন্য কোনো বই পাওয়া যায়নি।</p>
                </div>
             )
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-48">
              <BookOpen className="h-12 w-12 text-purple-400 mb-4" />
              <p className="text-muted-foreground">বই দেখতে অনুগ্রহ করে একটি শ্রেণি নির্বাচন করুন।</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DataStorePage;
