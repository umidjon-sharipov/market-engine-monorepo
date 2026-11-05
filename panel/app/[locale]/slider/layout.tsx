import ProductsWrapper from "../../_components/ProductsWrapper";
import "@/app/globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "internet do'kon - Slider",
    description: "Next.js texnologiyasida full-stack e-commerce App => Slider.",
    keywords: ["nextjs", "react", "uzbekistan", "e-commerce", "internet do'kon", "internet do'kon"],

    openGraph: {
        title: "internet do'kon - Slider",
        description: "Next.js texnologiyasida full-stack e-commerce App => Slider.",
        siteName: "internet do'kon",
        locale: "uz_UZ",
        type: "website",
    },

    twitter: {
        card: "summary_large_image",
        title: "internet do'kon - Slider",
        description: "Next.js texnologiyasida full-stack e-commerce App => Slider.",
    },

    robots: {
        index: true,
        follow: true,
    },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProductsWrapper>
            {children}
        </ProductsWrapper>
    );
}