import { StylesProvider } from './styles-provider'
import './globals.css'
import { Provider } from 'app/provider'
import HeaderC from 'app/features/app/Header'
import CursorC from 'app/components/UI/Cursor'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: "internet do'kon - O'zbekistondagi milliy marketplex",
    description: "Next.js texnologiyasida full-stack e-commerce App.",
    keywords: ["nextjs", "react", "uzbekistan", "e-commerce", "internet do'kon", "internet do'kon"],
    icons: {
        icon: "/icon.png"
    },
    verification: {
        google: "vrW7yAymIBr4qV_SfSVrKjUcniOv6ICgCVgTwVE8GBQ",
    },

    openGraph: {
        title: "internet do'kon - O'zbekistondagi milliy marketplex",
        description: "Next.js texnologiyasida full-stack e-commerce App.",
        siteName: "internet do'kon",
        locale: "uz_UZ",
        type: "website",
    },

    twitter: {
        card: "summary_large_image",
        title: "internet do'kon - O'zbekistondagi milliy marketplex",
        description: "Next.js texnologiyasida full-stack e-commerce App.",
    },

    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" style={{ overflowX: 'hidden' }}>
            <body>
                <StylesProvider>
                    <HeaderC />
                    {children}
                    <CursorC />
                </StylesProvider>
            </body>
        </html>
    )
}