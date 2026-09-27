import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SliderRepository } from './slider.repository';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';

@Injectable()
export class SlidersService {
  constructor(private readonly sliders: SliderRepository) {}

  findAll() {
    return this.sliders.findAll({
      orderBy: { createdAt: 'desc' },
      include: { market: { select: { id: true, title: true, logo: true } } },
    });
  }

  findOne(id: string) {
    return this.sliders.findOne({ id });
  }

  create(body: CreateSliderDto) {
    return this.sliders.create(this.toCreateInput(body));
  }

  update(id: string, body: UpdateSliderDto) {
    return this.sliders.update({ id }, this.toUpdateInput(body));
  }

  delete(id: string) {
    return this.sliders.delete({ id });
  }

  private toCreateInput(body: CreateSliderDto): Prisma.SliderCreateInput {
    return {
      image: body.image ?? '',
      link: body.link,
      market: { connect: { id: body.marketId } },
    };
  }

  private toUpdateInput(body: UpdateSliderDto): Prisma.SliderUpdateInput {
    return {
      ...(body.image !== undefined && { image: body.image }),
      ...(body.link !== undefined && { link: body.link }),
      ...(body.marketId !== undefined && { market: { connect: { id: body.marketId } } }),
    };
  }
}