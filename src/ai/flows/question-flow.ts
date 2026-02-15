'use server';
/**
 * @fileOverview A question generation AI flow.
 *
 * This file defines the Genkit flow for generating question papers.
 * It is intended to be called from a server action.
 */
import { ai } from '@/ai/genkit';
import { GenerateQuestionPaperInputSchema } from '@/lib/data';
import { z } from 'zod';

// Define the output schema for the flow itself, which is a simple object containing the generated text.
const QuestionPaperOutputSchema = z.object({
  generatedText: z.string().describe('The full question paper content as a single block of Markdown text.'),
});

const promptTemplate = `You are an expert Bangladeshi educator. Your task is to create a high-quality question paper, written entirely in Bengali, based on the following specifications.

**Instructions:**
- Class: {{{class}}}
- Subject: {{{subject}}}
- Chapter/Topic: {{{chapter}}}
- Question Type: {{{questionType}}}
- Number of Questions: {{{numberOfQuestions}}}
- Time Limit: {{{timeLimit}}}
- Total Marks: {{{totalMarks}}}

**Output requirements:**
- Your entire response must be ONLY the question paper itself, formatted using Markdown.
- Use Bengali language for all text.
- Start with a header containing the Subject, Total Marks, and Time Limit.
- Do NOT include any other text, greetings, explanations, or JSON formatting. Just return the raw Markdown text.`;

// Define the main flow
export const generateQuestionFlow = ai.defineFlow(
    {
        name: 'generateQuestionFlow',
        inputSchema: GenerateQuestionPaperInputSchema,
        outputSchema: QuestionPaperOutputSchema,
    },
    async (input) => {
        // Request raw text from the AI, which is a simpler and more reliable request.
        const response = await ai.generate({
            model: 'gemini-pro', // Using a standard, widely available model.
            prompt: promptTemplate,
            input: input,
        });
        
        const generatedText = response.text;

        if (!generatedText) {
            throw new Error("AI did not return any text.");
        }
        
        // The flow returns an object matching its outputSchema.
        return { generatedText: generatedText };
    }
);
