'use server';

import { geminiChatFlow } from '@/ai/flows/gemini-chat-flow';

// This is the server action that will be called from the client
export async function geminiChatAction(history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<{ success: boolean; data?: string; error?: string }> {

    try {
        const result = await geminiChatFlow(history);
        const generatedText = result.text;
        
        if (!generatedText) {
            return { success: false, error: 'AI একটি বৈধ উত্তর দিতে পারেনি। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।' };
        }

        return { success: true, data: generatedText };
    } catch (e: any) {
        console.error("Error in geminiChatAction:", e);
        let userMessage = 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        if (e.message?.includes('blocked')) {
            userMessage = 'নিরাপত্তার কারণে আপনার অনুরোধটি ব্লক করা হয়েছে। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করুন।';
        }
        return { success: false, error: userMessage };
    }
}
