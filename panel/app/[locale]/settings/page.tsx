'use client'
import { useApikeyStore } from "../../_store/useApikeyStore";
import Image from "next/image";
import { usePathname } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import GlassCard from "@/components/admin/GlassCard";
import DesignSettings from "@/components/admin/DesignSettings";
import { useThemeStore } from "@/app/_store/useThemeStore";
import { cn } from "@/lib/utils/cn";
import enMessages from "@/messages/en.json";
import ruMessages from "@/messages/ru.json";
import uzMessages from "@/messages/uz.json";

export default function SettingsPage() {
    const apiKey = useApikeyStore(state => state.apikey)
    const setApiKey = useApikeyStore(state => state.setApikey)
    const pathname = usePathname()
    const locale = pathname.split('/')[1]
    const copy = locale === 'ru'
        ? ruMessages.settings
        : locale === 'en'
            ? enMessages.settings
            : uzMessages.settings
    const dark = useThemeStore(state => state.theme) === 'dark'

    return (
        <div className="mx-auto mt-2 w-full max-w-5xl space-y-6 pb-8">
            <PageHeader title={copy.title} subtitle={copy.subtitle} />

            <DesignSettings />

            <GlassCard className="space-y-4 p-4 sm:p-6">
                <div>
                    <h2 className={cn('text-lg font-bold', dark ? 'text-white' : 'text-slate-900')}>{copy.apiKey}</h2>
                    <p className={cn('mt-1 text-sm', dark ? 'text-neutral-400' : 'text-slate-500')}>{copy.apiKeyPlaceholder}</p>
                </div>
                <div className="relative">
                    <input
                        type="password"
                        autoComplete="off"
                        onChange={e => setApiKey(e.target.value)}
                        value={apiKey}
                        className={cn(
                            'min-h-12 w-full rounded-2xl border py-3 pl-11 pr-4 outline-none transition focus:ring-2 focus:ring-[var(--design-accent)]',
                            dark ? 'border-white/10 bg-black/20 text-white' : 'border-slate-200 bg-white/70 text-slate-900',
                        )}
                        placeholder={copy.apiKeyPlaceholder}
                    />
                    <div className="absolute top-0 left-2 h-full flex items-center justify-center">
                        <Image src='/key.png' alt="key" width={20} height={20} />
                    </div>
                </div>
            </GlassCard>

        </div>
    );
}