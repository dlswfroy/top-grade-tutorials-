'use client';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { geminiChatAction } from '@/actions/gemini-chat-action';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserRole } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';

type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

function GeminiChatPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const userRoleRef = useMemoFirebase(() => {
    if (!firestore || !auth.currentUser) return null;
    return doc(firestore, 'user_roles', auth.currentUser.uid);
  }, [firestore, auth.currentUser]);
  const { data: userRole } = useDoc<UserRole>(userRoleRef);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to get the viewport. The component doesn't expose it.
        const viewport = scrollAreaRef.current.children[0] as HTMLDivElement;
        if(viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [history]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);
    setInput('');
    setIsGenerating(true);

    try {
      const result = await geminiChatAction(newHistory);
      if (result.success && result.data) {
        const newModelMessage: ChatMessage = { role: 'model', parts: [{ text: result.data }] };
        setHistory([...newHistory, newModelMessage]);
      } else {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
        setHistory(history); // Revert history on error
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'একটি অপ্রত্যাশিত সমস্যা হয়েছে।' });
      setHistory(history); // Revert history on error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 p-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
      <div>
        <h1 className="text-3xl font-bold font-headline text-rose-800 dark:text-rose-200">Gemini চ্যাট</h1>
        <p className="text-rose-700 dark:text-rose-300 mt-1">সরাসরি Gemini AI-এর সাথে কথা বলুন এবং প্রশ্ন তৈরি করুন।</p>
      </div>

      <Card className="h-[70vh] flex flex-col">
        <CardHeader>
          <CardTitle className="font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2">
            <Sparkles className="text-rose-500" />
            Ask Gemini
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                 <div className="space-y-6 pr-4">
                    {history.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-rose-200 dark:bg-rose-800 text-rose-700 dark:text-rose-200">
                                <Sparkles size={18} />
                            </AvatarFallback>
                        </Avatar>
                        )}
                        <div className={`rounded-lg px-4 py-3 max-w-[80%] ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                            <p className="whitespace-pre-wrap">{msg.parts.map(p => p.text).join('')}</p>
                        </div>
                        {msg.role === 'user' && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={userRole?.imageUrl || undefined} />
                            <AvatarFallback>{userRole?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        )}
                    </div>
                    ))}
                    {isGenerating && (
                        <div className="flex items-start gap-4">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-rose-200 dark:bg-rose-800 text-rose-700 dark:text-rose-200">
                                    <Sparkles size={18} />
                                </AvatarFallback>
                            </Avatar>
                             <div className="rounded-lg px-4 py-3 bg-slate-200 dark:bg-slate-700 flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                            </div>
                        </div>
                    )}
                 </div>
            </ScrollArea>
        </CardContent>
        <CardFooter className="pt-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              id="message"
              placeholder="এখানে আপনার প্রশ্ন লিখুন..."
              className="flex-1"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleSend()}
              disabled={isGenerating}
            />
            <Button onClick={handleSend} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                পাঠান
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default GeminiChatPage;
