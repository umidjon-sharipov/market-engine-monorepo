import { useTokenStore } from 'app/store/useTokenStore'
import { useUrlStore } from 'app/store/useUrlStore'

const refreshRequests = new Map<string, Promise<string | null>>()

const refreshAccessToken = (email: string): Promise<string | null> => {
    const existingRequest = refreshRequests.get(email)
    if (existingRequest) return existingRequest

    const request = (async () => {
        const account = useTokenStore.getState().accounts.find(item => item.email === email)
        if (!account?.refreshToken) return null

        const url = useUrlStore.getState().url
        const response = await fetch(`${url}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: account.refreshToken }),
        })

        if (response.status === 401) {
            useTokenStore.getState().removeAccount(email)
            return null
        }

        if (!response.ok) {
            throw new Error(`Token yangilash muvaffaqiyatsiz: ${response.status}`)
        }

        const data: unknown = await response.json()
        if (
            typeof data !== 'object' ||
            data === null ||
            !('accessToken' in data) ||
            typeof data.accessToken !== 'string' ||
            !('refreshToken' in data) ||
            typeof data.refreshToken !== 'string'
        ) {
            throw new Error('Token yangilash javobi noto‘g‘ri formatda')
        }

        useTokenStore.getState().updateAccountTokens(email, data.accessToken, data.refreshToken)
        return data.accessToken
    })()

    refreshRequests.set(email, request)
    void request.finally(() => refreshRequests.delete(email)).catch(() => undefined)
    return request
}

export const fetchWithAuth = async (
    input: RequestInfo | URL,
    init: RequestInit = {},
    accessToken = useTokenStore.getState().token,
): Promise<Response> => {
    const store = useTokenStore.getState()
    const requestEmail = store.activeEmail
    const headers = new Headers(init.headers)
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

    const response = await fetch(input, { ...init, headers })
    if (response.status !== 401 || !requestEmail || store.activeEmail !== requestEmail) {
        return response
    }

    const currentStore = useTokenStore.getState()
    const retryToken = currentStore.token !== accessToken
        ? currentStore.token
        : await refreshAccessToken(requestEmail)

    if (!retryToken || useTokenStore.getState().activeEmail !== requestEmail) {
        return response
    }

    headers.set('Authorization', `Bearer ${retryToken}`)
    return fetch(input, { ...init, headers })
}
