'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateQuestionPaperInputSchema = z.object({
  class: z.string({ required_error: 'শ্রেণি আবশ্যক' }).nonempty('শ্রেণি আবশ্যক'),
  subject: z.string({ required_error: 'বিষয় আবশ্যক' }).nonempty('বিষয় আবশ্যক'),
  chapter: z.string({ required_error: 'অধ্যায় আবশ্যক' }).nonempty('অধ্যায় আবশ্যক'),
  questionType: z.string({ required_error: 'প্রশ্নের ধরন আবশ্যক' }).nonempty('প্রশ্নের ধরন আবশ্যক'),
  numberOfQuestions: z.coerce.number().int().positive('প্রশ্ন সংখ্যা অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
  timeLimit: z.string({ required_error: 'সময় আবশ্যক' }).nonempty('সময় আবশ্যক'),
  totalMarks: z.coerce.number().int().positive('পূর্ণমান অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
});
export type GenerateQuestionPaperInput = z.infer<typeof GenerateQuestionPaperInputSchema>;

const GenerateQuestionPaperOutputSchema = z.object({
  generatedContent: z.string(),
});

const prompt = ai.definePrompt({
  name: 'generateQuestionPaperPrompt',
  input: { schema: GenerateQuestionPaperInputSchema },
  output: { schema: GenerateQuestionPaperOutputSchema },
  prompt: `You are an expert Bangladeshi educator. Your task is to create a high-quality question paper based on the following specifications. The output must be in Bengali.

  Class: {{class}}
  Subject: {{subject}}
  Chapter/Topic: {{chapter}}
  Question Type: {{questionType}}
  Number of Questions: {{numberOfQuestions}}
  Time Limit: {{timeLimit}}
  Total Marks: {{totalMarks}}
  
  Instructions:
  1.  Generate exactly {{numberOfQuestions}} questions of the type "{{questionType}}".
  2.  The total marks for the paper must be {{totalMarks}}. Distribute the marks appropriately among the questions.
  3.  The questions must be relevant to the specified class, subject, and chapter for the Bangladeshi curriculum.
  4.  The entire output, including headings and questions, must be in well-formatted Bengali as a single block of text.
  5.  Start with a header that includes the subject, total marks, and time limit.
  
  Generate the question paper and provide it in the 'generatedContent' field.
  `,
});

const generateQuestionPaperFlow = ai.defineFlow(
  {
    name: 'generateQuestionPaperFlow',
    inputSchema: GenerateQuestionPaperInputSchema,
    outputSchema: GenerateQuestionPaperOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function generateQuestionAction(values: GenerateQuestionPaperInput) {
    const parsed = GenerateQuestionPaperInputSchema.safeParse(values);
    if (!parsed.success) {
        // Aggregate errors
        const errorMessages = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ');
        return { success: false, error: errorMessages || "ফর্মের তথ্য সঠিক নয়।" };
    }
    
    try {
        const result = await generateQuestionPaperFlow(parsed.data);
        return { success: true, data: result.generatedContent };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: 'প্রশ্ন তৈরি করতে গিয়ে একটি সমস্যা হয়েছে।' };
    }
}
