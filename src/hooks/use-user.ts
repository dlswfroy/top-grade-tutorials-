'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Input schema for the question generation flow
const GenerateQuestionPaperInputSchema = z.object({
  class: z.string().nonempty({ message: 'শ্রেণি নির্বাচন করুন।' }),
  subject: z.string().nonempty({ message: 'বিষয় দিন।' }),
  chapter: z.string().nonempty({ message: 'অধ্যায় দিন।' }),
  questionType: z.string().nonempty({ message: 'প্রশ্নের ধরন নির্বাচন করুন।' }),
  numberOfQuestions: z.coerce.number().min(1, { message: 'কমপক্ষে ১টি প্রশ্ন দিন।' }),
  timeLimit: z.string().nonempty({ message: 'সময় নির্ধারণ করুন।' }),
  totalMarks: z.coerce.number().min(1, { message: 'কমপক্ষে ১ নম্বর দিন।' }),
});

export type GenerateQuestionPaperInput = z.infer<typeof GenerateQuestionPaperInputSchema>;

// Output schema expected from the AI model
const GenerateQuestionPaperOutputSchema = z.object({
    questionPaper: z.string().describe('The complete question paper in Markdown format.'),
});

// Define the prompt for the AI model
const generateQuestionPaperPrompt = ai.definePrompt({
    name: 'generateQuestionPaperPrompt',
    input: { schema: GenerateQuestionPaperInputSchema },
    output: { schema: GenerateQuestionPaperOutputSchema },
    prompt: `You are an expert Bangladeshi educator. Your task is to create a high-quality question paper, written entirely in Bengali.

Follow these specifications for the content of the question paper:
- Class: {{{class}}}
- Subject: {{{subject}}}
- Chapter/Topic: {{{chapter}}}
- Question Type: {{{questionType}}}
- Number of Questions: {{{numberOfQuestions}}}
- Time Limit: {{{timeLimit}}}
- Total Marks: {{{totalMarks}}}

Your entire response must be a JSON object that adheres to the output schema. The JSON object should contain a single key "questionPaper", and its value must be a string containing the complete question paper in Markdown format.

The Markdown should:
1. Start with a header containing the Subject, Total Marks, and Time Limit.
2. Contain exactly {{{numberOfQuestions}}} questions of the specified type.
3. Distribute the {{{totalMarks}}} marks appropriately across the questions.
4. Use Bengali language and markdown for all formatting (headings, lists, bold text).
5. Ensure questions are relevant to the Bangladeshi curriculum for the given class.
`,
    config: {
        temperature: 0.7,
         safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ]
    }
});


// Define the flow that uses the prompt
const generateQuestionPaperFlow = ai.defineFlow(
  {
    name: 'generateQuestionPaperFlow',
    inputSchema: GenerateQuestionPaperInputSchema,
    outputSchema: GenerateQuestionPaperOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuestionPaperPrompt(input);
    if (!output) {
      throw new Error('AI did not generate a valid response.');
    }
    return output;
  }
);


// The server action that will be called from the client
export async function generateQuestionAction(values: GenerateQuestionPaperInput) {
    // Validate input from the client
    const parsed = GenerateQuestionPaperInputSchema.safeParse(values);
    if (!parsed.success) {
        const errorMessages = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ');
        return { success: false, error: errorMessages || "ফর্মের তথ্য সঠিক নয়।" };
    }
    
    try {
        // Execute the flow
        const result = await generateQuestionPaperFlow(parsed.data);
        // Return the generated paper content on success
        return { success: true, data: result.questionPaper };

    } catch (e: any) {
        console.error("Error in generateQuestionAction:", e);
        
        let userMessage = 'প্রশ্ন তৈরি করতে গিয়ে একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        if (e.message?.includes('did not generate')) {
            userMessage = 'AI একটি বৈধ প্রশ্নপত্র তৈরি করতে পারেনি। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।';
        } else if (e.message?.includes('blocked')) {
            userMessage = 'নিরাপত্তার কারণে আপনার অনুরোধটি ব্লক করা হয়েছে। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করুন।';
        }

        return { success: false, error: userMessage };
    }
}
