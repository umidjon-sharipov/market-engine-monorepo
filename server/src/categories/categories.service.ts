import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoryRepository) {}

  findAll() {
    return this.categories.findAll({
      orderBy: { createdAt: 'desc' },
      include: { options: { include: { items: true } }, products: true },
    });
  }

  findOne(id: string) { return this.categories.findOne({ id }); }

  async create(body: CreateCategoryDto, files: Array<Express.Multer.File>) {
    return this.categories.create(await this.createInput(body, files));
  }

  async update(id: string, body: UpdateCategoryDto, files: Array<Express.Multer.File>) {
    return this.categories.update({ id }, await this.updateInput(body, files));
  }

  delete(id: string) { return this.categories.delete({ id }); }

  private async createInput(
    body: CreateCategoryDto,
    files: Array<Express.Multer.File>,
  ): Promise<Prisma.CategoryCreateInput> {
    return {
      title: body.title,
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
    if (body.options !== undefined || files.length > 0) {
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
    return Promise.all(options.map(async (option, optionIndex) => ({
      title: option.title,
      items: {
        create: await Promise.all(option.items.map(async (item, itemIndex) => ({
          title: item.title,
          image: await this.itemImage(item.image, fileMap.get(`file_${optionIndex}_${itemIndex}`)),
        }))),
      },
    })));
  }

  private itemImage(image: string | undefined, file?: Express.Multer.File) {
    return file ? uploadImageToImgBB(file) : Promise.resolve(image ?? null);
  }
}
