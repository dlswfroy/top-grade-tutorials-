'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Database } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { classNames } from '@/lib/data';

function DataStorePage() {
  const [selectedClass, setSelectedClass] = useState('');

  return (
    <div className="space-y-8 p-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-purple-800 dark:text-purple-200">তথ্য ভান্ডার</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-purple-900 dark:text-purple-100">ডাটাবেস ম্যানেজমেন্ট</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border-2 border-dashed rounded-lg">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-auto flex-1 space-y-2">
                    <Label htmlFor="class-select" className="text-purple-800 dark:text-purple-300">শ্রেণি নির্বাচন করুন</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger id="class-select">
                        <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                        {classNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
          
           <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg mt-6">
            <Database className="h-12 w-12 text-purple-400 mb-4" />
            <p className="text-muted-foreground">এই সেকশনটি এখনো নির্মাণাধীন। এখানে শ্রেণিভিত্তিক ডাটা ম্যানেজমেন্ট অপশন যোগ করা হবে।</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataStorePage;
