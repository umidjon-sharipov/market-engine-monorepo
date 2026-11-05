import { Controller, Get, Post, Body } from '@nestjs/common';
import { FeatureRequestsService } from './feature-requests.service';
import { CreateFeatureRequestDto } from './dto/create-feature-request.dto';

@Controller('feature-requests')
export class FeatureRequestsController {
  constructor(private readonly featureRequestsService: FeatureRequestsService) { }

  @Get()
  async findAll() {
    return await this.featureRequestsService.findAll();
  }

  @Post()
  async create(@Body() createFeatureRequestDto: CreateFeatureRequestDto) {
    return await this.featureRequestsService.create(createFeatureRequestDto);
  }
}