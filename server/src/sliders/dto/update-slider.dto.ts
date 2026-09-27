import { PartialType } from '@nestjs/mapped-types';
import { CreateSliderDto } from './create-slider.dto';

export class UpdateSliderDto extends PartialType(CreateSliderDto) {}