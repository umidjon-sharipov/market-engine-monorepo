'use client'

import { useEffect, useRef, useState } from 'react'

type TelegramUser = {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: number
    hash: string
}

declare global {
    interface Window {
        onTelegramAuth?: (user: TelegramUser) => void
    }
}

export function TelegramLoginWidget({
    apiUrl,
    onSuccess,
    onError,
}: {
    apiUrl: string
    onSuccess: (session: unknown) => void
    onError: (message: string) => void
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const onSuccessRef = useRef(onSuccess)
    const onErrorRef = useRef(onError)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        onSuccessRef.current = onSuccess
        onErrorRef.current = onError
    }, [onError, onSuccess])

    useEffect(() => {
        let disposed = false
        let script: HTMLScriptElement | undefined

        const initialize = async () => {
            try {
                const response = await fetch(`${apiUrl}/auth/oauth/telegram/config`)
                const config = await response.json()
                if (!response.ok) {
                    throw new Error(config.message || 'Telegram sozlamasini olib bo‘lmadi.')
                }
                if (!config.configured || !config.username) {
                    if (!disposed) onErrorRef.current('Telegram login hozircha sozlanmagan.')
                    return
                }
                const container = containerRef.current
                if (!container || disposed) return

                window.onTelegramAuth = (user) => {
                    if (disposed) return
                    setLoading(true)
                    void fetch(`${apiUrl}/auth/oauth/telegram`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(user),
                    })
                        .then(async (res) => {
                            const session = await res.json()
                            if (!res.ok) {
                                throw new Error(session.message || 'Telegram orqali kirib bo‘lmadi.')
                            }
                            onSuccessRef.current(session)
                        })
                        .catch((error: unknown) => {
                            onErrorRef.current(error instanceof Error ? error.message : 'Telegram orqali kirib bo‘lmadi.')
                        })
                        .finally(() => setLoading(false))
                }

                script = document.createElement('script')
                script.async = true
                script.src = 'https://telegram.org/js/telegram-widget.js?22'
                script.dataset.telegramLogin = config.username
                script.dataset.size = 'large'
                script.dataset.userpic = 'false'
                script.dataset.onauth = 'onTelegramAuth(user)'
                container.replaceChildren(script)
            } catch (error) {
                if (!disposed) {
                    onErrorRef.current(error instanceof Error ? error.message : 'Telegram widget yuklanmadi.')
                }
            }
        }

        void initialize()
        return () => {
            disposed = true
            script?.remove()
            if (window.onTelegramAuth) delete window.onTelegramAuth
        }
    }, [apiUrl])

    return (
        <div className="flex min-h-11 items-center justify-center">
            <div ref={containerRef} />
            {loading ? <span className="ml-2 text-xs opacity-70">Telegram orqali kiritilmoqda…</span> : null}
        </div>
    )
}
