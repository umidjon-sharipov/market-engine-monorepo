import LayoutWrapper from "../_components/Wrapper";
import "@/app/globals.css";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { NotificationProvider } from "@/components/Notification";

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "uz";

    const ogLocaleMap: Record<string, string> = {
        uz: "uz_UZ",
        en: "en_US",
        ru: "ru_RU",
    };
    const ogLocale = ogLocaleMap[locale] || "uz_UZ";

    return {
        title: "internet do'kon - panel",
        description: "Next.js texnologiyasida full-stack e-commerce App.",
        keywords: ["nextjs", "react", "uzbekistan", "e-commerce", "internet do'kon"],

        openGraph: {
            title: "internet do'kon - panel",
            description: "Next.js texnologiyasida full-stack e-commerce App.",
            siteName: "internet do'kon",
            locale: ogLocale,
            type: "website",
        },

        twitter: {
            card: "summary_large_image",
            title: "internet do'kon - panel",
            description: "Next.js texnologiyasida full-stack e-commerce App.",
        },

        robots: {
            index: true,
            follow: true,
        },
    };
}

export default async function RootLayout({ children, params }: Props) {
    const { locale: paramLocale } = await params;
    
    const cookieStore = await cookies();
    const locale = paramLocale || cookieStore.get("NEXT_LOCALE")?.value || "uz";

    return (
        <html lang={locale}>
            <body>
                <NotificationProvider>
                    <LayoutWrapper>
                        {children}
                    </LayoutWrapper>
                </NotificationProvider>
            </body>
        </html>
    );
}