import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { getAllowedOrigins } from './common/helpers/allowed-origins.helper';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    const allowedOrigins = getAllowedOrigins();

    app.enableCors({
        origin: (origin, callback) => {
            callback(null, !origin || allowedOrigins.includes(origin));
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders:
            'Content-Type, Authorization, Accept, X-Requested-With, marketid, token, x-custom-header, Range',
    });

    app.use(
        (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            res.setHeader('X-DNS-Prefetch-Control', 'off');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Referrer-Policy', 'no-referrer');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
            next();
        },
    );

    app.useStaticAssets(join(__dirname, '..', 'public'));

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false,
            stopAtFirstError: false,
        }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ limit: '1mb', extended: true }));

    const port = Number(process.env.PORT) || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server is running on: http://localhost:${port}`);
}
bootstrap();
