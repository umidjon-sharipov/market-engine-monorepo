import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CategoryOptionItem, Prisma } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryRepository } from './category.repository';
import {
    CategoryOptionItemDto,
    CreateCategoryDto,
    UpdateCategoryDto,
} from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        private readonly categories: CategoryRepository,
        private readonly prisma: PrismaService,
    ) { }

    async findAll(marketId: string, includeHidden = false) {
        const categories = await this.prisma.category.findMany({
            where: { marketId, ...(!includeHidden ? { hidden: false } : {}) },
            orderBy: { createdAt: 'desc' },
            include: {
                options: includeHidden ? true : { where: { hidden: false } },
            },
        });
        return this.withItemTrees(categories, includeHidden);
    }

    async findCatalog(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });
        if (!user) throw new NotFoundException('Foydalanuvchi topilmadi.');

        const [followings, ownedMarkets, categoryWorkers] = await this.prisma.$transaction([
            this.prisma.following.findMany({
                where: { userId },
                select: { marketId: true, follow: true, block: true },
            }),
            this.prisma.market.findMany({
                where: { email: user.email },
                select: { id: true, title: true, logo: true },
            }),
            this.prisma.worker.findMany({
                where: { userId, permissions: { has: 'category:get' } },
                select: { marketId: true },
            }),
        ]);
        const subscribedMarketIds = followings
            .filter((following) =>
                Array.isArray(following.follow) &&
                following.follow.length % 2 === 1 &&
                (!Array.isArray(following.block) || following.block.length % 2 === 0),
            )
            .map((following) => following.marketId);
        const visibleMarketIds = new Set([
            ...subscribedMarketIds,
            ...ownedMarkets.map((market) => market.id),
            ...categoryWorkers.map((worker) => worker.marketId),
        ]);
        if (!visibleMarketIds.size) return [];

        const markets = await this.prisma.market.findMany({
            where: { id: { in: [...visibleMarketIds] } },
            select: { id: true, title: true, logo: true },
            orderBy: { title: 'asc' },
        });
        const hiddenMarketIds = new Set([
            ...ownedMarkets.map((market) => market.id),
            ...categoryWorkers.map((worker) => worker.marketId),
        ]);

        return Promise.all(markets.map(async (market) => ({
            ...market,
            categories: await this.findAll(market.id, hiddenMarketIds.has(market.id)),
        })));
    }

    async findOne(id: string, includeHidden = false) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                options: includeHidden ? true : { where: { hidden: false } },
            },
        });
        if (!category)
            throw new NotFoundException('Requested resource was not found');
        return (await this.withItemTrees([category], includeHidden))[0];
    }

    async create(body: CreateCategoryDto, files: Array<Express.Multer.File>) {
        return this.categories.create(await this.createInput(body, files));
    }

    async update(
        id: string,
        body: UpdateCategoryDto,
        files: Array<Express.Multer.File>,
    ) {
        return this.categories.update({ id }, await this.updateInput(body, files));
    }

    delete(id: string) {
        return this.categories.delete({ id });
    }

    private async createInput(
        body: CreateCategoryDto,
        files: Array<Express.Multer.File>,
    ): Promise<Prisma.CategoryCreateInput> {
        const fileMap = new Map(files.map((file) => [file.fieldname, file]));
        return {
            title: body.title,
            image: await this.requiredImage(
                body.image,
                fileMap.get('categoryImage'),
                'Kategoriya',
            ),
            hidden: body.hidden ?? false,
            market: { connect: { id: body.marketId } },
            options: { create: await this.optionsInput(body.options ?? [], files) },
        };
    }

    private async updateInput(
        body: UpdateCategoryDto,
        files: Array<Express.Multer.File>,
    ): Promise<Prisma.CategoryUpdateInput> {
        const data: Prisma.CategoryUpdateInput = {};
        if (body.title !== undefined) data.title = body.title;
        if (
            body.image !== undefined ||
            files.some((file) => file.fieldname === 'categoryImage')
        ) {
            const categoryImage = files.find(
                (file) => file.fieldname === 'categoryImage',
            );
            data.image = await this.requiredImage(
                body.image,
                categoryImage,
                'Kategoriya',
            );
        }
        if (body.hidden !== undefined) data.hidden = body.hidden;
        if (body.options !== undefined) {
            data.options = {
                deleteMany: {},
                create: await this.optionsInput(body.options ?? [], files),
            };
        }
        return data;
    }

    private async optionsInput(
        options: CreateCategoryDto['options'],
        files: Array<Express.Multer.File>,
    ) {
        const fileMap = new Map(files.map((file) => [file.fieldname, file]));
        return Promise.all(
            options.map(async (option, optionIndex) => ({
                title: option.title,
                image: await this.requiredImage(
                    option.image,
                    fileMap.get(`optionImage_${optionIndex}`),
                    `Option "${option.title}"`,
                ),
                hidden: option.hidden ?? false,
                items: {
                    create: await Promise.all(
                        option.items.map((item, itemIndex) =>
                            this.itemInput(item, fileMap, `${optionIndex}_${itemIndex}`),
                        ),
                    ),
                },
            })),
        );
    }

    private async itemInput(
        item: CategoryOptionItemDto,
        fileMap: Map<string, Express.Multer.File>,
        fileIndex: string,
    ): Promise<Prisma.CategoryOptionItemCreateWithoutOptionInput> {
        return {
            title: item.title,
            image: await this.requiredImage(
                item.image,
                fileMap.get(`file_${fileIndex}`),
                `Item "${item.title}"`,
            ),
            hidden: item.hidden ?? false,
            ...(item.children?.length
                ? {
                    children: {
                        create: await Promise.all(
                            item.children.map((child, index) =>
                                this.itemInput(child, fileMap, `${fileIndex}_${index}`),
                            ),
                        ),
                    },
                }
                : {}),
        };
    }

    private async withItemTrees<T extends { options: Array<{ id: string }> }>(
        categories: T[],
        includeHidden: boolean,
    ) {
        const optionIds = categories.flatMap((category) =>
            category.options.map((option) => option.id),
        );
        const items: CategoryOptionItem[] = [];
        let frontier: CategoryOptionItem[] = optionIds.length
            ? await this.prisma.categoryOptionItem.findMany({
                where: {
                    optionId: { in: optionIds },
                    parentId: null,
                    ...(!includeHidden ? { hidden: false } : {}),
                },
            })
            : [];

        while (frontier.length) {
            items.push(...frontier);
            frontier = await this.prisma.categoryOptionItem.findMany({
                where: {
                    parentId: { in: frontier.map((item) => item.id) },
                    ...(!includeHidden ? { hidden: false } : {}),
                },
            });
        }

        const itemMap = new Map(
            items.map((item) => [item.id, { ...item, children: [] as typeof items }]),
        );
        const rootsByOption = new Map<string, typeof items>();

        for (const item of items) {
            if (item.parentId) {
                itemMap.get(item.parentId)?.children.push(itemMap.get(item.id)!);
            } else if (item.optionId) {
                const roots = rootsByOption.get(item.optionId) ?? [];
                roots.push(itemMap.get(item.id)!);
                rootsByOption.set(item.optionId, roots);
            }
        }

        return categories.map((category) => ({
            ...category,
            options: category.options.map((option) => ({
                ...option,
                items: rootsByOption.get(option.id) ?? [],
            })),
        }));
    }

    private async requiredImage(
        image: string | undefined,
        file: Express.Multer.File | undefined,
        label: string,
    ) {
        const imageUrl = file ? await uploadImageToImgBB(file) : image?.trim();
        if (!imageUrl)
            throw new BadRequestException(`${label} uchun rasm yuklash shart.`);
        return imageUrl;
    }
}
