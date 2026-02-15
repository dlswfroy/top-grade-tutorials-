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
    questionPaper: z.string().describe("The generated question paper in well-formatted Bengali markdown."),
});

const prompt = ai.definePrompt({
  name: 'generateQuestionPaperPrompt',
  input: { schema: GenerateQuestionPaperInputSchema },
  output: { schema: GenerateQuestionPaperOutputSchema },
  prompt: `You are an expert Bangladeshi educator. Your task is to create a high-quality question paper, formatted as a single markdown string and written in Bengali.

Follow these specifications for the content of the question paper:
- Class: {{class}}
- Subject: {{subject}}
- Chapter/Topic: {{chapter}}
- Question Type: {{questionType}}
- Number of Questions: {{numberOfQuestions}}
- Time Limit: {{timeLimit}}
- Total Marks: {{totalMarks}}

The markdown string for the question paper must:
1.  Start with a header containing the Subject, Total Marks, and Time Limit.
2.  Contain exactly {{numberOfQuestions}} questions of the specified type.
3.  Distribute the {{totalMarks}} appropriately across the questions.
4.  Use Bengali language and markdown for all formatting (headings, lists, bold text).
5.  Ensure questions are relevant to the Bangladeshi curriculum for the given class.
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const generateQuestionPaperFlow = ai.defineFlow(
  {
    name: 'generateQuestionPaperFlow',
    inputSchema: GenerateQuestionPaperInputSchema,
    outputSchema: GenerateQuestionPaperOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output?.questionPaper) {
        console.error('AI response is missing the questionPaper field.', output);
        throw new Error('AI did not generate valid question paper content.');
    }
    
    return output;
  }
);


export async function generateQuestionAction(values: GenerateQuestionPaperInput) {
    const parsed = GenerateQuestionPaperInputSchema.safeParse(values);
    if (!parsed.success) {
        const errorMessages = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ');
        return { success: false, error: errorMessages || "ফর্মের তথ্য সঠিক নয়।" };
    }
    
    try {
        const result = await generateQuestionPaperFlow(parsed.data);
        return { success: true, data: result.questionPaper };
    } catch (e: any) {
        console.error("Error in generateQuestionAction:", e);
        
        let userMessage = 'প্রশ্ন তৈরি করতে গিয়ে একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        if (e.message?.includes('AI did not generate')) {
            userMessage = 'AI একটি বৈধ প্রশ্নপত্র তৈরি করতে পারেনি। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।';
        } else if (e.message?.includes('blocked')) {
            userMessage = 'নিরাপত্তার কারণে আপনার অনুরোধটি ব্লক করা হয়েছে। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করুন।';
        }

        return { success: false, error: userMessage };
    }
}
