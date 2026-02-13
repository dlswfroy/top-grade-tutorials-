
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

function QuestionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Google AI (Gemini)</h1>
        <p className="text-muted-foreground">
          সরাসরি Google Gemini ব্যবহার করে প্রশ্নপত্র ও অন্যান্য কন্টেন্ট তৈরি করুন।
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>সরাসরি Gemini ব্যবহার করুন</CardTitle>
          <CardDescription>
            Google AI Studio হল একটি ওয়েব-ভিত্তিক টুল, যার মাধ্যমে আপনি Google-এর শক্তিশালী Gemini মডেল সরাসরি ব্যবহার করতে পারেন। এটি আপনাকে প্রশ্নপত্র তৈরিতে আরও বেশি নিয়ন্ত্রণ এবং স্বাধীনতা দেবে।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            আমরা বুঝতে পারছি যে পূর্বের স্বয়ংক্রিয় জেনারেটরটি আপনার প্রত্যাশা পূরণ করতে পারেনি। আপনার মূল্যবান সময় নষ্ট হওয়ায় আমরা আন্তরিকভাবে ক্ষমাপ্রার্থী। আপনার সুবিধার জন্য, আমরা এখন আপনাকে সরাসরি Google AI Studio-তে প্রবেশ করার ব্যবস্থা করে দিয়েছি, যা Gemini ব্যবহারের একটি সহজ উপায়।
          </p>
          <Link href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">
            <Button>
              Google AI Studio-তে যান <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function QuestionPageContainer() {
  return <QuestionPage />;
}
