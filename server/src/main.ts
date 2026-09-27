import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as express from 'express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // 1. CUSTOM HARDCODED CORS MIDDLEWARE (Eng birinchi ishlaydi va barcha so'rovlarni o'tkazadi)
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://internet-magazin-panel.vercel.app',
      'https://internet-magazin-uzum.vercel.app',
    ];

    const origin = req.headers.origin as string;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Agarda o'sha origin ro'yxatda bo'lmasa ham lokalda muammo bermasligi uchun default localhost:3000 beramiz
      res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost:3000');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Accept, X-Requested-With',
    );

    // OPTIONS (Preflight) so'rovi kelgan bo'lsa, uni NestJS routelariga yetkazmasdan 200/204 bilan darhol qaytaramiz
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  // 2. Helmet (CORS headerlarini o'chirib yubormasligi uchun moslangan)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    }),
  );

  // 3. Statik fayllar
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Server is running on: http://localhost:${port}`);
}
bootstrap();