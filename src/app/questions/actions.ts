'use server';

import { generateExamPaper } from '@/ai/flows/generate-exam-paper-flow';
import { z } from 'zod';

const ExamPaperSchema = z.object({
  class: z.string().min(1, 'শ্রেণি আবশ্যক'),
  subject: z.string().min(1, 'বিষয় আবশ্যক'),
  chapter: z.string().min(1, 'অধ্যায় আবশ্যক'),
  questionType: z.enum(['creative', 'mcq'], {
    errorMap: () => ({ message: 'প্রশ্নের ধরণ নির্বাচন করুন' }),
  }),
  numberOfQuestions: z.coerce.number().int().positive('প্রশ্নের সংখ্যা ১ এর বেশি হতে হবে'),
  timeLimit: z.string().min(1, 'সময় আবশ্যক'),
  totalMarks: z.coerce.number().int().positive('পূর্ণমান ১ এর বেশি হতে হবে'),
});

export type FormState = {
  status: 'success' | 'error' | 'idle';
  message: string;
  examPaper?: string;
  errors?: {
    class?: string[];
    subject?: string[];
    chapter?: string[];
    questionType?: string[];
    numberOfQuestions?: string[];
    timeLimit?: string[];
    totalMarks?: string[];
  };
};

export async function handleGenerateExam(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = ExamPaperSchema.safeParse({
    class: formData.get('class'),
    subject: formData.get('subject'),
    chapter: formData.get('chapter'),
    questionType: formData.get('questionType'),
    numberOfQuestions: formData.get('numberOfQuestions'),
    timeLimit: formData.get('timeLimit'),
    totalMarks: formData.get('totalMarks'),
  });

  if (!validatedFields.success) {
    return {
      status: 'error',
      message: 'অনুগ্রহ করে ফর্মের ত্রুটিগুলো সংশোধন করুন।',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generateExamPaper(validatedFields.data);
     if (!result || !result.examPaperText) {
        return { 
            status: 'error',
            message: 'AI একটি খালি প্রশ্নপত্র তৈরি করেছে। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।' 
        };
    }
    return {
      status: 'success',
      message: 'প্রশ্নপত্র সফলভাবে তৈরি হয়েছে!',
      examPaper: result.examPaperText,
    };
  } catch (error: any) {
    console.error(error);
    let errorMessage = 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
    
    if (error.message) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not found') || error.message.includes('authentication')) {
            errorMessage = 'AI সংযোগের জন্য API কী সেট করা নেই অথবা ভুল। অনুগ্রহ করে আপনার .env ফাইলে একটি সঠিক GEMINI_API_KEY যোগ করুন। একটি কী পেতে, এখানে যান: https://aistudio.google.com/app/apikey';
        } else if (error.message.includes('SAFETY')) {
            errorMessage = 'নিরাপত্তাজনিত কারণে AI কন্টেন্ট তৈরি করতে পারেনি। এটি হতে পারে যদি প্রশ্নটি কোনো সংবেদনশীল বিষয় নিয়ে হয়। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।';
        } else if (error.message.includes('429')) {
             errorMessage = 'আপনি খুব অল্প সময়ে অনেকগুলো অনুরোধ করেছেন। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
        } else if (error.message.includes('output is not valid') || error.message.includes('failed to generate a valid question paper')) {
            errorMessage = 'AI একটি অপ্রত্যাশিত ফরম্যাটে উত্তর দিয়েছে। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।';
        }
    }
    
    return {
      status: 'error',
      message: errorMessage,
    };
  }
}
