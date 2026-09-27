import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req,
  UploadedFile, UseInterceptors, BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SlidersService } from './sliders.service';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('sliders')
export class SlidersController {
  constructor(private readonly slidersService: SlidersService, private readonly prisma: PrismaService) { }

  @Get()
  async findAll() {
    return await this.slidersService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Req() req: any,
    @Body() body: CreateSliderDto,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
  ) {
    const GuardClass = MarketAccessGuard('slider', req.user.email, ['admin', 'manager'], body.marketId, 'create');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

    if (!file) {
      throw new BadRequestException("Rasm yuklanishi shart!");
    }
    const imageUrl = await uploadImageToImgBB(file);

    return await this.slidersService.create({ ...body, image: imageUrl });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateSliderDto,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
  ) {
    const GuardClass = MarketAccessGuard('slider', req.user.email, ['admin', 'manager'], body.marketId, 'create');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await uploadImageToImgBB(file);
    }

    return await this.slidersService.update(
      id,
      { ...body, ...(imageUrl && { image: imageUrl }) },
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    const slider = await this.prisma.slider.findUnique({
        where: { id },
        select: { marketId: true },
    });

    if (!slider) {
        throw new NotFoundException('Slider topilmadi');
    }

    const GuardClass = MarketAccessGuard('slider', req.user.email, ['admin', 'manager'], slider.marketId, 'delete');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

    return await this.slidersService.delete(id);
  }
}