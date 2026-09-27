'use client'
import { useApikeyStore } from "../../_store/useApikeyStore";
import Image from "next/image";

export default function SettingsPage() {
    const apiKey = useApikeyStore(state => state.apikey)
    const setApiKey = useApikeyStore(state => state.setApikey)

    return (
        <>
            <div className="space-y-6 mt-14">
                <div className="space-y-1.5">
                    <h1 className="text-4xl font-extrabold tracking-tight dark:text-white text-neutral-900">Settings</h1>
                </div>
                <div className="relative">
                    <input type="text" onChange={e => setApiKey(e.target.value)} value={apiKey} className="rounded-[1rem] bg-sky-200/10 border border-sky-500/40 py-2 px-10 w-full outline-none" placeholder="api keyni yozing..." />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/key.png' alt="key" width={20} height={20} />
                    </div>
                </div>
            </div>
        </>
    );
}