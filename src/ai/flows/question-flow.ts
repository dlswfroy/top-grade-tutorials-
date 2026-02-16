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

// Define the main flow
export const generateQuestionFlow = ai.defineFlow(
    {
        name: 'generateQuestionFlow',
        inputSchema: GenerateQuestionPaperInputSchema,
        outputSchema: QuestionPaperOutputSchema,
    },
    async (input) => {
        // Manually populate the prompt template instead of using the 'input' field.
        // This is a more direct and less error-prone way of sending the prompt.
        const populatedPrompt = `You are an expert Bangladeshi educator. Your task is to create a high-quality question paper, written entirely in Bengali, based on the following specifications.

**Instructions:**
- Class: ${input.class}
- Subject: ${input.subject}
- Chapter/Topic: ${input.chapter}
- Question Type: ${input.questionType}
- Number of Questions: ${input.numberOfQuestions}
- Time Limit: ${input.timeLimit}
- Total Marks: ${input.totalMarks}

**Output requirements:**
- Your entire response must be ONLY the question paper itself, formatted using Markdown.
- Use Bengali language for all text.
- Start with a header containing the Subject, Total Marks, and Time Limit.
- Do NOT include any other text, greetings, explanations, or JSON formatting. Just return the raw Markdown text.`;
        
        // Request raw text from the AI using the fully populated prompt.
        const response = await ai.generate({
            model: 'googleai/gemini-1.5-pro-latest', // Using a modern, globally available model with the correct identifier.
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
