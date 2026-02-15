'use server';
/**
 * @fileOverview A question generation AI flow.
 *
 * - generateQuestionAction - The server action to call the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateQuestionPaperInputSchema, type GenerateQuestionPaperInput } from '@/lib/data';


const GenerateQuestionPaperOutputSchema = z.object({
    questionPaper: z.string().describe("The generated question paper in Markdown format."),
});

const generateQuestionPaperPrompt = ai.definePrompt(
    {
        name: 'generateQuestionPaperPrompt',
        input: { schema: GenerateQuestionPaperInputSchema },
        output: { schema: GenerateQuestionPaperOutputSchema },
        prompt: `You are an expert Bangladeshi educator. Your task is to create a high-quality question paper, written entirely in Bengali, based on the following specifications.

**Instructions:**
- Class: {{{class}}}
- Subject: {{{subject}}}
- Chapter/Topic: {{{chapter}}}
- Question Type: {{{questionType}}}
- Number of Questions: {{{numberOfQuestions}}}
- Time Limit: {{{timeLimit}}}
- Total Marks: {{{totalMarks}}}

**Output requirements:**
- Your entire response must be the question paper itself, formatted using Markdown.
- Use Bengali language for all text.
- Start with a header containing the Subject, Total Marks, and Time Limit.
- Place the generated Markdown inside the 'questionPaper' field of the JSON output.
- Do NOT include any other text or explanations outside the JSON structure.`,
        config: {
            temperature: 0.8,
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ]
    },
);


// The main flow
const generateQuestionPaperFlow = ai.defineFlow(
  {
    name: 'generateQuestionPaperFlow',
    inputSchema: GenerateQuestionPaperInputSchema,
    outputSchema: GenerateQuestionPaperOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuestionPaperPrompt(input);
    if (!output) {
        throw new Error('AI returned an empty response.');
    }
    return output;
  }
);


// The server action that will be called from the client
export async function generateQuestionAction(values: GenerateQuestionPaperInput): Promise<{ success: boolean; data?: string; error?: string }> {
    // Validate input from the client
    const parsed = GenerateQuestionPaperInputSchema.safeParse(values);
    if (!parsed.success) {
        const errorMessages = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ');
        return { success: false, error: errorMessages || "ফর্মের তথ্য সঠিক নয়।" };
    }
    
    try {
        const result = await generateQuestionPaperFlow(parsed.data);

        if (!result?.questionPaper) {
            return { success: false, error: 'AI একটি বৈধ প্রশ্নপত্র তৈরি করতে পারেনি। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।' };
        }

        return { success: true, data: result.questionPaper };

    } catch (e: any) {
        console.error("Error in generateQuestionAction:", e);
        
        let userMessage = 'প্রশ্ন তৈরি করতে গিয়ে একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        if (e.message?.includes('blocked')) {
            userMessage = 'নিরাপত্তার কারণে আপনার অনুরোধটি ব্লক করা হয়েছে। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করুন।';
        }

        return { success: false, error: userMessage };
    }
}
