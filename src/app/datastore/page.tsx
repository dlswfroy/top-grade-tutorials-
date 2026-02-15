'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Database } from 'lucide-react';

function DataStorePage() {
  return (
    <div className="space-y-8 p-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-purple-800 dark:text-purple-200">তথ্য ভান্ডার</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-purple-900 dark:text-purple-100">ডাটাবেস ম্যানেজমেন্ট</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-64">
            <Database className="h-16 w-16 text-purple-400 mb-4" />
            <p className="text-muted-foreground">এই সেকশনটি এখনো নির্মাণাধীন। এখানে ডাটাবেস ব্যাকআপ, রিস্টোর এবং অন্যান্য ডাটা ম্যানেজমেন্ট অপশন যোগ করা হবে।</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataStorePage;
