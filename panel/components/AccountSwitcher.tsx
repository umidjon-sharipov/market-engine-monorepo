'use client'
import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useTokenStore } from '@/app/_store/useTokenStore'
import { useThemeStore } from '@/app/_store/useThemeStore'

export default function AccountSwitcher() {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || 'uz'
    const dark = useThemeStore(state => state.theme) === 'dark'

    const accounts = useTokenStore(state => state.accounts)
    const activeEmail = useTokenStore(state => state.activeEmail)
    const switchAccount = useTokenStore(state => state.switchAccount)

    const activeAccount = accounts.find(acc => acc.email === activeEmail) || accounts[0]

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSwitch = (email: string) => {
        switchAccount(email)
        setIsOpen(false)
        router.refresh()
    }

    if (accounts.length === 0) return null

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 p-2 pr-4 rounded-2xl border transition-all ${
                    dark 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                        : 'bg-black/5 border-black/10 hover:bg-black/10 text-neutral-900'
                } backdrop-blur-md shadow-sm`}
            >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-sky-500/50">
                    <Image 
                        src={activeAccount?.image || 'https://i.ibb.co/nNZrjBSD/user.png'} 
                        alt="Avatar" 
                        fill 
                        className="object-cover" 
                    />
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold leading-tight truncate max-w-[100px]">
                        {activeAccount?.userName || 'User'}
                    </span>
                    <span className="text-[10px] opacity-60 truncate max-w-[100px]">
                        {activeAccount?.email}
                    </span>
                </div>
                <svg className={`w-4 h-4 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className={`absolute left-0 mt-2 w-64 rounded-2xl border p-2 shadow-2xl z-50 backdrop-blur-2xl ${
                    dark 
                        ? 'bg-[#121214]/90 border-white/10 text-white' 
                        : 'bg-white/90 border-black/10 text-neutral-900'
                }`}>
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider opacity-50 border-b border-white/10 mb-1">
                        Boshqa akkauntlar
                    </div>

                    <div className="space-y-1 max-h-60 overflow-y-auto">
                        {accounts.map((acc) => {
                            const isActive = acc.email === activeEmail
                            return (
                                <button
                                    key={acc.email}
                                    onClick={() => handleSwitch(acc.email)}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                                        isActive 
                                            ? 'bg-sky-500/20 text-sky-400 font-medium' 
                                            : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                                            <Image src={acc.image || 'https://i.ibb.co/nNZrjBSD/user.png'} alt="" fill className="object-cover" />
                                        </div>
                                        <div className="flex flex-col text-left truncate">
                                            <span className="text-xs truncate">{acc.userName}</span>
                                            <span className="text-[10px] opacity-50 truncate">{acc.email}</span>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className="border-t border-white/10 mt-2 pt-1">
                        <button
                            onClick={() => {
                                setIsOpen(false)
                                router.push(`/${locale}/auth`)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-sky-400 hover:bg-sky-500/10 transition-all"
                        >
                            <span>+</span> Yangi akkaunt qo'shish
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}