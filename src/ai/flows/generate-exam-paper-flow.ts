'use server';
/**
 * @fileOverview A Genkit flow for generating custom exam papers based on user-defined criteria.
 *
 * - generateExamPaper - A function that handles the exam paper generation process.
 * - GenerateExamPaperInput - The input type for the generateExamPaper function.
 * - GenerateExamPaperOutput - The return type for the generateExamPaper function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExamPaperInputSchema = z.object({
  class: z.string().describe('The class for which the exam paper is to be generated (e.g., "ষষ্ঠ", "দশম").'),
  subject: z.string().describe('The subject of the exam (e.g., "গণিত", "বাংলা").'),
  chapter: z.string().describe('The specific chapter or topic for the questions.'),
  questionType: z.enum(['creative', 'mcq']).describe('The type of questions: "creative" (সৃজনশীল) or "mcq" (বহুনির্বাচনী).'),
  numberOfQuestions: z.number().int().positive().describe('The desired number of questions in the exam paper.'),
  timeLimit: z.string().describe('The time limit for the exam (e.g., "৬০ মিনিট", "২ ঘণ্টা").'),
  totalMarks: z.number().int().positive().describe('The total marks for the exam paper.'),
});
export type GenerateExamPaperInput = z.infer<typeof GenerateExamPaperInputSchema>;

const GenerateExamPaperOutputSchema = z.object({
  examPaperText: z.string().describe('The generated exam paper content, including header and questions.'),
});
export type GenerateExamPaperOutput = z.infer<typeof GenerateExamPaperOutputSchema>;

export async function generateExamPaper(input: GenerateExamPaperInput): Promise<GenerateExamPaperOutput> {
  return generateExamPaperFlow(input);
}

// Internal schema for the prompt, extending the main input with a derived value.
const PromptInputSchema = GenerateExamPaperInputSchema.extend({
    questionTypeNameInBengali: z.string().describe('The type of the question in Bengali language (e.g., "সৃজনশীল" or "বহুনির্বাচনী").')
});

const prompt = ai.definePrompt({
  name: 'generateExamPaperPrompt',
  model: 'googleai/gemini-pro',
  input: {schema: PromptInputSchema},
  output: {schema: GenerateExamPaperOutputSchema},
  prompt: `আপনি একজন অভিজ্ঞ শিক্ষক এবং প্রশ্নপত্র প্রস্তুতকারক। আপনাকে একটি পরীক্ষার প্রশ্নপত্র তৈরি করতে হবে।
নিম্নলিখিত তথ্য ব্যবহার করে একটি সম্পূর্ণ প্রশ্নপত্র তৈরি করুন:

শ্রেণি: {{{class}}}
বিষয়: {{{subject}}}
অধ্যায়/বিষয়বস্তু: {{{chapter}}}
প্রশ্নের ধরণ: {{{questionTypeNameInBengali}}}
প্রশ্নের সংখ্যা: {{{numberOfQuestions}}}
সময়: {{{timeLimit}}}
পূর্ণমান: {{{totalMarks}}}

প্রশ্নপত্রের শুরুতেই উপরে উল্লিখিত "শ্রেণি", "বিষয়", "সময়" এবং "পূর্ণমান" তথ্যগুলি পরিষ্কারভাবে উল্লেখ করুন।
তারপর, {{{questionTypeNameInBengali}}} প্রশ্নগুলি ক্রমানুসারে তৈরি করুন।

যদি প্রশ্নের ধরণ "সৃজনশীল" হয়:
প্রতিটি সৃজনশীল প্রশ্ন একটি উদ্দীপক (যদি প্রয়োজন হয়) এবং কমপক্ষে ৩-৪টি উপ-প্রশ্ন (ক, খ, গ, ঘ) নিয়ে গঠিত হবে।
প্রশ্নগুলো {{{chapter}}} অধ্যায় থেকে প্রাসঙ্গিক এবং শিক্ষার্থীবান্ধব হতে হবে।
প্রতিটি প্রশ্নের মান উল্লেখ করুন।

যদি প্রশ্নের ধরণ "বহুনির্বাচনী" হয়:
প্রতিটি বহুনির্বাচনী প্রশ্নের জন্য ৪টি বিকল্প (ক, খ, গ, ঘ) থাকবে, যার মধ্যে শুধুমাত্র একটি সঠিক উত্তর।
সঠিক উত্তর চিহ্নিত করার দরকার নেই।
প্রশ্নগুলো {{{chapter}}} অধ্যায় থেকে প্রাসঙ্গিক এবং শিক্ষার্থীবান্ধব হতে হবে।
প্রতিটি প্রশ্নের মান ১ হবে।

প্রশ্নপত্রটি অত্যন্ত সুসংগঠিত এবং পঠনযোগ্য হতে হবে।`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const generateExamPaperFlow = ai.defineFlow(
  {
    name: 'generateExamPaperFlow',
    inputSchema: GenerateExamPaperInputSchema,
    outputSchema: GenerateExamPaperOutputSchema,
  },
  async input => {
    // Derive the Bengali name for the question type.
    const questionTypeNameInBengali = input.questionType === 'creative' ? 'সৃজনশীল' : 'বহুনির্বাচনী';
    
    // Create the input object for the prompt, including the derived value.
    const promptInput = {
        ...input,
        questionTypeNameInBengali,
    };

    const {output} = await prompt(promptInput);
    
    if (!output) {
        throw new Error('failed to generate a valid question paper');
    }

    return output;
  }
);
