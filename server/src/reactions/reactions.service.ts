import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.reaction.findMany();
  }

  async create(createReactionDto: CreateReactionDto) {
    return this.prisma.reaction.create({
      data: createReactionDto,
    });
  }
}