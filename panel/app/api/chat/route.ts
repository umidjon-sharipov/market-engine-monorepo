import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TOTAL_CHARS = 24_000;

function errorResponse(message: string, status: number) {
    return NextResponse.json({ success: false, error: message }, { status });
}

function getBackendUrl() {
    const configuredBase = API_URL;
    if (!configuredBase) {
        throw new Error('NEST_API_URL server environment variable is not configured.');
    }

    const baseUrl = new URL(configuredBase);
    if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
        throw new Error('NEST_API_URL must use HTTP or HTTPS.');
    }

    // This is the existing NestJS AIController endpoint. If your controller
    // prefix changes, override NEST_AI_CHAT_PATH on the Next.js server.
    const configuredPath = `${API_URL}/ai/chat`;
    if (!configuredPath.startsWith('/') || configuredPath.startsWith('//') || configuredPath.includes('..')) {
        throw new Error('NEST_AI_CHAT_PATH must be an absolute path such as /ai/chat.');
    }

    return new URL(configuredPath, baseUrl).toString();
}

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

function validateMessages(value: unknown): ChatMessage[] | null {
    if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
        return null;
    }

    const messages: ChatMessage[] = [];
    let totalChars = 0;

    for (const item of value) {
        if (!item || typeof item !== 'object') return null;
        const candidate = item as Record<string, unknown>;
        if (candidate.role !== 'user' && candidate.role !== 'assistant') return null;
        if (typeof candidate.content !== 'string') return null;

        const content = candidate.content.trim();
        if (!content || content.length > MAX_MESSAGE_CHARS) return null;

        totalChars += content.length;
        if (totalChars > MAX_TOTAL_CHARS) return null;

        messages.push({ role: candidate.role, content });
    }

    if (!messages.some((message) => message.role === 'user')) return null;
    return messages;
}

export async function POST(request: NextRequest) {
    const authorization = request.headers.get('authorization');
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
        return errorResponse('Authorization: Bearer token is required.', 401);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse('Request body must be valid JSON.', 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return errorResponse('Request body must be a JSON object.', 400);
    }

    const input = body as Record<string, unknown>;
    if (typeof input.marketId !== 'string' || !input.marketId.trim() || input.marketId.length > 100) {
        return errorResponse('marketId is required.', 400);
    }

    const messages = validateMessages(input.messages);
    if (!messages) {
        return errorResponse(
            `messages must contain 1-${MAX_MESSAGES} user/assistant messages; each message is limited to ${MAX_MESSAGE_CHARS} characters.`,
            400,
        );
    }

    let backendUrl: string;
    try {
        backendUrl = getBackendUrl();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'NestJS backend configuration is invalid.';
        return errorResponse(message, 500);
    }

    try {
        const upstream = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                Authorization: authorization,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                marketId: input.marketId.trim(),
                messages,
            }),
            cache: 'no-store',
            signal: AbortSignal.timeout(120_000),
        });

        const responseText = await upstream.text();
        let payload: unknown;
        try {
            payload = responseText ? JSON.parse(responseText) : {};
        } catch {
            return errorResponse('NestJS backend returned a non-JSON response.', 502);
        }

        return NextResponse.json(payload, {
            status: upstream.status,
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
            return errorResponse('AI backend timed out. Please try again.', 504);
        }
        return errorResponse('Could not connect to the NestJS AI backend.', 502);
    }
}
