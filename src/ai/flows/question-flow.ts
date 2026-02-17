'use server';
/**
 * @fileOverview A question generation AI flow.
 *
 * This file defines the Genkit flow for generating question papers.
 * It is intended to be called from a server action.
 */
import { ai, googleAiPlugin } from '@/ai/genkit';
import { GenerateQuestionPaperInputSchema, type GenerateQuestionPaperInput } from '@/lib/data';
import { z } from 'zod';

// Define the output schema for the flow itself, which is a simple object containing the generated text.
const QuestionPaperOutputSchema = z.object({
  generatedText: z.string().describe('The full question paper content as a single block of Markdown text.'),
});

// Define the main flow. This is not exported directly.
const _generateQuestionFlow = ai.defineFlow(
    {
        name: 'generateQuestionFlow',
        inputSchema: GenerateQuestionPaperInputSchema,
        outputSchema: QuestionPaperOutputSchema,
    },
    async (input) => {
        // This prompt is now entirely in Bengali for maximum clarity for the model.
        const populatedPrompt = `আপনি একজন বিশেষজ্ঞ বাংলাদেশী শিক্ষক। আপনার কাজ হল নিচের স্পেসিফিকেশন অনুযায়ী সম্পূর্ণ বাংলায় একটি উচ্চমানের প্রশ্নপত্র তৈরি করা।

স্পেসিফিকেশন:
- শ্রেণি: ${input.class}
- বিষয়: ${input.subject}
- অধ্যায়/বিষয়: ${input.chapter}
- প্রশ্নের ধরন: ${input.questionType}
- প্রশ্নের সংখ্যা: ${input.numberOfQuestions}
- সময়: ${input.timeLimit}
- পূর্ণমান: ${input.totalMarks}

নির্দেশনা:
- আপনার সম্পূর্ণ উত্তরটি শুধুমাত্র মার্কডাউন ফরম্যাটে লেখা প্রশ্নপত্র হতে হবে।
- সমস্ত লেখা অবশ্যই বাংলা ভাষায় হতে হবে।
- বিষয়ের নাম, পূর্ণমান এবং সময় দিয়ে একটি হেডার দিয়ে শুরু করুন।
- অন্য কোনো লেখা, সম্ভাষণ, ব্যাখ্যা বা JSON ফরম্যাটিং যোগ করবেন না। শুধু মূল মার্কডাউন টেক্সটটি ফেরত দিন।`;
        
        // Using a standard and reliable model, explicitly referenced from the plugin
        const response = await ai.generate({
            model: googleAiPlugin.model('gemini-pro'),
            prompt: populatedPrompt,
        });
        
        const generatedText = response.text;

        if (!generatedText) {
            throw new Error("AI did not return any text.");
        }
        
        // The flow returns an object matching its outputSchema.
        return { generatedText: generatedText };
    }
);

/**
 * This is the exported async wrapper function.
 * Server Actions should call this function instead of the flow object directly.
 */
export async function generateQuestionFlow(input: GenerateQuestionPaperInput): Promise<z.infer<typeof QuestionPaperOutputSchema>> {
    return _generateQuestionFlow(input);
}
