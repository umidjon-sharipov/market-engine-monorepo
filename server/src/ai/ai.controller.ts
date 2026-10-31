import {
    Body,
    Controller,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';

/**
 * The request identity is populated by JwtAuthGuard/JWT strategy.
 * Do not accept userId, email, username or permissions from the request body.
 */
export interface AIAuthenticatedRequest extends Request {
    user?: {
        id?: string;
        sub?: string;
        email?: string;
        username?: string;
        userName?: string;
        [key: string]: unknown;
    };
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
    constructor(private readonly aiService: AIService) { }

    /**
     * Agentic chat endpoint.
     * Body: { marketId: UUID, message?: string, messages?: [{role, content}] }
     * The assistant may call the private MCL executor; tool calls are never
     * exposed as client-side fetches and are checked again by the service.
     */
    @Post('chat')
    async chat(
        @Req() req: AIAuthenticatedRequest,
        @Body() body: unknown,
    ) {
        return this.aiService.chat(req.user, req.ip, body);
    }

    /**
     * Direct, authenticated MCL execution endpoint.
     * Body: { marketId: UUID, script: string }
     */
    @Post('execute')
    async execute(
        @Req() req: AIAuthenticatedRequest,
        @Body() body: unknown,
    ) {
        return this.aiService.execute(req.user, req.ip, body);
    }
}
