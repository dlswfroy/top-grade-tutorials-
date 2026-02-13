'use client';

import { useFormStatus } from 'react-dom';
import { handleGenerateExam, type FormState } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classNames } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BrainCircuit, Loader2, Printer, X } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';

const initialState: FormState = {
  status: 'idle',
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          জেনারেট করা হচ্ছে...
        </>
      ) : (
        <>
          <BrainCircuit className="mr-2 h-4 w-4" />
          প্রশ্নপত্র তৈরি করুন
        </>
      )}
    </Button>
  );
}

export function QuestionGenerator() {
  const [state, formAction] = useActionState(handleGenerateExam, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      // formRef.current?.reset();
    }
  }, [state]);

  const handlePrint = () => {
    const printableContent = document.getElementById('exam-paper-content')?.innerHTML;
    if (printableContent) {
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`
            <html>
                <head>
                    <title>প্রশ্নপত্র</title>
                    <style>
                        body { font-family: 'PT Sans', sans-serif; line-height: 1.6; }
                        pre { white-space: pre-wrap; word-wrap: break-word; font-family: 'PT Sans', sans-serif; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>${printableContent}</body>
            </html>
        `);
        printWindow?.document.close();
        printWindow?.print();
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>প্রশ্নপত্রের তথ্য</CardTitle>
          <CardDescription>পরীক্ষার জন্য প্রয়োজনীয় তথ্য দিন।</CardDescription>
        </CardHeader>
        <form ref={formRef} action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class">শ্রেণি</Label>
              <Select name="class">
                <SelectTrigger id="class">
                  <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {classNames.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
              {state.errors?.class && <p className="text-sm text-destructive">{state.errors.class[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">বিষয়</Label>
              <Input id="subject" name="subject" placeholder="যেমন: গণিত, বাংলা" />
              {state.errors?.subject && <p className="text-sm text-destructive">{state.errors.subject[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="chapter">অধ্যায়/বিষয়বস্তু</Label>
              <Input id="chapter" name="chapter" placeholder="যেমন: প্রথম অধ্যায়" />
              {state.errors?.chapter && <p className="text-sm text-destructive">{state.errors.chapter[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label>প্রশ্নের ধরণ</Label>
              <RadioGroup name="questionType" className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="creative" id="creative" />
                  <Label htmlFor="creative">সৃজনশীল</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mcq" id="mcq" />
                  <Label htmlFor="mcq">বহুনির্বাচনী</Label>
                </div>
              </RadioGroup>
              {state.errors?.questionType && <p className="text-sm text-destructive">{state.errors.questionType[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfQuestions">প্রশ্নের সংখ্যা</Label>
                <Input id="numberOfQuestions" name="numberOfQuestions" type="number" placeholder="যেমন: ৫" />
                {state.errors?.numberOfQuestions && <p className="text-sm text-destructive">{state.errors.numberOfQuestions[0]}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalMarks">পূর্ণমান</Label>
                <Input id="totalMarks" name="totalMarks" type="number" placeholder="যেমন: ৫০" />
                {state.errors?.totalMarks && <p className="text-sm text-destructive">{state.errors.totalMarks[0]}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeLimit">সময়</Label>
              <Input id="timeLimit" name="timeLimit" placeholder="যেমন: ২ ঘণ্টা ৩০ মিনিট" />
              {state.errors?.timeLimit && <p className="text-sm text-destructive">{state.errors.timeLimit[0]}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      <div className="lg:col-span-2">
        {state.status !== 'idle' && state.message && (
          <Alert variant={state.status === 'error' ? 'destructive' : 'default'} className="mb-4">
            <AlertTitle>{state.status === 'error' ? 'ত্রুটি' : 'সফল'}</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        {state.examPaper ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>তৈরিকৃত প্রশ্নপত্র</CardTitle>
                <CardDescription>নিচে আপনার তৈরিকৃত প্রশ্নপত্র দেখুন।</CardDescription>
              </div>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                প্রিন্ট/পিডিএফ
              </Button>
            </CardHeader>
            <CardContent id="exam-paper-content">
              <pre className="whitespace-pre-wrap break-words font-body text-sm">{state.examPaper}</pre>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-full">
            <p className="text-muted-foreground">ফর্ম পূরণ করে প্রশ্নপত্র তৈরি করুন।</p>
            <p className="text-muted-foreground text-sm">তৈরিকৃত প্রশ্নপত্র এখানে প্রদর্শিত হবে।</p>
          </div>
        )}
      </div>
    </div>
  );
}
