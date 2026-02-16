'use server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Force the use of the stable 'v1' API to prevent 'v1beta' errors.
export const ai = genkit({
  plugins: [googleAI({ apiVersion: 'v1' })],
});
