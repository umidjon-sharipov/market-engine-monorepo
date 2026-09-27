import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { CreateMarketDto, UpdateMarketDto } from './dto/create-market.dto';
import { MarketsService } from './markets.service';

type AuthenticatedRequest = Request & { user: { email: string } };
type UploadedImage = { buffer: Buffer; originalname: string };

@Controller('markets')
export class MarketsController {
  constructor(private readonly markets: MarketsService) {}

  @Get()
  findAll() { return this.markets.findAll(); }

  @Get('get')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: AuthenticatedRequest) { return this.markets.findByUser(req.user.email); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.markets.findOne(id); }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body() body: CreateMarketDto,
    @UploadedFile() file: UploadedImage,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('Logo rasmi majburiy.');
    return this.markets.create({ ...body, logo: await uploadImageToImgBB(file) }, req.user.email);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, MarketAccessGuard)
  @UseInterceptors(FileInterceptor('logo'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMarketDto,
    @UploadedFile() file?: UploadedImage,
  ) {
    return this.markets.update(id, file ? { ...body, logo: await uploadImageToImgBB(file) } : body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, MarketAccessGuard)
  delete(@Param('id', ParseUUIDPipe) id: string) { return this.markets.delete(id); }
}
