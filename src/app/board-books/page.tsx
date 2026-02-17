'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classNames } from '@/lib/data';
import { boardBooks } from '@/lib/board-books';
import { Download, BookOpen } from 'lucide-react';
import Image from 'next/image';

function BoardBooksPage() {
  const [selectedClass, setSelectedClass] = useState('ষষ্ঠ');

  const filteredBooks = useMemo(() => {
    return boardBooks.filter(book => book.classGrade === selectedClass);
  }, [selectedClass]);

  return (
    <div className="space-y-8 p-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-violet-800 dark:text-violet-200">বোর্ড বই লাইব্রেরি</h1>
        <p className="text-violet-700 dark:text-violet-300 mt-1">জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) কর্তৃক প্রকাশিত সকল শ্রেণির বোর্ড বই এখানে পাওয়া যাবে।</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <label htmlFor="class-filter" className="font-bold text-violet-900 dark:text-violet-100">শ্রেণি নির্বাচন করুন:</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-filter" className="w-[180px]">
                <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {classNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredBooks.map((book, index) => (
                <Card key={index} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col">
                  <div className="relative w-full aspect-[3/4]">
                    <Image
                      src={book.coverImageUrl}
                      alt={`Cover of ${book.subject}`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                      className="object-cover"
                      data-ai-hint={book.imageHint}
                    />
                  </div>
                  <CardHeader className="p-4 flex-grow">
                    <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200">{book.subject}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <a href={book.downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        ডাউনলোড
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-64">
              <BookOpen className="h-12 w-12 text-violet-400 mb-4" />
              <p className="text-muted-foreground">এই শ্রেণির জন্য কোনো বই পাওয়া যায়নি। অনুগ্রহ করে অন্য একটি শ্রেণি নির্বাচন করুন।</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BoardBooksPage;
