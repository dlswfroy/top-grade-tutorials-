'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Database, Download, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { classNames } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

function DataStorePage() {
  const [selectedClass, setSelectedClass] = useState('');
  const { toast } = useToast();

  const handleAction = (action: string) => {
    if (!selectedClass) {
      toast({
        variant: 'destructive',
        title: 'ত্রুটি',
        description: 'অনুগ্রহ করে প্রথমে একটি শ্রেণি নির্বাচন করুন।',
      });
      return;
    }
    toast({
      title: 'কার্যক্রম চলমান',
      description: `${selectedClass} শ্রেণির জন্য "${action}" কার্যক্রম শুরু হয়েছে। এই ফিচারটি এখনো নির্মাণাধীন।`,
    });
  };

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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="flex flex-col items-center justify-center p-6">
                 <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">শিক্ষার্থীদের তথ্য</h3>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleAction('শিক্ষার্থী ডাটা ব্যাকআপ')}>
                        <Download className="mr-2 h-4 w-4" />
                        ব্যাকআপ
                    </Button>
                    <Button variant="outline" onClick={() => handleAction('শিক্ষার্থী ডাটা রিস্টোর')}>
                        <Upload className="mr-2 h-4 w-4" />
                        রিস্টোর
                    </Button>
                 </div>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6">
                 <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">বেতনের তথ্য</h3>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleAction('পেমেন্ট ডাটা ব্যাকআপ')}>
                        <Download className="mr-2 h-4 w-4" />
                        ব্যাকআপ
                    </Button>
                     <Button variant="outline" onClick={() => handleAction('পেমেন্ট ডাটা রিস্টোর')}>
                        <Upload className="mr-2 h-4 w-4" />
                        রিস্টোর
                    </Button>
                 </div>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6">
                 <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">হাজিরার তথ্য</h3>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleAction('হাজিরা ডাটা ব্যাকআপ')}>
                        <Download className="mr-2 h-4 w-4" />
                        ব্যাকআপ
                    </Button>
                     <Button variant="outline" onClick={() => handleAction('হাজিরা ডাটা রিস্টোর')}>
                        <Upload className="mr-2 h-4 w-4" />
                        রিস্টোর
                    </Button>
                 </div>
              </Card>
          </div>
           <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg mt-6">
            <Database className="h-12 w-12 text-purple-400 mb-4" />
            <p className="text-muted-foreground">এই সেকশনটি এখনো নির্মাণাধীন। এখানে শ্রেণিভিত্তিক ডাটাবেস ব্যাকআপ এবং রিস্টোর অপশন যোগ করা হবে।</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataStorePage;
