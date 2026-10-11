import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

export default async function ChatPage() {
    const cookieStore = await cookies();
    const historyCookie = cookieStore.get('chat_messages');
    const messages = historyCookie ? JSON.parse(historyCookie.value) : [];

    async function sendMessage(formData: FormData) {
        'use server';

        const prompt = formData.get('prompt') as string;
        if (!prompt || !prompt.trim()) return;

        const cookieStore = await cookies();
        const historyCookie = cookieStore.get('chat_messages');
        let currentMessages = historyCookie ? JSON.parse(historyCookie.value) : [];

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: prompt,
        };

        const updatedMessages = [...currentMessages, userMessage];

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b', // Yoki 'llama3-8b-8192'
                    messages: updatedMessages.map((m: any) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Groq API Error:', data);
                throw new Error(data.error?.message || 'Groq API xatosi');
            }

            const replyText = data.choices[0]?.message?.content || 'Javob kelmadi';

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: replyText,
            };

            const finalMessages = [...updatedMessages, assistantMessage];

            cookieStore.set('chat_messages', JSON.stringify(finalMessages));

            // Dinamik yo'lda joylashgani uchun 'page' revalidate qilish kerak
            revalidatePath('/[locale]/[market]/ai', 'page');

        } catch (error: any) {
            console.error('Xatolik:', error.message);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-w-3xl mx-auto p-4">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
                { messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                        AI Marketplace yordamchisiga xabar yozing...
                    </div>
                ) : (
                    messages.map((m: any) => (
                        <div
                            key={ m.id }
                            className={ `flex my-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'
                                }` }
                        >
                            <Card
                                className={ `max-w-[80%] ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground'
                                    }` }
                            >
                                <CardContent className="p-3">
                                    <ReactMarkdown>{ m.content }</ReactMarkdown>
                                </CardContent>
                            </Card>
                        </div>
                    ))
                ) }
            </div>

            <form action={ sendMessage } className="flex gap-2">
                <Input
                    name="prompt"
                    placeholder="AI ga savol yoki prompt yozing..."
                    className="flex-1"
                    autoComplete="off"
                    required
                />
                <Button type="submit">Yuborish</Button>
            </form>
        </div>
    );
}