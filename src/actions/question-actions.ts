'use server';

import { generateQuestionFlow } from '@/ai/flows/question-flow';
import { GenerateQuestionPaperInputSchema, type GenerateQuestionPaperInput } from '@/lib/data';

// This is the server action that will be called from the client
export async function generateQuestionAction(values: GenerateQuestionPaperInput): Promise<{ success: boolean; data?: string; error?: string }> {
    // Validate input from the client
    const parsed = GenerateQuestionPaperInputSchema.safeParse(values);
    if (!parsed.success) {
        const errorMessages = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ');
        return { success: false, error: errorMessages || "ফর্মের তথ্য সঠিক নয়।" };
    }

    try {
        const result = await generateQuestionFlow(parsed.data);
        const generatedText = result.questionPaperContent;
        
        if (!generatedText) {
            return { success: false, error: 'AI একটি বৈধ প্রশ্নপত্র তৈরি করতে পারেনি। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।' };
        }

        return { success: true, data: generatedText };
    } catch (e: any) {
        console.error("Error in generateQuestionAction:", e);
        let userMessage = 'প্রশ্ন তৈরি করতে গিয়ে একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        if (e.message?.includes('blocked')) {
            userMessage = 'নিরাপত্তার কারণে আপনার অনুরোধটি ব্লক করা হয়েছে। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করুন।';
        } else if (e.message) {
            userMessage += ` (বিস্তারিত: ${e.message})`;
        }
        return { success: false, error: userMessage };
    }
}
