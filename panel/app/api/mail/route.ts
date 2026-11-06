import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const apiKey = request.headers.get('x-api-key');
    const expected = process.env.INTERNET_API_KEY || process.env.INTERNAL_API_KEY;

    if (!apiKey || !expected || apiKey !== expected) {
        return NextResponse.json(
            { success: false, error: "Ruxsat etilmagan so'rov (Unauthorized)" },
            { status: 401 },
        );
    }

    const body: unknown = await request.json().catch(() => null);
    const email =
        body && typeof body === 'object' && 'email' in body && typeof body.email === 'string'
            ? body.email.trim().toLowerCase()
            : '';
    const otp =
        body && typeof body === 'object' && 'otp' in body && typeof body.otp === 'string'
            ? body.otp.trim()
            : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp)) {
        return NextResponse.json(
            { success: false, error: 'Email yoki OTP formati noto‘g‘ri.' },
            { status: 400 },
        );
    }

    const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
    const user = process.env.MAIL_USER || process.env.SMTP_USER;
    const pass = process.env.MAIL_PASS || process.env.SMTP_PASS;
    if (!host || !user || !pass) {
        return NextResponse.json(
            { success: false, error: 'SMTP sozlamalari to‘liq emas.' },
            { status: 503 },
        );
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587),
            secure: process.env.MAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
            auth: { user, pass },
        });

        await transporter.sendMail({
            from: process.env.MAIL_FROM || `"Internet Market" <${user}>`,
            to: email,
            subject: 'Tasdiqlash kodi (OTP)',
            text: `Sizning tasdiqlash kodingiz: ${otp}. Kod 10 daqiqa amal qiladi.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Xush kelibsiz!</h2>
                  <p>Sizning elektron pochtangizni tasdiqlash uchun maxsus kod:</p>
                  <h1 style="color: #0070f3; letter-spacing: 2px;">${otp}</h1>
                  <p>Bu kod <b>10 daqiqa</b> davomida amal qiladi.</p>
                </div>
            `,
        });

        return NextResponse.json({ success: true, message: 'Xat muvaffaqiyatli yuborildi!' });
    } catch (error) {
        console.error('ERROR nodemailer:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Email yuborilmadi.',
            },
            { status: 500 },
        );
    }
}
