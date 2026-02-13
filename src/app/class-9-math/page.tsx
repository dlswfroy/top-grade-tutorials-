'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/genai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, KeyRound, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const problems = [
    {
        question: '2, 5, 8, 11, ... ধারাটির সাধারণ অন্তর এবং ১০ম পদটি নির্ণয় কর।',
        answer: 'সাধারণ অন্তর 3, দশম পদ 29'
    },
    {
        question: 'একটি গুণোত্তর ধারার প্রথম পদ 3 এবং সাধারণ অনুপাত 2 হলে, ধারাটির প্রথম 5টি পদের সমষ্টি কত?',
        answer: '93'
    },
    {
        question: 'log2 + log4 + log8 + ... ধারাটির প্রথম দশটি পদের সমষ্টি কত?',
        answer: '55 log2'
    },
    {
        question: '1 + 3 + 5 + 7 + ... ধারাটির n পদের সমষ্টি কত?',
        answer: 'n^2'
    }
];

function Class9MathApp() {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [isApiKeySaved, setIsApiKeySaved] = useState(false);

    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');

    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedApiKey = localStorage.getItem('googleAiApiKey-math-app');
        if (savedApiKey) {
            setApiKey(savedApiKey);
            setIsApiKeySaved(true);
            toast({
                title: 'স্বাগতম!',
                description: 'আপনার সেভ করা API Key লোড করা হয়েছে।',
            });
        }
    }, [toast]);
    
    const problem = useMemo(() => problems[currentProblemIndex], [currentProblemIndex]);

    const handleApiKeySave = () => {
        if (apiKeyInput) {
            localStorage.setItem('googleAiApiKey-math-app', apiKeyInput);
            setApiKey(apiKeyInput);
            setIsApiKeySaved(true);
            toast({
                title: 'সফল',
                description: 'API Key সফলভাবে সেভ করা হয়েছে।',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'ত্রুটি',
                description: 'অনুগ্রহ করে একটি API Key দিন।',
            });
        }
    };
    
    const handleNextProblem = () => {
        setCurrentProblemIndex((prevIndex) => (prevIndex + 1) % problems.length);
        setUserAnswer('');
        setFeedback('');
    };

    const getAIFeedback = async () => {
        if (!apiKey) {
            toast({
                variant: 'destructive',
                title: 'API Key প্রয়োজন',
                description: 'AI থেকে সাহায্য পাওয়ার জন্য অনুগ্রহ করে আপনার Google AI API Key দিন।',
            });
            return;
        }
        if (!userAnswer) {
            toast({
                variant: 'destructive',
                title: 'উত্তর দিন',
                description: 'অনুগ্রহ করে প্রথমে আপনার উত্তর দিন।',
            });
            return;
        }

        setIsLoading(true);
        setFeedback('');

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `
            আপনি একজন অত্যন্ত দক্ষ এবং বন্ধুত্বপূর্ণ গণিত শিক্ষক। আপনার দায়িত্ব হলো নবম শ্রেণির একজন শিক্ষার্থীকে "অনুক্রম ও ধারা" অধ্যায়ের গণিত বুঝতে সাহায্য করা।

            শিক্ষার্থীর প্রশ্নটি হলো: "${problem.question}"
            শিক্ষার্থীর দেওয়া উত্তর হলো: "${userAnswer}"

            আপনার কাজ:
            ১. প্রথমে শিক্ষার্থীর উত্তরটি সঠিক কিনা তা যাচাই করুন।
            ২. যদি উত্তর সঠিক হয়, তাহলে তাকে অভিনন্দন জানান এবং সমাধানটি কেন সঠিক, তা সংক্ষেপে সুন্দর করে ব্যাখ্যা করুন।
            ৩. যদি উত্তর ভুল হয়, তাহলে কোনোপ্রকার কঠোর শব্দ ব্যবহার না করে, অত্যন্ত বন্ধুত্বপূর্ণ এবং সহজভাবে ধাপে ধাপে সঠিক সমাধানটি ব্যাখ্যা করুন। কোথায় ভুল হয়েছে, তা ধরিয়ে দিন।
            ৪. আপনার সম্পূর্ণ ব্যাখ্যাটি সহজ বাংলা ভাষায় হতে হবে।
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            setFeedback(text);
        } catch (error: any) {
            console.error(error);
            if (error.message.includes('API key not valid')) {
                 setFeedback('ত্রুটি: আপনার API Key সঠিক নয়। অনুগ্রহ করে [Google AI Studio](https://aistudio.google.com/app/apikey) থেকে একটি সঠিক কী সংগ্রহ করে আবার চেষ্টা করুন।');
            } else {
                setFeedback(`একটি প্রযুক্তিগত ত্রুটি ঘটেছে: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };


    if (!isApiKeySaved) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                 <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound /> API Key প্রয়োজন</CardTitle>
                        <CardDescription>
                            AI শিক্ষকের সাহায্য পেতে, অনুগ্রহ করে আপনার Google AI API Key দিন। আপনি এটি <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a> থেকে বিনামূল্যে পেতে পারেন।
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                         <Input 
                            type="password"
                            placeholder="আপনার API Key..."
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                        />
                        <Button onClick={handleApiKeySave}>সেভ করুন</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold font-headline">নবম শ্রেণির গণিত - অধ্যায় ২</h1>
                <p className="text-muted-foreground">অনুক্রম ও ধারা অনুশীলন করুন AI শিক্ষকের সাথে।</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>প্রশ্ন নম্বর: {currentProblemIndex + 1}</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleNextProblem}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            পরবর্তী প্রশ্ন
                        </Button>
                    </div>
                     <CardDescription className="text-lg pt-2">{problem.question}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <label htmlFor="user-answer" className="font-medium">আপনার উত্তর:</label>
                        <Input 
                            id="user-answer"
                            placeholder="আপনার উত্তর এখানে লিখুন..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <Button onClick={getAIFeedback} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        উত্তর যাচাই করুন
                    </Button>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4">AI শিক্ষক আপনার উত্তরটি দেখছেন...</p>
                </div>
            )}

            {feedback && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <CheckCircle className="text-green-500" />
                            AI শিক্ষকের মন্তব্য
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-4 whitespace-pre-wrap leading-relaxed">
                           {feedback}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function Class9MathPageContainer() {
    return <Class9MathApp />;
}
