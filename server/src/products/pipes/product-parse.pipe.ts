import {
    BadRequestException,
    Injectable,
    PipeTransform,
    Optional,
} from '@nestjs/common';
import {
    CreateProductDto,
    ProductOptionDto,
    UpdateProductDto,
} from '../dto/create-product.dto';

@Injectable()
export class ProductParsePipe implements PipeTransform {
    constructor(@Optional() private readonly partial = false) { }

    transform(value: unknown): CreateProductDto | UpdateProductDto {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            console.log(value);
            throw new BadRequestException("Product form-data body noto'g'ri.");
        }

        const body = { ...(value as Record<string, unknown>) };
        const marketId = this.readString(body.marketId ?? body.market);
        const title = this.readString(body.title);

        if (!this.partial && !marketId) {
            throw new BadRequestException('marketId kiritilishi shart.');
        }
        if (!this.partial && !title) {
            throw new BadRequestException('title kiritilishi shart.');
        }

        if (marketId) body.marketId = marketId;
        if (title) body.title = title;
        if (body.price !== undefined)
            body.price = this.readNumber(body.price, 'price');
        if (body.uom === undefined && !this.partial) body.uom = 'PCS';
        if (body.searchEnabled !== undefined) {
            body.searchEnabled =
                body.searchEnabled === true || body.searchEnabled === 'true';
        }
        if (body.categoryPath !== undefined) {
            const path = this.readString(body.categoryPath);
            const parts = path.split('|');
            if (parts.length < 3 || parts.some((part) => !this.isUuid(part))) {
                throw new BadRequestException('Kategoriya yo‘li noto‘g‘ri.');
            }
            body.categoryPath = path;
            body.categoryId = parts[0];
            body.categoryItemId = parts[parts.length - 1];
        }
        if (
            body.description !== undefined ||
            body.descriptionUz !== undefined ||
            body.descriptionEn !== undefined ||
            body.descriptionRu !== undefined
        ) {
            body.description = this.parseJson(body.description, {
                uz: body.descriptionUz ?? '',
                en: body.descriptionEn ?? '',
                ru: body.descriptionRu ?? '',
            });
        }

        for (const key of ['gradient', 'images']) {
            if (body[key] !== undefined) {
                body[key] = this.parseJson(body[key], body[key]);
            }
        }
        if (body.options !== undefined || !this.partial) {
            body.options = this.parseOptions(body);
        }

        return this.partial
            ? Object.assign(new UpdateProductDto(), body)
            : Object.assign(new CreateProductDto(), body);
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
            const searchKeysMatch = key.match(/^searchKeys-(\d+)$/);
            const searchEnabledMatch = key.match(/^searchEnabled-(\d+)$/);
            const itemImageMatch = key.match(/^option-image-url-(\d+)-(\d+)$/);

            if (titleMatch) {
                this.getOption(options, Number(titleMatch[1])).title =
                    this.readString(value);
            } else if (searchEnabledMatch) {
                this.getOption(options, Number(searchEnabledMatch[1])).searchEnabled =
                    value === true || value === 'true';
            } else if (searchKeysMatch) {
                const searchKeys = this.parseJson(value, []);
                if (Array.isArray(searchKeys)) {
                    this.getOption(options, Number(searchKeysMatch[1])).searchKeys =
                        searchKeys
                            .filter(
                                (searchKey): searchKey is string =>
                                    typeof searchKey === 'string',
                            )
                            .map((searchKey) => searchKey.trim().toLocaleLowerCase())
                            .filter(Boolean);
                }
            } else if (itemImageMatch) {
                this.getItem(
                    options,
                    Number(itemImageMatch[1]),
                    Number(itemImageMatch[2]),
                ).image = this.readString(value);
            } else if (itemKeyMatch) {
                this.getItem(
                    options,
                    Number(itemKeyMatch[1]),
                    Number(itemKeyMatch[2]),
                ).key = this.readString(value);
            } else if (itemValueMatch) {
                this.getItem(
                    options,
                    Number(itemValueMatch[1]),
                    Number(itemValueMatch[2]),
                ).value = this.readNumber(value, 'option value');
            }
        }

        return [...options.values()]
            .filter((option) => option.title && option.items.length > 0)
            .map((option) => ({
                ...option,
                searchKeys: option.searchKeys
                    .map((key) => key.trim().toLocaleLowerCase())
                    .filter(Boolean),
                searchEnabled: option.searchEnabled ?? false,
            }));
    }

    private normalizeOption(value: unknown): ProductOptionDto | null {
        if (!value || typeof value !== 'object' || Array.isArray(value))
            return null;
        const option = value as Record<string, unknown>;
        const title = this.readString(option.title);
        const rawSearchKeys = this.parseJson(option.searchKeys, []);
        const searchKeys = Array.isArray(rawSearchKeys)
            ? rawSearchKeys
                .filter((key): key is string => typeof key === 'string')
                .map((key) => key.trim().toLocaleLowerCase())
                .filter(Boolean)
            : [];
        const items = Array.isArray(option.items)
            ? option.items
                .map((item) => {
                    if (!item || typeof item !== 'object' || Array.isArray(item))
                        return null;
                    const source = item as Record<string, unknown>;
                    return {
                        key: this.readString(source.key),
                        value: this.readNumber(source.value ?? 0, 'option value'),
                        image: this.readString(source.image) || undefined,
                    };
                })
                .filter(
                    (
                        item,
                    ): item is {
                        key: string;
                        value: number;
                        image: string | undefined;
                    } => !!item?.key,
                )
            : [];

        return title
            ? {
                title,
                searchKeys,
                searchEnabled:
                    option.searchEnabled === true || option.searchEnabled === 'true',
                items,
            }
            : null;
    }

    private getOption(options: Map<number, ProductOptionDto>, index: number) {
        if (!options.has(index))
            options.set(index, {
                title: '',
                searchKeys: [],
                searchEnabled: false,
                items: [],
            });
        return options.get(index)!;
    }

    private getItem(
        options: Map<number, ProductOptionDto>,
        optionIndex: number,
        itemIndex: number,
    ) {
        const option = this.getOption(options, optionIndex);
        if (!option.items[itemIndex])
            option.items[itemIndex] = { key: '', value: 0 };
        return option.items[itemIndex];
    }

    private readString(value: unknown): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private readNumber(value: unknown, fieldName: string): number {
        const parsed = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            throw new BadRequestException(
                `${fieldName} musbat raqam bo'lishi kerak.`,
            );
        }

        return parsed;
    }

    private isUuid(value: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value,
        );
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
            throw new BadRequestException("JSON formati noto'g'ri.");
        }
    }
}
