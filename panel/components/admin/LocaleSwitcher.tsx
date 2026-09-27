'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useThemeStore } from '@/app/_store/useThemeStore';

const LocaleSwitcher = ({row = false}: {row?: boolean}) => {
    const router = useRouter();
    const pathname = usePathname();
    const dark = useThemeStore(state => state.theme) === 'dark';

    const currentLocale = pathname.split('/')[1] || 'uz';

    const handleLocaleChange = (newLocale: string) => {
        const segments = pathname.split('/');
        segments[1] = newLocale;
        const newPathname = segments.join('/');

        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
        router.push(newPathname);
    };

    const locales = [
        { code: 'uz', label: 'UZ' },
        { code: 'en', label: 'EN' },
        { code: 'ru', label: 'RU' },
    ];

    return (
        <div className={`flex gap-1.5 p-1.5 backdrop-blur-2xl rounded-2xl shadow-xl w-fit border flex-col ${
            dark 
                ? 'bg-neutral-900/40 border-white/10' 
                : 'bg-neutral-200/60 border-neutral-300/50'
        } ${row && 'flex-row'}`}>
            {locales.map((loc) => {
                const isActive = currentLocale === loc.code;
                return (
                    <button
                        key={loc.code}
                        onClick={() => handleLocaleChange(loc.code)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-300 active:scale-95 backdrop-blur-md ${
                            isActive
                                ? dark
                                    ? 'bg-white/20 text-white border border-white/20'
                                    : 'bg-white text-neutral-900 shadow-md shadow-neutral-900/5 border border-neutral-200/80'
                                : dark
                                    ? 'text-neutral-400 hover:text-white hover:bg-white/10 border border-transparent'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/40 border border-transparent'
                        }`}
                    >
                        {loc.label}
                    </button>
                );
            })}
        </div>
    );
};

export default LocaleSwitcher;