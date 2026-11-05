import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { CommentRepository } from './comment.repository';
import { CreateCommentDto, UpdateCommentDto } from './dto/create-comment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly comments: CommentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(productId?: string, page = 1, limit = 20) {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(20, Math.max(1, Math.floor(limit)));
    const where = productId ? { productId } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          user: { select: { id: true, userName: true, image: true } },
          product: { select: { id: true, title: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: safePage * safeLimit < total,
    };
  }

  async findProductPage(productId: string, cursor?: string, limit = 30) {
    const safeLimit = Math.min(30, Math.max(1, Math.floor(limit)));
    if (cursor) {
      const cursorComment = await this.prisma.comment.findFirst({
        where: { id: cursor, productId },
        select: { id: true },
      });
      if (!cursorComment) {
        throw new BadRequestException('Sharh sahifalash belgisi yaroqsiz.');
      }
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: { productId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: safeLimit + 1,
        include: {
          user: { select: { id: true, userName: true, image: true } },
        },
      }),
      this.prisma.comment.count({ where: { productId } }),
    ]);
    const hasMore = data.length > safeLimit;
    const pageData = hasMore ? data.slice(0, safeLimit) : data;
    return {
      data: pageData,
      total,
      limit: safeLimit,
      hasMore,
      nextCursor: hasMore ? pageData[pageData.length - 1]?.id ?? null : null,
    };
  }

  async findByMarket(
    marketId: string,
    page = 1,
    limit = 20,
    productId?: string,
  ) {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(20, Math.max(1, Math.floor(limit)));
    const where: Prisma.CommentWhereInput = {
      product: { marketId },
      ...(productId ? { productId } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          user: { select: { id: true, userName: true, image: true } },
          product: { select: { id: true, title: true, marketId: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: safePage * safeLimit < total,
    };
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, userName: true, image: true } },
        product: { select: { id: true, title: true } },
      },
    });
    if (!comment) throw new NotFoundException('Comment topilmadi.');
    return comment;
  }

  async create(body: CreateCommentDto, files: Array<Express.Multer.File>, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: body.productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Comment yoziladigan product topilmadi.');
    const input = await this.createInput(body, files, userId);
    return this.prisma.comment.upsert({
      where: {
        productId_userId: { productId: body.productId, userId },
      },
      create: input,
      update: {
        comment: body.comment,
        rate: body.rate,
        images: input.images,
      },
      include: {
        user: { select: { id: true, userName: true, image: true } },
      },
    });
  }

  async update(id: string, body: UpdateCommentDto, files: Array<Express.Multer.File>) {
    return this.prisma.comment.update({
      where: { id },
      data: await this.updateInput(body, files),
      include: {
        user: { select: { id: true, userName: true, image: true } },
      },
    });
  }

  async updateReply(id: string, reply: string) {
    return this.prisma.comment.update({
      where: { id },
      data: { reply: reply.trim() || null },
      include: {
        user: { select: { id: true, userName: true, image: true } },
        product: { select: { id: true, title: true, marketId: true } },
      },
    });
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
    if (body.existingImages !== undefined || files.length > 0) {
      const existingImages = body.existingImages ?? [];
      if (existingImages.length + files.length > 5) {
        throw new BadRequestException('Bitta sharhga ko‘pi bilan 5 ta rasm qo‘shish mumkin.');
      }
      data.images = [...existingImages, ...(await this.images(files))];
    }
    return data;
  }

  private async images(files: Array<Express.Multer.File>) {
    return Promise.all(files.map((file) => uploadImageToImgBB(file)));
  }
}
