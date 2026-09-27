import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const apiKey = request.headers.get('x-api-key');

        if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Ruxsat etilmagan so\'rov (Unauthorized)' },
                { status: 401 }
            );
        }

        const { email, otp } = await request.json();

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Internet Market" <${process.env.MAIL_USER}>`,
            to: email,
            subject: 'Tasdiqlash kodi (OTP)',
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
    } catch (error: any) {
        console.error('ERROR nodemailer:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}