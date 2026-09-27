import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { CreateProductDto, ProductOptionDto } from '../dto/create-product.dto';

@Injectable()
export class ProductParsePipe implements PipeTransform {
  transform(value: unknown): CreateProductDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Product form-data body noto\'g\'ri.');
    }

    const body = { ...(value as Record<string, unknown>) };
    const marketId = this.readString(body.marketId ?? body.market);
    const warehouseId = this.readString(body.warehouseId);
    const title = this.readString(body.title);
    const price = this.readNumber(body.price, 'price');
    const quantity = this.readNumber(body.quantity, 'quantity');

    if (!marketId) {
      throw new BadRequestException('marketId kiritilishi shart.');
    }
    if (!warehouseId) {
      throw new BadRequestException('warehouseId kiritilishi shart.');
    }
    if (!title) {
      throw new BadRequestException('title kiritilishi shart.');
    }

    body.marketId = marketId;
    body.warehouseId = warehouseId;
    body.title = title;
    body.price = price;
    body.quantity = quantity;
    body.description = this.parseJson(body.description, {
      uz: body.descriptionUz ?? '',
      en: body.descriptionEn ?? '',
      ru: body.descriptionRu ?? '',
    });

    for (const key of ['gradient', 'images']) {
      if (body[key] !== undefined) {
        body[key] = this.parseJson(body[key], body[key]);
      }
    }
    body.options = this.parseOptions(body);

    return body as unknown as CreateProductDto;
  }

  private parseOptions(body: Record<string, unknown>): ProductOptionDto[] {
    const submittedOptions = this.parseJson(body.options, undefined);
    if (Array.isArray(submittedOptions)) {
      return submittedOptions
        .map((option) => this.normalizeOption(option))
        .filter((option): option is ProductOptionDto => option !== null);
    }

    const options = new Map<number, ProductOptionDto>();
    for (const [key, value] of Object.entries(body)) {
      const titleMatch = key.match(/^title-(\d+)$/);
      const itemKeyMatch = key.match(/^title-(\d+)-(\d+)$/);
      const itemValueMatch = key.match(/^value-(\d+)-(\d+)$/);

      if (titleMatch) {
        this.getOption(options, Number(titleMatch[1])).title = this.readString(value);
      } else if (itemKeyMatch) {
        this.getItem(options, Number(itemKeyMatch[1]), Number(itemKeyMatch[2])).key =
          this.readString(value);
      } else if (itemValueMatch) {
        this.getItem(options, Number(itemValueMatch[1]), Number(itemValueMatch[2])).value =
          this.readNumber(value, 'option value');
      }
    }

    return [...options.values()].filter((option) => option.title && option.items.length > 0);
  }

  private normalizeOption(value: unknown): ProductOptionDto | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const option = value as Record<string, unknown>;
    const title = this.readString(option.title);
    const items = Array.isArray(option.items)
      ? option.items
          .map((item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
            const source = item as Record<string, unknown>;
            return {
              key: this.readString(source.key),
              value: this.readNumber(source.value ?? 0, 'option value'),
            };
          })
          .filter((item): item is { key: string; value: number } => !!item?.key)
      : [];

    return title ? { title, items } : null;
  }

  private getOption(options: Map<number, ProductOptionDto>, index: number) {
    if (!options.has(index)) options.set(index, { title: '', items: [] });
    return options.get(index)!;
  }

  private getItem(
    options: Map<number, ProductOptionDto>,
    optionIndex: number,
    itemIndex: number,
  ) {
    const option = this.getOption(options, optionIndex);
    if (!option.items[itemIndex]) option.items[itemIndex] = { key: '', value: 0 };
    return option.items[itemIndex];
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private readNumber(value: unknown, fieldName: string): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${fieldName} musbat raqam bo'lishi kerak.`);
    }
    return parsed;
  }

  private parseJson(value: unknown, fallback: unknown): unknown {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('JSON formati noto\'g\'ri.');
    }
  }
}
