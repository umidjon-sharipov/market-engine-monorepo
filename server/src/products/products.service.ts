import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { ProductRepository } from './product.repository';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly products: ProductRepository) {}

  findAll() {
    return this.products.findAll({
      orderBy: { createdAt: 'desc' },
      include: { options: { include: { items: true } } },
    });
  }

  async createProduct(body: CreateProductDto, files: Array<Express.Multer.File>) {
    return this.products.create(await this.toCreateInput(body, files));
  }

  private async toCreateInput(
    body: CreateProductDto,
    files: Array<Express.Multer.File>,
  ): Promise<Prisma.ProductCreateInput> {
    const imageUrls = await this.uploadImages(files);
    const { marketId, warehouseId, discountId, categoryId } = body;

    return {
      title: body.title,
      price: body.price,
      quantity: body.quantity,
      description: this.jsonValue(body.description),
      gradient: this.jsonValue(body.gradient ?? []),
      images: imageUrls,
      market: { connect: { id: marketId } },
      warehouse: { connect: { id: warehouseId } },
      ...(discountId ? { discount: { connect: { id: String(discountId) } } } : {}),
      ...(categoryId ? { category: { connect: { id: String(categoryId) } } } : {}),
      options: {
        create: body.options.map((option) => ({
          title: option.title,
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
    return (value ?? []) as Prisma.InputJsonValue;
  }
}
