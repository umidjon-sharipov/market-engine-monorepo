import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { PrismaService } from '../prisma/prisma.service';
import { ProductRepository } from './product.repository';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

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
                { options: { some: { searchKeys: { hasSome: terms } } } },
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

  async createProduct(body: CreateProductDto, files: Array<Express.Multer.File>) {
    await this.validateCategoryItem(body.categoryItemId, body.marketId);
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
    await this.validateCategoryItem(body.categoryItemId, marketId);
    const data: Prisma.ProductUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined)
      data.description = this.jsonValue(body.description);
    if (body.price !== undefined) data.price = body.price;
    if (body.quantity !== undefined) data.quantity = body.quantity;
    if (body.gradient !== undefined)
      data.gradient = this.jsonValue(body.gradient);
    if (body.marketId !== undefined)
      data.market = { connect: { id: body.marketId } };
    if (body.warehouseId !== undefined)
      data.warehouse = { connect: { id: body.warehouseId } };
    if (body.discountId !== undefined) {
      data.discount = body.discountId
        ? { connect: { id: body.discountId } }
        : { disconnect: true };
    }
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
    if (files.length) data.images = await this.uploadImages(files);
    if (body.options !== undefined) {
      data.options = {
        deleteMany: {},
        create: body.options.map((option) => ({
          title: option.title,
          searchKeys: option.searchKeys,
          items: {
            create: option.items.map((item) => ({
              key: item.key,
              value: item.value,
            })),
          },
        })),
      };
    }
    return this.products.update({ id }, data);
  }

  private async toCreateInput(
    body: CreateProductDto,
    files: Array<Express.Multer.File>,
  ): Promise<Prisma.ProductCreateInput> {
    const imageUrls = await this.uploadImages(files);
    const { marketId, warehouseId, discountId, categoryId, categoryItemId } =
      body;

    return {
      title: body.title,
      price: body.price,
      quantity: body.quantity,
      description: this.jsonValue(body.description),
      gradient: this.jsonValue(body.gradient ?? []),
      images: imageUrls,
      market: { connect: { id: marketId } },
      warehouse: { connect: { id: warehouseId } },
      ...(discountId
        ? { discount: { connect: { id: discountId } } }
        : {}),
      ...(categoryId
        ? { category: { connect: { id: categoryId } } }
        : {}),
      ...(categoryItemId
        ? { categoryItem: { connect: { id: categoryItemId } } }
        : {}),
      options: {
        create: body.options.map((option) => ({
          title: option.title,
          searchKeys: option.searchKeys,
          items: {
            create: option.items.map((item) => ({
              key: item.key,
              value: item.value,
            })),
          },
        })),
      },
    };
  }

  private uploadImages(files: Array<Express.Multer.File>) {
    return Promise.all(
      files
        .filter((file) => file.fieldname.startsWith('image-'))
        .map((file) => uploadImageToImgBB(file)),
    );
  }

  private jsonValue(value: unknown): Prisma.InputJsonValue {
    return value ?? [];
  }

  private async validateCategoryItem(categoryItemId?: string, marketId?: string) {
    if (!categoryItemId) return;
    const item = await this.prisma.categoryOptionItem.findUnique({
      where: { id: categoryItemId },
      select: {
        children: { select: { id: true }, take: 1 },
        parentId: true,
        option: { select: { category: { select: { marketId: true } } } },
      },
    });
    if (!item) throw new BadRequestException('Kategoriya elementi topilmadi.');
    if (item.children.length) {
      throw new BadRequestException(
        'Mahsulot faqat eng oxirgi kategoriya elementiga biriktirilishi shart',
      );
    }
    let ancestor = item;
    const visited = new Set([categoryItemId]);
    while (!ancestor.option && ancestor.parentId) {
      if (visited.has(ancestor.parentId)) {
        throw new BadRequestException('Kategoriya daraxtida noto‘g‘ri parent bog‘lanishi mavjud.');
      }
      visited.add(ancestor.parentId);
      const parent = await this.prisma.categoryOptionItem.findUnique({
        where: { id: ancestor.parentId },
        select: {
          children: { select: { id: true }, take: 1 },
          parentId: true,
          option: { select: { category: { select: { marketId: true } } } },
        },
      });
      if (!parent) throw new BadRequestException('Kategoriya parent elementi topilmadi.');
      ancestor = parent;
    }
    if (!ancestor.option) {
      throw new BadRequestException('Kategoriya elementi optionga bog‘lanmagan.');
    }
    if (marketId && ancestor.option.category.marketId !== marketId) {
      throw new BadRequestException(
        'Kategoriya elementi mahsulot marketiga tegishli emas.',
      );
    }
  }
}
