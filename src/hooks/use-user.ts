'use server';
/**
 * @fileOverview A question generation AI flow.
 *
 * - generateQuestionAction - The server action to call the flow.
 */

import { ai } from '@/ai/genkit';
import { GenerateQuestionPaperInputSchema, type GenerateQuestionPaperInput } from '@/lib/data';

// The server action that will be called from the client
export async function generateQuestionAction(values: GenerateQuestionPaperInput): Promise<{ success: boolean; data?: string; error?: string }> {
    // Validate input from the client
    const parsed = GenerateQuestionPaperInputSchema.safeParse(values);
    if (!parsed.success) {
        const errorMessages = Object.values(parsed.error.flatten().fieldErrors).flat().join(' ');
        return { success: false, error: errorMessages || "ফর্মের তথ্য সঠিক নয়।" };
    }

    const { class: studentClass, subject, chapter, questionType, numberOfQuestions, timeLimit, totalMarks } = parsed.data;

    const prompt = `You are an expert Bangladeshi educator. Your task is to create a high-quality question paper, written entirely in Bengali, based on the following specifications.

**Instructions:**
- Class: ${studentClass}
- Subject: ${subject}
- Chapter/Topic: ${chapter}
- Question Type: ${questionType}
- Number of Questions: ${numberOfQuestions}
- Time Limit: ${timeLimit}
- Total Marks: ${totalMarks}

**Output requirements:**
- Your entire response must be the question paper itself, formatted using Markdown.
- Use Bengali language for all text.
- Start with a header containing the Subject, Total Marks, and Time Limit.
- Do NOT include any other text, greetings, or explanations. Your response should start directly with the question paper.`;

    try {
        const response = await ai.generate({
            model: 'gemini-1.5-flash-preview',
            prompt: prompt,
            config: {
                temperature: 0.7,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            ]
        });

        const generatedText = response.text;

        if (!generatedText) {
            return { success: false, error: 'AI একটি বৈধ প্রশ্নপত্র তৈরি করতে পারেনি। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করে আবার চেষ্টা করুন।' };
        }

        return { success: true, data: generatedText };

    } catch (e: any) {
        console.error("Error in generateQuestionAction:", e);

        let userMessage = 'প্রশ্ন তৈরি করতে গিয়ে একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        if (e.message?.includes('blocked')) {
            userMessage = 'নিরাপত্তার কারণে আপনার অনুরোধটি ব্লক করা হয়েছে। অনুগ্রহ করে আপনার ইনপুট পরিবর্তন করুন।';
        }

        return { success: false, error: userMessage };
    }
}
