import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { CreateCategoryDto, CategoryOptionDto } from '../dto/create-category.dto';

@Injectable()
export class CategoryParsePipe implements PipeTransform {
  transform(value: unknown): CreateCategoryDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Category form-data body noto\'g\'ri.');
    }

    const body = { ...(value as Record<string, unknown>) };
    if (body.options !== undefined) body.options = this.parseOptions(body.options);
    return body as unknown as CreateCategoryDto;
  }

  private parseOptions(value: unknown): CategoryOptionDto[] {
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        throw new BadRequestException('Options formati noto\'g\'ri JSON string.');
      }
    }
    if (!Array.isArray(value)) throw new BadRequestException('Options array bo\'lishi kerak.');

    return value.map((option) => {
      if (!option || typeof option !== 'object' || Array.isArray(option)) {
        throw new BadRequestException('Category option formati noto\'g\'ri.');
      }
      const source = option as Record<string, unknown>;
      const items = Array.isArray(source.items) ? source.items : [];
      return {
        title: String(source.title ?? '').trim(),
        items: items.map((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw new BadRequestException('Category option item formati noto\'g\'ri.');
          }
          const sourceItem = item as Record<string, unknown>;
          return {
            title: String(sourceItem.title ?? '').trim(),
            image: sourceItem.image ? String(sourceItem.image) : undefined,
          };
        }),
      };
    });
  }
}
