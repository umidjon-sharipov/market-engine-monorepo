import { useApikeyStore } from '@/app/_store/useApikeyStore';
import { getMockData } from './mock-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T = unknown>(
    path: string,
    options?: RequestInit
): Promise<T> {
    const apikey = useApikeyStore.getState().apikey;

    try {
        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                'api-key': apikey,
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json() as Promise<T>;
    } catch {
        return getMockData(path) as T;
    }
}

export async function apiFetchForm<T = unknown>(
    path: string,
    formData: FormData,
    method = 'POST'
): Promise<T> {
    const apikey = useApikeyStore.getState().apikey;

    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            headers: { 'api-key': apikey },
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { error?: string }).error || 'Request failed');
        }
        return res.json() as Promise<T>;
    } catch (error) {
        throw error;
    }
}
