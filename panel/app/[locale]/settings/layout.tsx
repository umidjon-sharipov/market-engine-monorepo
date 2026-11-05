import "@/app/globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "internet do'kon - Settings",
    description: "Next.js texnologiyasida full-stack e-commerce App => Settings.",
    keywords: ["nextjs", "react", "uzbekistan", "e-commerce", "internet do'kon", "internet do'kon"],

    openGraph: {
        title: "internet do'kon - Settings",
        description: "Next.js texnologiyasida full-stack e-commerce App => Settings.",
        siteName: "internet do'kon",
        locale: "uz_UZ",
        type: "website",
    },

    twitter: {
        card: "summary_large_image",
        title: "internet do'kon - Settings",
        description: "Next.js texnologiyasida full-stack e-commerce App => Settings.",
    },

    robots: {
        index: true,
        follow: true,
    },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return (
        children
    );
}