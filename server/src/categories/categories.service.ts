import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryOptionItem, Prisma } from '@prisma/client';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryRepository } from './category.repository';
import { CategoryOptionItemDto, CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: { options: true, products: true },
    });
    return this.withItemTrees(categories);
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { options: true, products: true },
    });
    if (!category) throw new NotFoundException('Requested resource was not found');
    return (await this.withItemTrees([category]))[0];
  }

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
    if (body.hidden !== undefined) data.hidden = body.hidden;
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
      hidden: option.hidden ?? false,
      items: {
        create: await Promise.all(option.items.map((item, itemIndex) =>
          this.itemInput(item, fileMap, `${optionIndex}_${itemIndex}`))),
      },
    })));
  }

  private async itemInput(
    item: CategoryOptionItemDto,
    fileMap: Map<string, Express.Multer.File>,
    fileIndex: string,
  ): Promise<Prisma.CategoryOptionItemCreateWithoutOptionInput> {
    return {
      title: item.title,
      image: await this.itemImage(item.image, fileMap.get(`file_${fileIndex}`)),
      hidden: item.hidden ?? false,
      ...(item.children?.length
        ? {
            children: {
              create: await Promise.all(item.children.map((child, index) =>
                this.itemInput(child, fileMap, `${fileIndex}_${index}`))),
            },
          }
        : {}),
    };
  }

  private async withItemTrees<T extends { options: Array<{ id: string }> }>(categories: T[]) {
    const optionIds = categories.flatMap((category) => category.options.map((option) => option.id));
    const items: CategoryOptionItem[] = [];
    let frontier: CategoryOptionItem[] = optionIds.length
      ? await this.prisma.categoryOptionItem.findMany({
          where: { optionId: { in: optionIds }, parentId: null },
        })
      : [];

    while (frontier.length) {
      items.push(...frontier);
      frontier = await this.prisma.categoryOptionItem.findMany({
        where: { parentId: { in: frontier.map((item) => item.id) } },
      });
    }

    const itemMap = new Map(items.map((item) => [item.id, { ...item, children: [] as typeof items }]));
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

  private itemImage(image: string | undefined, file?: Express.Multer.File) {
    return file ? uploadImageToImgBB(file) : Promise.resolve(image ?? null);
  }
}
