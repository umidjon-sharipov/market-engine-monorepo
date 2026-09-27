import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureRequestDto } from './dto/create-feature-request.dto';

@Injectable()
export class FeatureRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.featureRequest.findMany();
  }

  async create(createFeatureRequestDto: CreateFeatureRequestDto) {
    return this.prisma.featureRequest.create({
      data: createFeatureRequestDto,
    });
  }
}