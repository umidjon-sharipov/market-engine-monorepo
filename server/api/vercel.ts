import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
    );

    nestApp.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With, marketid, token, x-custom-header',
    });

    await nestApp.init();
    cachedApp = server;
  }
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Accept, X-Requested-With, marketid, token, x-custom-header, Range'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }

  const app = await bootstrap();
  return app(req, res);
}