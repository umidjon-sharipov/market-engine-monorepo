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
  ) {}

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
        categoryItem: { select: { id: true, title: true } },
      },
    });
  }

  async createProduct(
    body: CreateProductDto,
    files: Array<Express.Multer.File>,
  ) {
    await this.validateCategorySelection(
      body.categoryId,
      body.categoryItemId,
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
    await this.validateCategorySelection(
      body.categoryId,
      body.categoryItemId,
      body.categoryPath,
      marketId,
    );

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
    if (body.categoryId !== undefined) {
      data.category = body.categoryId
        ? { connect: { id: body.categoryId } }
        : { disconnect: true };
    }
    if (body.categoryItemId !== undefined) {
      data.categoryItem = body.categoryItemId
        ? { connect: { id: body.categoryItemId } }
        : { disconnect: true };
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
      ...(body.categoryId && {
        category: { connect: { id: body.categoryId } },
      }),
      ...(body.categoryItemId && {
        categoryItem: { connect: { id: body.categoryItemId } },
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
    return value ?? [];
  }

  private async validateCategorySelection(
    categoryId?: string,
    categoryItemId?: string,
    categoryPath?: string,
    marketId?: string,
  ) {
    if (!categoryItemId && !categoryPath) return;

    if (categoryPath) {
      const [pathCategoryId, optionId, ...itemIds] = categoryPath.split('|');
      if (
        !pathCategoryId ||
        !optionId ||
        !itemIds.length ||
        pathCategoryId !== categoryId ||
        itemIds[itemIds.length - 1] !== categoryItemId
      ) {
        throw new BadRequestException(
          'Kategoriya yo‘li va tanlangan element mos emas.',
        );
      }

      const option = await this.prisma.categoryOption.findUnique({
        where: { id: optionId },
        select: {
          categoryId: true,
          category: { select: { marketId: true } },
        },
      });
      if (!option || option.categoryId !== pathCategoryId) {
        throw new BadRequestException(
          'Kategoriya opsiyasi ushbu kategoriyaga tegishli emas.',
        );
      }
      if (marketId && option.category.marketId !== marketId) {
        throw new BadRequestException(
          'Kategoriya mahsulot marketiga tegishli emas.',
        );
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
        const validRoot =
          index === 0 && item.optionId === optionId && !item.parentId;
        const validChild =
          index > 0 && item.parentId === parentId && !item.optionId;
        if (!validRoot && !validChild) {
          throw new BadRequestException(
            'Kategoriya elementlari zanjiri noto‘g‘ri yoki uzilgan.',
          );
        }
        parentId = item.id;
      }
      return;
    }

    let item = await this.prisma.categoryOptionItem.findUnique({
      where: { id: categoryItemId },
      select: {
        id: true,
        optionId: true,
        parentId: true,
        option: {
          select: {
            categoryId: true,
            category: { select: { marketId: true } },
          },
        },
      },
    });
    if (!item) throw new BadRequestException('Kategoriya elementi topilmadi.');

    const visited = new Set<string>();
    while (item && !item.option && item.parentId) {
      if (visited.has(item.parentId)) {
        throw new BadRequestException(
          'Kategoriya daraxtida parent zanjiri buzilgan.',
        );
      }
      visited.add(item.parentId);
      const parent = await this.prisma.categoryOptionItem.findUnique({
        where: { id: item.parentId },
        select: {
          id: true,
          optionId: true,
          parentId: true,
          option: {
            select: {
              categoryId: true,
              category: { select: { marketId: true } },
            },
          },
        },
      });
      if (!parent) {
        throw new BadRequestException('Kategoriya parent elementi topilmadi.');
      }
      item = parent;
    }
    if (!item?.option || (categoryId && item.option.categoryId !== categoryId)) {
      throw new BadRequestException(
        'Kategoriya elementi tanlangan kategoriyaga tegishli emas.',
      );
    }
    if (marketId && item.option.category.marketId !== marketId) {
      throw new BadRequestException(
        'Kategoriya elementi mahsulot marketiga tegishli emas.',
      );
    }
  }
}
