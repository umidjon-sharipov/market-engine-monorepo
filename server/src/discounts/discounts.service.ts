import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DiscountRepository } from './discount.repository';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly discounts: DiscountRepository) {}

  findAll() {
    return this.discounts.findAll({
      orderBy: { startDate: 'desc' },
      include: {
        market: { select: { id: true, title: true, logo: true } },
        products: { select: { id: true, title: true, price: true } },
      },
    });
  }

  findOne(id: string) { return this.discounts.findOne({ id }); }

  create(body: CreateDiscountDto) { return this.discounts.create(this.toCreateInput(body)); }

  update(id: string, body: UpdateDiscountDto) {
    return this.discounts.update({ id }, this.toUpdateInput(body));
  }

  delete(id: string) { return this.discounts.delete({ id }); }

  private toCreateInput(body: CreateDiscountDto): Prisma.DiscountCreateInput {
    return {
      title: body.title,
      percentage: body.percentage,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      market: { connect: { id: body.marketId } },
    };
  }

  private toUpdateInput(body: UpdateDiscountDto): Prisma.DiscountUpdateInput {
    return {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.percentage !== undefined && { percentage: body.percentage }),
      ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
      ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      ...(body.marketId !== undefined && { market: { connect: { id: body.marketId } } }),
    };
  }
}
