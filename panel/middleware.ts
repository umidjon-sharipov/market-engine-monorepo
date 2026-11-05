import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['uz', 'en', 'ru'] as const;
const defaultLocale = 'uz';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
        const currentLocale = pathname.split('/')[1];

        const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
        
        const response = NextResponse.next();
        
        if (cookieLocale !== currentLocale) {
            response.cookies.set('NEXT_LOCALE', currentLocale, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
            });
        }

        return response;
    }

    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    const locale = cookieLocale && locales.includes(cookieLocale as any) ? cookieLocale : defaultLocale;

    return NextResponse.redirect(
        new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
    );
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};