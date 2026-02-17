'use server';
/**
 * @fileOverview A simple conversational AI flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { type Message } from 'genkit';

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
        
        // Transform the history from the client to the Genkit Message[] format.
        const messages: Message[] = history.map(msg => ({
            role: msg.role,
            content: msg.parts,
        }));
        
        // The last message in the history is the user's current prompt.
        // We separate it from the rest of the history.
        const lastMessage = messages.pop();

        if (!lastMessage) {
            throw new Error('Chat history cannot be empty.');
        }

        // The 'generate' function takes the history and the current prompt separately.
        const response = await ai.generate({
            model: 'googleai/gemini-pro',
            history: messages,
            prompt: lastMessage.content,
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
