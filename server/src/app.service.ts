import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello!';
  }

  async getRole(email: string, marketId: string) {
    const worker = await this.prisma.worker.findFirst({
      where: {
        marketId: marketId,
        user: {
          email: email,
        },
      },
      select: {
        role: true,
      },
    });

    if (worker) {
      return { role: worker.role };
    }

    const market = await this.prisma.market.findFirst({
      where: {
        id: marketId,
        email: email,
      },
      select: {
        id: true,
      },
    });

    if (market) {
      return { role: 'owner' };
    }

    throw new NotFoundException('Bu marketda bunday foydalanuvchi topilmadi');
  }
}