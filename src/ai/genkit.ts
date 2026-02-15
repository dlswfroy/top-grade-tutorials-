import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// By removing the explicit apiVersion, we let Genkit use its default, which is more likely to work in this environment.
const googleAiPlugin = googleAI();

export const ai = genkit({
  plugins: [googleAiPlugin],
});
