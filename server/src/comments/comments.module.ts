import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentRepository } from './comment.repository';
import { CommentOwnerGuard } from './comment-owner.guard';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentRepository, CommentOwnerGuard],
})
export class CommentsModule {}