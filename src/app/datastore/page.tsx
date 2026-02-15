'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Save } from 'lucide-react';
import { classNames, type QuestionPaper, GenerateQuestionPaperInputSchema, type GenerateQuestionPaperInput } from '@/lib/data';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { generateQuestionAction } from '@/hooks/use-user';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


function QuestionGeneratorPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  
  const form = useForm<GenerateQuestionPaperInput>({
    resolver: zodResolver(GenerateQuestionPaperInputSchema),
    defaultValues: {
      class: '',
      subject: '',
      chapter: '',
      questionType: 'সৃজনশীল',
      numberOfQuestions: 5,
      timeLimit: '২ ঘণ্টা',
      totalMarks: 50,
    }
  });

  const onGenerate = async (data: GenerateQuestionPaperInput) => {
    setIsGenerating(true);
    setGeneratedContent('');
    try {
        const result = await generateQuestionAction(data);
        if (result.success && result.data) {
            setGeneratedContent(result.data);
            toast({ title: 'সফল', description: 'আপনার প্রশ্নপত্র তৈরি হয়েছে।' });
        } else {
            toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'প্রশ্ন তৈরি করতে গিয়ে একটি অপ্রত্যাশিত সমস্যা হয়েছে।' });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'প্রথমে একটি প্রশ্নপত্র তৈরি করুন।' });
        return;
    }
    if (!firestore) return;

    setIsSaving(true);
    try {
        const questionData: Omit<QuestionPaper, 'id'> = {
            ...form.getValues(),
            generatedContent: generatedContent,
            generatedAt: new Date().toISOString(),
        };

        const questionPapersCollection = collection(firestore, 'question_papers');
        await addDoc(questionPapersCollection, questionData);

        toast({ title: 'সফল', description: 'প্রশ্নপত্রটি সফলভাবে সেভ করা হয়েছে।' });
    } catch (error) {
        console.error("Error saving question paper:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'question_papers',
            operation: 'create',
        }));
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <div className="space-y-8 p-8 rounded-xl bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-pink-800 dark:text-pink-200">প্রশ্ন জেনারেটর</h1>
        <p className="text-pink-700 dark:text-pink-300 mt-1">AI-এর সাহায্যে যেকোনো বিষয়ের উপর তাৎক্ষণিকভাবে প্রশ্নপত্র তৈরি করুন।</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-bold text-pink-900 dark:text-pink-100">প্রশ্নপত্রের তথ্য</CardTitle>
              <CardDescription>প্রশ্ন তৈরি করার জন্য নিচের ফর্মটি পূরণ করুন।</CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onGenerate)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>শ্রেণি</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="শ্রেণি নির্বাচন করুন" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>বিষয়</FormLabel>
                        <FormControl>
                          <Input placeholder="যেমন: গণিত" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chapter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>অধ্যায়</FormLabel>
                        <FormControl>
                          <Input placeholder="যেমন: ত্রিকোণমিতি" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="questionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>প্রশ্নের ধরন</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder=" ধরন নির্বাচন করুন" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="সৃজনশীল">সৃজনশীল (Creative)</SelectItem>
                            <SelectItem value="বহুনির্বাচনী">বহুনির্বাচনী (MCQ)</SelectItem>
                            <SelectItem value="সংক্ষিপ্ত প্রশ্ন">সংক্ষিপ্ত প্রশ্ন (Short Answer)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="numberOfQuestions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>প্রশ্ন সংখ্যা</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="totalMarks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>পূর্ণমান</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>

                   <FormField
                    control={form.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>সময়</FormLabel>
                        <FormControl>
                          <Input placeholder="যেমন: ২ ঘণ্টা ৩০ মিনিট" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'প্রশ্ন তৈরি হচ্ছে...' : 'প্রশ্ন তৈরি করুন'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-row justify-between items-center">
                <CardTitle className="font-bold text-pink-900 dark:text-pink-100">তৈরি হওয়া প্রশ্নপত্র</CardTitle>
                <Button onClick={handleSave} disabled={isSaving || !generatedContent}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'সেভ হচ্ছে...' : 'প্রশ্ন সেভ করুন'}
                </Button>
            </CardHeader>
            <CardContent className="flex-grow">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-12 border-2 border-dashed rounded-lg">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">আপনার প্রশ্নপত্র তৈরি হচ্ছে... <br /> এটি কয়েক মুহূর্ত সময় নিতে পারে।</p>
                </div>
              ) : generatedContent ? (
                <Textarea
                  className="w-full h-full min-h-[400px] bg-white dark:bg-background whitespace-pre-wrap font-mono leading-relaxed"
                  readOnly
                  value={generatedContent}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg h-full">
                  <Wand2 className="h-12 w-12 text-pink-400 mb-4" />
                  <p className="text-muted-foreground">প্রশ্নপত্র তৈরি করতে বাম পাশের ফর্মটি পূরণ করে "প্রশ্ন তৈরি করুন" বাটনে ক্লিক করুন।</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default QuestionGeneratorPage;
