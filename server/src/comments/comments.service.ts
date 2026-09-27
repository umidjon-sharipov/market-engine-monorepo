import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { CommentRepository } from './comment.repository';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly comments: CommentRepository) {}

  findAll() {
    return this.comments.findAll({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, userName: true, image: true } },
        product: { select: { id: true, title: true } },
      },
    });
  }

  findOne(id: string) { return this.comments.findOne({ id }); }

  async create(body: CreateCommentDto, files: Array<Express.Multer.File>, userId: string) {
    return this.comments.create(await this.createInput(body, files, userId));
  }

  async update(id: string, body: UpdateCommentDto, files: Array<Express.Multer.File>) {
    return this.comments.update({ id }, await this.updateInput(body, files));
  }

  delete(id: string) { return this.comments.delete({ id }); }

  private async createInput(
    body: CreateCommentDto,
    files: Array<Express.Multer.File>,
    userId: string,
  ): Promise<Prisma.CommentCreateInput> {
    return {
      comment: body.comment,
      rate: body.rate,
      reply: body.reply,
      images: await this.images(files),
      user: { connect: { id: userId } },
      product: { connect: { id: body.productId } },
    };
  }

  private async updateInput(
    body: UpdateCommentDto,
    files: Array<Express.Multer.File>,
  ): Promise<Prisma.CommentUpdateInput> {
    const data: Prisma.CommentUpdateInput = {};
    if (body.comment !== undefined) data.comment = body.comment;
    if (body.rate !== undefined) data.rate = body.rate;
    if (body.reply !== undefined) data.reply = body.reply;
    if (body.existingImages !== undefined || files.length > 0) {
      data.images = [...(body.existingImages ?? []), ...(await this.images(files))];
    }
    return data;
  }

  private async images(files: Array<Express.Multer.File>) {
    return Promise.all(files.map((file) => uploadImageToImgBB(file)));
  }
}
