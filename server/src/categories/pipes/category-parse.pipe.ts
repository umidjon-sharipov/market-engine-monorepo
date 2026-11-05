import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type {
  CreateCategoryDto,
  CategoryOptionDto,
  CategoryOptionItemDto,
} from '../dto/create-category.dto';

@Injectable()
export class CategoryParsePipe implements PipeTransform {
  transform(value: unknown): CreateCategoryDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException("Category form-data body noto'g'ri.");
    }

    const body = { ...(value as Record<string, unknown>) };
    if (body.hidden !== undefined)
      body.hidden = this.parseBoolean(body.hidden, 'hidden');
    if (body.options !== undefined)
      body.options = this.parseOptions(body.options);
    return body as unknown as CreateCategoryDto;
  }

  private parseOptions(value: unknown): CategoryOptionDto[] {
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        throw new BadRequestException("Options formati noto'g'ri JSON string.");
      }
    }
    if (!Array.isArray(value))
      throw new BadRequestException("Options array bo'lishi kerak.");

    return value.map((option) => {
      if (!option || typeof option !== 'object' || Array.isArray(option)) {
        throw new BadRequestException("Category option formati noto'g'ri.");
      }
      const source = option as Record<string, unknown>;
      if (!Array.isArray(source.items))
        throw new BadRequestException(
          "Category option items array bo'lishi kerak.",
        );
      return {
        title: this.parseTitle(source.title, 'option.title'),
        image: this.parseOptionalString(source.image, 'option.image'),
        hidden: this.parseBoolean(source.hidden, 'option.hidden'),
        items: source.items.map((item) => this.parseItem(item)),
      };
    });
  }

  private parseItem(value: unknown): CategoryOptionItemDto {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException("Category option item formati noto'g'ri.");
    }
    const item = value as Record<string, unknown>;
    const children = item.children ?? [];
    if (!Array.isArray(children)) {
      throw new BadRequestException(
        "Category item children array bo'lishi kerak.",
      );
    }

    return {
      title: this.parseTitle(item.title, 'item.title'),
      image: this.parseOptionalString(item.image, 'item.image'),
      hidden: this.parseBoolean(item.hidden, 'item.hidden'),
      children: children.map((child) => this.parseItem(child)),
    };
  }

  private parseBoolean(value: unknown, field: string): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    throw new BadRequestException(`${field} boolean bo'lishi kerak.`);
  }

  private parseTitle(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} matn bo'lishi kerak.`);
    }
    return value.trim();
  }

  private parseOptionalString(
    value: unknown,
    field: string,
  ): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} matn bo'lishi kerak.`);
    }
    return value;
  }
}
