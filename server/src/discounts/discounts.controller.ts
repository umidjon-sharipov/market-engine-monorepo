import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { DiscountsService } from './discounts.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService, private readonly prisma: PrismaService) {}

  @Get()
  findAll() { return this.discounts.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.discounts.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() body: CreateDiscountDto) { 
    const GuardClass = MarketAccessGuard('discount', req.user.email, ['owner', 'admin'], body.marketId || '', 'create');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

    return this.discounts.create(body); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDiscountDto,
  ) { 
    const discount = await this.prisma.discount.findUnique({
        where: { id },
        select: { marketId: true },
    });

    if (!discount) {
        throw new NotFoundException('Discount topilmadi');
    }
    
    const GuardClass = MarketAccessGuard('discount', req.user.email, ['owner', 'admin'], discount.marketId || '', 'create');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

    return this.discounts.update(id, body); 
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const discount = await this.prisma.discount.findUnique({
        where: { id },
        select: { marketId: true },
    });

    if (!discount) {
        throw new NotFoundException('Discount topilmadi');
    }
    
    const GuardClass = MarketAccessGuard('discount', req.user.email, ['owner', 'admin'], discount.marketId || '', 'delete');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

    return this.discounts.delete(id); 
  }
}
