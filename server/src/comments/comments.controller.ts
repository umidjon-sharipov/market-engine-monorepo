import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentOwnerGuard } from './comment-owner.guard';
import { CommentsService } from './comments.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  UpdateCommentReplyDto,
} from './dto/create-comment.dto';
import type { Request } from 'express';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { PrismaService } from '../prisma/prisma.service';
import { WORKER_ROLES } from '../workers/worker-permissions';

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly comments: CommentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  findAll(
    @Query('productId', new ParseUUIDPipe({ optional: true })) productId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) { return this.comments.findAll(productId, page, limit); }

  @Get('market/:marketId')
  @UseGuards(JwtAuthGuard)
  async findByMarket(
    @Req() req: AuthenticatedRequest,
    @Param('marketId', ParseUUIDPipe) marketId: string,
    @Query('productId', new ParseUUIDPipe({ optional: true })) productId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    await this.authorize(req, marketId, 'get');
    return this.comments.findByMarket(marketId, page, limit, productId);
  }

  @Get('product/:productId')
  findProductPage(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 30,
  ) { return this.comments.findProductPage(productId, cursor, limit); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.comments.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5, {
    limits: { files: 5, fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.mimetype)) {
        callback(new BadRequestException('Faqat rasm fayllarini yuklash mumkin.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  create(
    @Body() body: CreateCommentDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: AuthenticatedRequest,
  ) { return this.comments.create(body, files ?? [], req.user.userId); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CommentOwnerGuard)
  @UseInterceptors(FilesInterceptor('images', 5, {
    limits: { files: 5, fileSize: 5 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.mimetype)) {
        callback(new BadRequestException('Faqat rasm fayllarini yuklash mumkin.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCommentDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) { return this.comments.update(id, body, files ?? []); }

  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard)
  async updateReply(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCommentReplyDto,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { product: { select: { marketId: true } } },
    });
    if (!comment) throw new NotFoundException('Comment topilmadi.');
    await this.authorize(req, comment.product.marketId, 'update');
    return this.comments.updateReply(id, body.reply);
  }

  @Delete('market/:id')
  @UseGuards(JwtAuthGuard)
  async deleteForMarket(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { product: { select: { marketId: true } } },
    });
    if (!comment) throw new NotFoundException('Comment topilmadi.');
    await this.authorize(req, comment.product.marketId, 'delete');
    return this.comments.delete(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CommentOwnerGuard)
  delete(@Param('id', ParseUUIDPipe) id: string) { return this.comments.delete(id); }

  private async authorize(
    request: AuthenticatedRequest,
    marketId: string,
    action: 'get' | 'update' | 'delete',
  ) {
    const user = request.user as { email?: string } | undefined;
    const Guard = MarketAccessGuard(
      'comment',
      user?.email,
      [...WORKER_ROLES, 'owner'],
      marketId,
      action,
    );
    const allowed = await new Guard(this.prisma).canActivate(
      new ExecutionContextHost([request]),
    );
    if (!allowed) {
      throw new ForbiddenException(`Comment uchun ${action} ruxsati yo‘q.`);
    }
  }
}
