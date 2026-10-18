import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { PrismaService } from '../prisma/prisma.service';
import { ProductRepository } from './product.repository';
import {
    CreateProductDto,
    ProductOptionDto,
    UpdateProductDto,
} from './dto/create-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        private readonly products: ProductRepository,
        private readonly prisma: PrismaService,
    ) { }

    findAll(search?: string, marketId?: string) {
        const terms = search
            ?.trim()
            .toLocaleLowerCase()
            .split(/\s+/)
            .filter(Boolean);
        return this.products.findAll({
            where: {
                ...(marketId ? { marketId } : {}),
                ...(terms?.length
                    ? {
                        OR: [
                            { title: { contains: search, mode: 'insensitive' } },
                            {
                                options: {
                                    some: {
                                        searchEnabled: true,
                                        searchKeys: { hasSome: terms },
                                    },
                                },
                            },
                        ],
                    }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                options: { include: { items: true } },
            },
        });
    }

    async search(
        marketId: string,
        search: string,
        page = 1,
        limit = 20,
    ) {
        const safePage = Math.max(1, Math.floor(page));
        const safeLimit = Math.min(20, Math.max(1, Math.floor(limit)));
        const terms = search
            .trim()
            .toLocaleLowerCase()
            .split(/\s+/)
            .filter(Boolean);
        const where: Prisma.ProductWhereInput = {
            marketId,
            ...(terms.length
                ? {
                    OR: [
                        { title: { contains: search.trim(), mode: 'insensitive' } },
                        {
                            options: {
                                some: {
                                    searchEnabled: true,
                                    searchKeys: { hasSome: terms },
                                },
                            },
                        },
                    ],
                }
                : {}),
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                orderBy: [{ title: 'asc' }, { id: 'asc' }],
                skip: (safePage - 1) * safeLimit,
                take: safeLimit,
                select: { id: true, title: true, marketId: true, uom: true },
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            data,
            page: safePage,
            limit: safeLimit,
            total,
            hasMore: safePage * safeLimit < total,
        };
    }

    async findData(userName: string) {
        const user = await this.prisma.user.findFirst({
            where: { userName: userName },
            select: { id: true },
        });

        if (!user) {
            throw new BadRequestException("Foydalanuvchi topilmadi");
        }

        const followings = await this.prisma.following.findMany({
            where: {
                userId: user.id,
            },
        });

        const activeMarketIds = followings
            .filter(item => {
                const isFollowing = Array.isArray(item.follow) && item.follow.length % 2 !== 0;

                const isBlocked = Array.isArray(item.block) && item.block.length % 2 !== 0;

                return isFollowing && !isBlocked;
            })
            .map(item => item.marketId);

        if (activeMarketIds.length === 0) {
            throw new BadRequestException("Siz birorta aktiv marketga obuna bo'lmagansiz");
        }

        return this.prisma.product.findMany({
            where: {
                marketId: {
                    in: activeMarketIds,
                },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                market: {
                    select: { id: true, title: true, logo: true }
                }
            },
        });
    }

    async createProduct(
        body: CreateProductDto,
        files: Array<Express.Multer.File>,
    ) {
        await this.validateCategorySelection(
            body.categoryPath,
            body.marketId,
        );
        return this.products.create(await this.toCreateInput(body, files));
    }

    async updateProduct(
        id: string,
        body: UpdateProductDto,
        files: Array<Express.Multer.File>,
    ) {
        const current = await this.prisma.product.findUnique({
            where: { id },
            select: { marketId: true },
        });
        if (!current) throw new NotFoundException('Product topilmadi.');

        const marketId = body.marketId ?? current.marketId;

        if (body.categoryPath !== undefined) {
            await this.validateCategorySelection(body.categoryPath, marketId);
        }

        const data: Prisma.ProductUpdateInput = {};
        if (body.title !== undefined) data.title = body.title;
        if (body.description !== undefined)
            data.description = this.jsonValue(body.description);
        if (body.price !== undefined) data.price = body.price;
        if (body.uom !== undefined) data.uom = body.uom;
        if (body.gradient !== undefined)
            data.gradient = this.jsonValue(body.gradient);
        if (body.marketId !== undefined)
            data.market = { connect: { id: body.marketId } };

        if (body.categoryPath !== undefined) {
            data.categoryPath = body.categoryPath || null;
        }
        if (
            body.images !== undefined ||
            files.some((file) => file.fieldname.startsWith('image-'))
        ) {
            const uploaded = await this.uploadFiles(files);
            const imageUrls = [
                ...(body.images ?? []),
                ...this.imagesForPrefix(uploaded, 'image-'),
            ];
            data.images = this.jsonValue(imageUrls);
        }
        if (body.options !== undefined) {
            const uploaded = await this.uploadFiles(files);
            data.options = {
                deleteMany: {},
                create: this.toOptionInputs(body.options, uploaded),
            };
        }
        return this.products.update({ id }, data);
    }

    private async toCreateInput(
        body: CreateProductDto,
        files: Array<Express.Multer.File>,
    ): Promise<Prisma.ProductCreateInput> {
        const uploaded = await this.uploadFiles(files);
        const imageUrls = [
            ...(body.images ?? []),
            ...this.imagesForPrefix(uploaded, 'image-'),
        ];

        return {
            title: body.title,
            price: body.price,
            uom: body.uom,
            quantity: 0,
            description: this.jsonValue(body.description),
            gradient: this.jsonValue(body.gradient ?? []),
            images: imageUrls,
            market: { connect: { id: body.marketId } },
            ...(body.categoryPath && {
                categoryPath: body.categoryPath,
            }),
            options: {
                create: this.toOptionInputs(body.options, uploaded),
            },
        };
    }

    private async uploadFiles(
        files: Array<Express.Multer.File>,
    ): Promise<Map<string, string>> {
        const uploads = await Promise.all(
            files
                .filter(
                    (file) =>
                        file.fieldname.startsWith('image-') ||
                        file.fieldname.startsWith('option-image-'),
                )
                .map(async (file) => [
                    file.fieldname,
                    await uploadImageToImgBB(file),
                ] as const),
        );
        return new Map(uploads);
    }

    private imagesForPrefix(
        uploaded: Map<string, string>,
        prefix: string,
    ): string[] {
        return [...uploaded.entries()]
            .filter(([field]) => field.startsWith(prefix))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([, url]) => url);
    }

    private toOptionInputs(
        options: ProductOptionDto[],
        uploadedImages: Map<string, string>,
    ): Prisma.ProductOptionCreateWithoutProductInput[] {
        return options.map((option, optionIndex) => {
            const searchable = option.searchEnabled ?? false;
            const searchKeys = searchable
                ? [
                    ...new Set(
                        (option.searchKeys.length
                            ? option.searchKeys
                            : [option.title, ...option.items.map((item) => item.key)]
                        )
                            .map((key) => key.trim().toLocaleLowerCase())
                            .filter(Boolean),
                    ),
                ]
                : [];

            return {
                title: option.title,
                searchEnabled: searchable,
                searchKeys,
                items: {
                    create: option.items.map((item, itemIndex) => ({
                        key: item.key,
                        value: item.value,
                        image:
                            uploadedImages.get(
                                `option-image-${optionIndex}-${itemIndex}`,
                            ) ??
                            item.image ??
                            null,
                    })),
                },
            };
        });
    }

    private jsonValue(value: unknown): Prisma.InputJsonValue {
        return (value ?? []) as Prisma.InputJsonValue;
    }

    private async validateCategorySelection(
        categoryPath?: string,
        marketId?: string,
    ) {
        if (!categoryPath) return;

        const [pathCategoryId, optionId, ...itemIds] = categoryPath.split('|');

        if (!pathCategoryId || !optionId) {
            throw new BadRequestException('Kategoriya yo‘li noto‘g‘ri shakllantirilgan.');
        }

        const category = await this.prisma.category.findUnique({
            where: { id: pathCategoryId },
            select: { id: true, marketId: true },
        });

        if (!category) {
            throw new BadRequestException('Kategoriya topilmadi.');
        }

        if (marketId && category.marketId !== marketId) {
            throw new BadRequestException('Kategoriya ushbu marketga tegishli emas.');
        }

        const option = await this.prisma.categoryOption.findUnique({
            where: { id: optionId },
            select: { id: true, categoryId: true },
        });

        if (!option || option.categoryId !== pathCategoryId) {
            throw new BadRequestException('Kategoriya opsiyasi ushbu kategoriyaga tegishli emas.');
        }

        let parentId: string | null = null;
        for (const [index, itemId] of itemIds.entries()) {
            const item = await this.prisma.categoryOptionItem.findUnique({
                where: { id: itemId },
                select: { id: true, optionId: true, parentId: true },
            });

            if (!item) {
                throw new BadRequestException('Kategoriya elementi topilmadi.');
            }

            const validRoot = index === 0 && item.optionId === optionId && !item.parentId;
            const validChild = index > 0 && item.parentId === parentId;

            if (!validRoot && !validChild) {
                throw new BadRequestException('Kategoriya elementlari zanjiri noto‘g‘ri yoki uzilgan.');
            }

            parentId = item.id;
        }
    }

    async deleteProduct(id: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!product) {
            throw new NotFoundException('Mahsulot topilmadi.');
        }
        return this.products.delete({ id });
    }
}
