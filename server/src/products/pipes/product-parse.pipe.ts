import {
    BadRequestException,
    Injectable,
    PipeTransform,
    Optional,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
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
        if (body.isOptionOnly !== undefined) {
            if (body.isOptionOnly !== true && body.isOptionOnly !== false &&
                body.isOptionOnly !== 'true' && body.isOptionOnly !== 'false') {
                throw new BadRequestException('isOptionOnly qiymati noto‘g‘ri.');
            }
            body.isOptionOnly = body.isOptionOnly === true || body.isOptionOnly === 'true';
        }
        if (body.status !== undefined) {
            if (
                typeof body.status !== 'string' ||
                !Object.values(ProductStatus).includes(body.status as ProductStatus)
            ) {
                throw new BadRequestException('Mahsulot statusi noto‘g‘ri.');
            }
        }
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
            return submittedOptions.map((option) => this.normalizeOption(option));
        }
        if (submittedOptions !== undefined) {
            throw new BadRequestException('Product options noto‘g‘ri formatda.');
        }

        const options = new Map<number, ProductOptionDto>();
        for (const [key, value] of Object.entries(body)) {
            const titleMatch = key.match(/^title-(\d+)$/);
            const searchKeysMatch = key.match(/^searchKeys-(\d+)$/);
            const searchEnabledMatch = key.match(/^searchEnabled-(\d+)$/);
            const optionalMatch = key.match(/^optional-(\d+)$/);
            const flatItemProductMatch = key.match(
                /^includeProductId-(\d+)-(\d+)$/,
            );
            const itemProductMatch = key.match(
                /^options\[(\d+)\]\[products\]\[(\d+)\]$/,
            );

            if (titleMatch) {
                this.getOption(options, Number(titleMatch[1])).title =
                    this.readString(value);
            } else if (searchEnabledMatch) {
                this.getOption(options, Number(searchEnabledMatch[1])).searchEnabled =
                    value === true || value === 'true';
            } else if (optionalMatch) {
                this.getOption(options, Number(optionalMatch[1])).isOptional =
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
            } else if (flatItemProductMatch || itemProductMatch) {
                const includeProductId = this.readString(value);
                if (!includeProductId) continue;
                if (!this.isUuid(includeProductId)) {
                    throw new BadRequestException(
                        'Option mahsulot IDsi noto‘g‘ri formatda.',
                    );
                }
                const option = this.getOption(
                    options,
                    Number((flatItemProductMatch ?? itemProductMatch)?.[1]),
                );
                const itemIndex = Number((flatItemProductMatch ?? itemProductMatch)?.[2]);
                option.items[itemIndex] = { includeProductId };
            }
        }

        return [...options.values()]
            .filter((option) => option.title || option.items.length > 0)
            .map((option) => {
                if (!option.title || option.items.length === 0) {
                    throw new BadRequestException(
                        'Har bir option sarlavhasi va kamida bitta mahsuloti bo‘lishi kerak.',
                    );
                }
                return {
                ...option,
                searchKeys: option.searchKeys
                    .map((key) => key.trim().toLocaleLowerCase())
                    .filter(Boolean),
                searchEnabled: option.searchEnabled ?? false,
                };
            });
    }

    private normalizeOption(value: unknown): ProductOptionDto {
        if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new BadRequestException('Product option noto‘g‘ri formatda.');
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
                        throw new BadRequestException(
                            'Product option item noto‘g‘ri formatda.',
                        );
                    const source = item as Record<string, unknown>;
                    const includeProductId = this.readString(
                        source.includeProductId,
                    );
                    if (!this.isUuid(includeProductId)) {
                        throw new BadRequestException(
                            'Option mahsulot IDsi noto‘g‘ri formatda.',
                        );
                    }
                    return { includeProductId };
                })
                .filter(
                    (
                        item,
                    ): item is { includeProductId: string } => item !== null,
                )
            : [];

        if (!title || items.length === 0) {
            throw new BadRequestException(
                'Har bir option sarlavhasi va kamida bitta mahsuloti bo‘lishi kerak.',
            );
        }
        return {
            title,
            searchKeys,
            searchEnabled:
                option.searchEnabled === true || option.searchEnabled === 'true',
            isOptional:
                option.isOptional === true || option.isOptional === 'true',
            items,
        };
    }

    private getOption(options: Map<number, ProductOptionDto>, index: number) {
        if (!options.has(index))
            options.set(index, {
                title: '',
                isOptional: false,
                searchKeys: [],
                searchEnabled: false,
                items: [],
            });
        return options.get(index)!;
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
