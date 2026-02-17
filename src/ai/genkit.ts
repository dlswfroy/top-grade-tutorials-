import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// We explicitly create the plugin instance so it can be exported and referenced elsewhere.
export const googleAiPlugin = googleAI();

// The apiVersion parameter is removed to allow Genkit to use the default stable API.
export const ai = genkit({
  plugins: [googleAiPlugin],
});
