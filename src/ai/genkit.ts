import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// The apiVersion parameter is removed to allow Genkit to use the default stable API.
export const ai = genkit({
  plugins: [googleAI()],
});
