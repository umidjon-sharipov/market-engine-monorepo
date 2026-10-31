import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';

/**
 * AI module.
 * PrismaModule is imported rather than constructing another PrismaClient,
 * so the module shares the application's existing database connection.
 */
@Module({
    imports: [PrismaModule],
    controllers: [AIController],
    providers: [AIService],
    exports: [AIService],
})
export class AIModule { }
