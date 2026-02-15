/**
 * @fileOverview A question generation AI flow.
 *
 * This file defines the Genkit flow for generating question papers.
 * It is intended to be called from a server action.
 */
import { ai } from '@/ai/genkit';
import { GenerateQuestionPaperInputSchema } from '@/lib/data';
import { z } from 'zod';

// Define the output schema for the AI model
const QuestionPaperOutputSchema = z.object({
  questionPaperContent: z.string().describe('The full question paper content, formatted in Markdown, and written entirely in Bengali.'),
});

// Define the prompt for the AI model
const questionGenerationPrompt = ai.definePrompt({
    name: 'questionGenerationPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: GenerateQuestionPaperInputSchema },
    output: { schema: QuestionPaperOutputSchema },
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
- Do NOT include any other text, greetings, or explanations.
- Structure your response to fit the 'questionPaperContent' field of the output schema.`,
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

// Define the main flow
export const generateQuestionFlow = ai.defineFlow(
    {
        name: 'generateQuestionFlow',
        inputSchema: GenerateQuestionPaperInputSchema,
        outputSchema: QuestionPaperOutputSchema,
    },
    async (input) => {
        const { output } = await questionGenerationPrompt(input);
        if (!output) {
            throw new Error("AI did not return a valid output.");
        }
        return output;
    }
);
