import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus, ProductStatus, WarehouseTaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.follower.findMany({
      where: { userId },
    });
  }

  async usersAll(userId: string, marketId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const [worker, market] = await Promise.all([
      this.prisma.worker.findFirst({
        where: {
          userId: user.id,
          marketId: marketId,
          role: { in: ['admin', 'owner', 'manager'] },
        },
        select: { id: true },
      }),
      this.prisma.market.findUnique({
        where: { id: marketId },
        select: { id: true, email: true },
      }),
    ]);

    if (!market) throw new NotFoundException('Market topilmadi.');

    const isOwner = market.email.toLowerCase() === user.email.toLowerCase();
    if (!isOwner && !worker) {
      throw new ForbiddenException(
        'Sizda bu market maʼlumotlarini koʻrish uchun huquq yoʻq',
      );
    }

    const records = await this.prisma.following.findMany({
      where: { marketId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        follow: true,
        block: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            image: true,
            bio: true,
            createdAt: true,
          },
        },
      },
    });

    return records
      .filter(
        (record) => Array.isArray(record.follow) && record.follow.length > 0,
      )
      .map((record) => ({
        id: record.id,
        user: record.user,
        follow: record.follow,
        block: record.block,
        createdAt: record.user.createdAt,
        updatedAt: record.updatedAt,
      }));
  }

  async marketAnalytics(userId: string, marketId: string) {
    const [user, market] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      }),
      this.prisma.market.findUnique({
        where: { id: marketId },
        select: { id: true, email: true },
      }),
    ]);
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi.');
    if (!market) throw new NotFoundException('Market topilmadi.');

    const worker = await this.prisma.worker.findFirst({
      where: {
        userId,
        marketId,
        permissions: { has: 'dashboard:get' },
      },
      select: { id: true },
    });
    const isOwner = market.email.toLowerCase() === user.email.toLowerCase();
    if (!isOwner && !worker) {
      throw new ForbiddenException('Dashboard ma’lumotlarini ko‘rish uchun ruxsat yo‘q.');
    }

    const [orderCount, pendingOrderCount, revenue, productCount, customerRecords, inventory, openTaskCount] =
      await Promise.all([
        this.prisma.order.count({ where: { marketId } }),
        this.prisma.order.count({
          where: {
            marketId,
            status: {
              in: [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.PROCESSING],
            },
          },
        }),
        this.prisma.order.aggregate({
          where: {
            marketId,
            status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
          },
          _sum: { total: true },
        }),
        this.prisma.product.count({
          where: { marketId, status: ProductStatus.ACTIVE, isOptionOnly: false },
        }),
        this.prisma.following.findMany({
          where: { marketId },
          select: { follow: true },
        }),
        this.prisma.warehouseInventory.aggregate({
          where: {
            warehouse: { marketId },
            bin: { status: 'active' },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          _sum: { quantity: true, reservedQuantity: true },
        }),
        this.prisma.warehouseTask.count({
          where: {
            marketId,
            status: {
              in: [
                WarehouseTaskStatus.OPEN,
                WarehouseTaskStatus.ASSIGNED,
                WarehouseTaskStatus.PICKING,
                WarehouseTaskStatus.PICKED,
                WarehouseTaskStatus.IN_TRANSIT,
              ],
            },
          },
        }),
      ]);

    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    startDate.setMonth(startDate.getMonth() - 5);
    const monthlyRows = await this.prisma.$queryRaw<
      Array<{ month: Date; orderCount: number; revenue: number }>
    >`
      SELECT
        date_trunc('month', "createdAt") AS month,
        COUNT(*)::int AS "orderCount",
        COALESCE(
          SUM(total) FILTER (WHERE status IN ('DELIVERED', 'COMPLETED')),
          0
        )::float8 AS revenue
      FROM "Orders"
      WHERE "marketId" = ${marketId}::uuid
        AND "createdAt" >= ${startDate}
      GROUP BY date_trunc('month', "createdAt")
      ORDER BY month ASC
    `;
    const rowsByMonth = new Map(
      monthlyRows.map((row) => [
        new Date(row.month).toISOString().slice(0, 7),
        row,
      ]),
    );
    const monthly = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(startDate);
      month.setMonth(startDate.getMonth() + index);
      const key = month.toISOString().slice(0, 7);
      const row = rowsByMonth.get(key);
      return {
        month: key,
        orders: row?.orderCount ?? 0,
        revenue: row?.revenue ?? 0,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        orderCount,
        pendingOrderCount,
        completedRevenue: revenue._sum.total ?? 0,
        activeProductCount: productCount,
        customerCount: customerRecords.filter(
          (record) => Array.isArray(record.follow) && record.follow.length > 0,
        ).length,
        availableInventoryUnits: Math.max(
          0,
          (inventory._sum.quantity ?? 0) -
            (inventory._sum.reservedQuantity ?? 0),
        ),
        openWarehouseTaskCount: openTaskCount,
      },
      monthly,
    };
  }
}
