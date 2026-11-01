import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { PrismaService } from '../prisma/prisma.service';
import { ProductRepository } from './product.repository';
import {
    CreateProductDto,
    ProductOptionDto,
    UpdateProductDto,
} from './dto/create-product.dto';

const productCatalogInclude = {
    market: { select: { id: true, title: true, logo: true } },
    options: {
        include: {
            items: {
                include: {
                    includedProduct: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            uom: true,
                            images: true,
                            quantity: true,
                            marketId: true,
                            isOptionOnly: true,
                            status: true,
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.ProductInclude;

type ProductCatalogRow = Prisma.ProductGetPayload<{
    include: typeof productCatalogInclude;
}>;
type ProductCatalogNode = Omit<ProductCatalogRow, 'options'> & {
    quantity: number;
    options: Array<
        Omit<ProductCatalogRow['options'][number], 'items'> & {
            items: Array<
                Omit<ProductCatalogRow['options'][number]['items'][number], 'includedProduct'> & {
                    includedProduct: ProductCatalogNode | null;
                }
            >;
        }
    >;
};

@Injectable()
export class ProductsService {
    constructor(
        private readonly products: ProductRepository,
        private readonly prisma: PrismaService,
    ) { }

    findAll(search?: string, marketId?: string) {
        return this.findProducts({
            ...(marketId ? { marketId } : {}),
            ...this.searchWhere(search),
        }, false);
    }

    findManagementProducts(marketId: string) {
        return this.findProducts({ marketId }, true);
    }

    private searchWhere(search?: string): Prisma.ProductWhereInput {
        const terms = search
            ?.trim()
            .toLocaleLowerCase()
            .split(/\s+/)
            .filter(Boolean);
        return terms?.length
            ? {
                OR: [
                    { title: { contains: search?.trim(), mode: 'insensitive' } },
                    {
                        options: {
                            some: {
                                searchEnabled: true,
                                OR: [
                                    { searchKeys: { hasSome: terms } },
                                    {
                                        items: {
                                            some: {
                                                includedProduct: {
                                                    title: {
                                                        contains: search?.trim() ?? '',
                                                        mode: 'insensitive',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ],
            }
            : {};
    }

    private async availableInventory(marketIds?: string[]) {
        const marketCondition = marketIds?.length
            ? Prisma.sql`AND product."marketId" IN (${Prisma.join(
                marketIds.map((marketId) => Prisma.sql`${marketId}::uuid`),
            )})`
            : Prisma.empty;
        return this.prisma.$queryRaw<{ productId: string; availableQuantity: number }[]>(
            Prisma.sql`
                SELECT inventory."productId" AS "productId",
                       SUM(inventory.quantity - inventory."reservedQuantity")::float AS "availableQuantity"
                FROM "WarehouseInventories" AS inventory
                INNER JOIN "Warehouses" AS warehouse ON warehouse.id = inventory."warehouseId"
                INNER JOIN "StorageBins" AS bin ON bin.id = inventory."binId"
                INNER JOIN "Products" AS product ON product.id = inventory."productId"
                WHERE warehouse."marketId" = product."marketId"
                  AND bin.status = 'active'
                  AND inventory.quantity > inventory."reservedQuantity"
                  AND (inventory."expiresAt" IS NULL OR inventory."expiresAt" > NOW())
                  ${marketCondition}
                GROUP BY inventory."productId"
                HAVING SUM(inventory.quantity - inventory."reservedQuantity") > 0
            `,
        );
    }

    private async findProducts(
        where: Prisma.ProductWhereInput,
        includeUnavailable: boolean,
    ) {
        const inventory = await this.availableInventory(
            typeof where.marketId === 'string' ? [where.marketId] : undefined,
        );
        const available = new Map(
            inventory.map((item) => [item.productId, item.availableQuantity]),
        );
        const marketScope = where.marketId;
        const allProducts = await this.prisma.product.findMany({
            where: marketScope ? { marketId: marketScope } : {},
            include: productCatalogInclude,
            orderBy: [{ title: 'asc' }, { id: 'asc' }],
        });
        const productsById = new Map(
            allProducts.map((product) => [product.id, product]),
        );
        const buildProduct = (
            current: ProductCatalogRow,
            ancestors: Set<string>,
            depth = 0,
        ): ProductCatalogNode => ({
            ...current,
            quantity: available.get(current.id) ?? 0,
            options: current.options.map((group) => ({
                ...group,
                items: group.items.flatMap((item) => {
                    const includedProductId = item.includeProductId;
                    const includedProduct = includedProductId
                        ? productsById.get(includedProductId)
                        : undefined;
                    if (
                        !includedProduct ||
                        depth >= 8 ||
                        ancestors.has(includedProduct.id) ||
                        (!includeUnavailable &&
                            (available.get(includedProduct.id) ?? 0) <= 0)
                    ) {
                        return [];
                    }
                    return [{
                        ...item,
                        includedProduct: buildProduct(
                            includedProduct,
                            new Set([...ancestors, current.id]),
                            depth + 1,
                        ),
                    }];
                }),
            })),
        });

        const rootProducts = await this.prisma.product.findMany({
            where: {
                ...where,
                ...(!includeUnavailable
                    ? {
                        id: { in: inventory.map((item) => item.productId) },
                        isOptionOnly: false,
                        status: ProductStatus.ACTIVE,
                    }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });

        return rootProducts.flatMap(({ id }) => {
            const baseProduct = productsById.get(id);
            if (!baseProduct) return [];
            const product = buildProduct(baseProduct, new Set());
            const hasUnavailableRequiredOption = !includeUnavailable &&
                product.options.some((group) => !group.isOptional && group.items.length === 0);
            if (hasUnavailableRequiredOption) return [];
            return [{
                ...product,
            }];
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
        const where: Prisma.ProductWhereInput = {
            marketId,
            ...this.searchWhere(search),
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

    async findData(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
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

        if (activeMarketIds.length === 0) return [];

        return this.findProducts({ marketId: { in: activeMarketIds } }, false);
    }

    async createProduct(
        body: CreateProductDto,
        files: Array<Express.Multer.File>,
    ) {
        await this.validateCategorySelection(
            body.categoryPath,
            body.marketId,
        );
        await this.validateOptionProducts(body.options, body.marketId);
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
        if (body.options !== undefined) {
            await this.validateOptionProducts(body.options, marketId, id);
        }

        const data: Prisma.ProductUpdateInput = {};
        if (body.title !== undefined) data.title = body.title;
        if (body.isOptionOnly !== undefined) data.isOptionOnly = body.isOptionOnly;
        if (body.status !== undefined) data.status = body.status;
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
            data.options = {
                deleteMany: {},
                create: this.toOptionInputs(body.options),
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
            isOptionOnly: body.isOptionOnly ?? false,
            status: body.status ?? ProductStatus.ACTIVE,
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
                create: this.toOptionInputs(body.options ?? []),
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
    ): Prisma.ProductOptionCreateWithoutProductInput[] {
        return options.map((option) => {
            const searchable = option.searchEnabled ?? false;
            const searchKeys = (option.searchKeys ?? [])
                .map((key) => key.trim().toLocaleLowerCase())
                .filter(Boolean);

            return {
                title: option.title,
                isOptional: option.isOptional ?? false,
                searchEnabled: searchable,
                searchKeys,
                items: {
                    create: option.items.map((item) => ({
                        includedProduct: {
                            connect: { id: item.includeProductId },
                        },
                    })),
                },
            };
        });
    }

    private async validateOptionProducts(
        options: ProductOptionDto[] | undefined,
        marketId: string,
        parentProductId?: string,
    ) {
        if (!options?.length) return;
        if (options.some((option) => option.items.length === 0)) {
            throw new BadRequestException(
                'Har bir product option kamida bitta warehouse mahsulotini o‘z ichiga olishi kerak.',
            );
        }
        const productIds = options.flatMap((option) =>
            option.items.map((item) => item.includeProductId),
        );
        if (options.some((option) =>
            new Set(option.items.map((item) => item.includeProductId)).size !== option.items.length
        )) {
            throw new BadRequestException(
                'Bir option guruhida bir xil warehouse mahsulotini takrorlash mumkin emas.',
            );
        }
        const uniqueIds = [...new Set(productIds)];
        if (parentProductId && uniqueIds.includes(parentProductId)) {
            throw new BadRequestException(
                'Mahsulot o‘zini o‘z optioniga qo‘sha olmaydi.',
            );
        }
        const includedProducts = await this.prisma.product.findMany({
            where: { id: { in: uniqueIds }, marketId },
            select: { id: true },
        });
        if (includedProducts.length !== uniqueIds.length) {
            throw new BadRequestException(
                'Option ichidagi barcha mahsulotlar shu marketga tegishli bo‘lishi kerak.',
            );
        }
        const previouslyLinkedIds = parentProductId
            ? new Set(
                  (
                      await this.prisma.productOptionItem.findMany({
                          where: {
                              includeProductId: { in: uniqueIds },
                              option: { productId: parentProductId },
                          },
                          select: { includeProductId: true },
                      })
                  )
                      .map((item) => item.includeProductId)
                      .filter((id): id is string => id !== null),
              )
            : new Set<string>();
        const newProductIds = uniqueIds.filter(
            (productId) => !previouslyLinkedIds.has(productId),
        );
        if (newProductIds.length) {
            const stockedProducts = await this.prisma.warehouseInventory.groupBy({
                by: ['productId'],
                where: {
                    productId: { in: newProductIds },
                    warehouse: { marketId },
                    bin: { status: 'active' },
                    quantity: { gt: 0 },
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
                _sum: { quantity: true, reservedQuantity: true },
            });
            const availableProductIds = new Set(
                stockedProducts
                    .filter(
                        (inventory) =>
                            (inventory._sum.quantity ?? 0) -
                                (inventory._sum.reservedQuantity ?? 0) >
                            0,
                    )
                    .map((inventory) => inventory.productId),
            );
            if (newProductIds.some((productId) => !availableProductIds.has(productId))) {
                throw new BadRequestException(
                    'Optionga faqat omborda yaroqli qoldig‘i bor mahsulotni ulash mumkin.',
                );
            }
        }
        if (parentProductId) {
            const visited = new Set<string>();
            let frontier = [...uniqueIds];
            for (let depth = 0; frontier.length && depth < 8; depth += 1) {
                if (frontier.includes(parentProductId)) {
                    throw new BadRequestException(
                        'Product option konfiguratsiyasida o‘zaro sikl hosil qilib bo‘lmaydi.',
                    );
                }
                const nextIds = frontier.filter((id) => !visited.has(id));
                nextIds.forEach((id) => visited.add(id));
                if (!nextIds.length) break;
                const children = await this.prisma.productOptionItem.findMany({
                    where: {
                        option: { productId: { in: nextIds } },
                        includeProductId: { not: null },
                    },
                    select: { includeProductId: true },
                });
                frontier = children
                    .map((item) => item.includeProductId)
                    .filter((id): id is string => !!id && !visited.has(id));
            }
            if (frontier.length) {
                throw new BadRequestException(
                    'Product konfiguratsiyasining chuqurligi 8 pog‘onadan oshmasligi kerak.',
                );
            }
        }
    }

    private async ensureProductNotIncluded(productId: string) {
        const includedInOptions = await this.prisma.productOptionItem.count({
            where: { includeProductId: productId },
        });
        if (includedInOptions > 0) {
            throw new BadRequestException(
                'Bu mahsulot boshqa product optionlarida ishlatilgan; omborini o‘chirishdan avval ularni tahrirlang.',
            );
        }
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
        await this.ensureProductNotIncluded(id);
        return this.products.delete({ id });
    }
}
