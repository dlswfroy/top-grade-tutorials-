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

// Define the schema for the AI's structured output.
const GenerateQuestionPaperOutputSchema = z.object({
    questionPaper: z.string().describe("The generated question paper in well-formatted Bengali markdown."),
});

const prompt = ai.definePrompt({
  name: 'generateQuestionPaperPrompt',
  input: { schema: GenerateQuestionPaperInputSchema },
  output: { schema: GenerateQuestionPaperOutputSchema }, // Force structured JSON output
  prompt: `You are an expert Bangladeshi educator. Your task is to create a high-quality question paper in Bengali, formatted as a markdown string.

Follow these specifications precisely:
- Class: {{class}}
- Subject: {{subject}}
- Chapter/Topic: {{chapter}}
- Question Type: {{questionType}}
- Number of Questions: {{numberOfQuestions}}
- Time Limit: {{timeLimit}}
- Total Marks: {{totalMarks}}

Your generated question paper must:
1.  Start with a header containing the Subject, Total Marks, and Time Limit.
2.  Contain exactly {{numberOfQuestions}} questions of the specified type.
3.  Distribute the {{totalMarks}} appropriately across the questions.
4.  Use Bengali language and markdown for all formatting (headings, lists, bold text).
5.  Ensure questions are relevant to the Bangladeshi curriculum for the given class.
  `,
});

const generateQuestionPaperFlow = ai.defineFlow(
  {
    name: 'generateQuestionPaperFlow',
    inputSchema: GenerateQuestionPaperInputSchema,
    // The flow's output is just the string content of the paper.
    outputSchema: z.string(),
  },
  async (input) => {
    // Calling the prompt now returns a structured output.
    const { output } = await prompt(input);
    const generatedPaper = output?.questionPaper;

    if (!generatedPaper) {
        console.error('AI response did not contain valid question paper content.', output);
        throw new Error('AI did not generate a valid question paper.');
    }
    
    // The flow returns only the markdown string.
    return generatedPaper;
  }
);


export async function generateQuestionAction(values: GenerateQuestionPaperInput) {
    const parsed = GenerateQuestionPaperInputSchema.safeParse(values);
    if (!parsed.success) {
        const errorMessages = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ');
        return { success: false, error: errorMessages || "ফর্মের তথ্য সঠিক নয়।" };
    }
    
    try {
        // The flow now returns the markdown string directly.
        const result = await generateQuestionPaperFlow(parsed.data);
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Error in generateQuestionAction:", e);
        
        let userMessage = 'প্রশ্ন তৈরি করতে গিয়ে একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        if (e.message?.includes('AI did not generate')) {
            userMessage = 'AI একটি বৈধ প্রশ্নপত্র তৈরি করতে পারেনি। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।';
        }

        return { success: false, error: userMessage };
    }
}
