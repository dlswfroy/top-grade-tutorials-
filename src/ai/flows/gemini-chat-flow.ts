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

// This is the actual Genkit flow, which is not exported directly to avoid
// breaking Next.js server component rules.
const _geminiChatFlow = ai.defineFlow(
    {
        name: 'geminiChatFlow',
        inputSchema: ChatHistorySchema,
        outputSchema: ChatOutputSchema,
    },
    async (history) => {
        
        // Transform the history from the client to the format expected by `ai.generate`.
        // The key 'parts' needs to be renamed to 'content'.
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            content: msg.parts,
        }));
        
        const response = await ai.generate({
            model: 'googleai/gemini-pro',
            prompt: {
                // Pass the entire formatted history. The last message is treated
                // as the user's current prompt.
                history: formattedHistory,
            },
        });
        
        const generatedText = response.text;

        if (!generatedText) {
            throw new Error("AI did not return any text.");
        }
        
        return { text: generatedText };
    }
);

/**
 * This is the exported async wrapper function.
 * Server Actions should call this function instead of the flow object directly.
 */
export async function geminiChatFlow(history: z.infer<typeof ChatHistorySchema>): Promise<z.infer<typeof ChatOutputSchema>> {
    return _geminiChatFlow(history);
}
