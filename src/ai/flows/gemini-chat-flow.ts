'use server';
/**
 * @fileOverview A simple conversational AI flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatHistorySchema = z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() }))
}));

const ChatOutputSchema = z.object({
  text: z.string().describe('The AI\'s response.'),
});

export const geminiChatFlow = ai.defineFlow(
    {
        name: 'geminiChatFlow',
        inputSchema: ChatHistorySchema,
        outputSchema: ChatOutputSchema,
    },
    async (history) => {
        
        const response = await ai.generate({
            model: 'googleai/gemini-pro',
            prompt: {
                history: history,
                messages: [{role: 'user', content: history[history.length - 1].parts}]
            },
            
        });
        
        const generatedText = response.text;

        if (!generatedText) {
            throw new Error("AI did not return any text.");
        }
        
        return { text: generatedText };
    }
);
