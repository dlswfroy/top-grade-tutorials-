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
      message: 'অনুগ্রহ করে ফর্মের ত্রুটিগুলো সংশোধন করুন।',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generateExamPaper(validatedFields.data);
    return {
      message: 'প্রশ্নপত্র সফলভাবে তৈরি হয়েছে!',
      examPaper: result.examPaperText,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'প্রশ্নপত্র তৈরিতে একটি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    };
  }
}
