import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let cachedApp: any;

const allowedOrigins: string[] = process.env.ALLOW_ORIGINS
  ? JSON.parse(process.env.ALLOW_ORIGINS)
  : ['...'];

async function bootstrap() {
  if (!cachedApp) {
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
    );

    nestApp.enableCors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS bo\'yicha ushbu domenga ruxsat berilmagan'));
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders:
        'Content-Type, Authorization, Accept, X-Requested-With, marketid, token, x-custom-header, Range',
    });

    await nestApp.init();
    cachedApp = server;
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '');
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, marketid, token, x-custom-header, Range',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }

  const app = await bootstrap();
  return app(req, res);
}