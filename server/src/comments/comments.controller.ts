import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentOwnerGuard } from './comment-owner.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  findAll() { return this.comments.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.comments.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  create(
    @Body() body: CreateCommentDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: AuthenticatedRequest,
  ) { return this.comments.create(body, files ?? [], req.user.userId); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, CommentOwnerGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCommentDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) { return this.comments.update(id, body, files ?? []); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CommentOwnerGuard)
  delete(@Param('id', ParseUUIDPipe) id: string) { return this.comments.delete(id); }
}
