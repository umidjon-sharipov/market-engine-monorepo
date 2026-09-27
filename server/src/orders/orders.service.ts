import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.order.findMany();
  }

  async create(createOrderDto: CreateOrderDto) {
    const {
      name,
      product,
      phone,
      address,
      items,
      status = OrderStatus.NEW,
    } = createOrderDto;

    return this.prisma.order.create({
      data: {
        name,
        product,
        phone,
        address,
        items: items ?? [],
        status: status as OrderStatus,
      },
    });
  }
}