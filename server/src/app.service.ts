import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
    constructor(private readonly prisma: PrismaService) { }

    getHello(): string {
        return 'Hello!';
    }

    async getRole(email: string, marketId: string) {
        console.log(`user keldi email: ${email}, marketId: ${marketId}`);
        
        const worker = await this.prisma.worker.findFirst({
            where: {
                marketId: marketId,
                user: {
                    email: email,
                },
            }
        });

        if (worker) {
            console.log(worker.role)
            return { permissions: worker.permissions, role: worker.role };
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
            console.log('owner')
            return { permissions: ['all:all'], role: 'owner' };
        }

        throw new NotFoundException('Bu marketda bunday foydalanuvchi topilmadi');
    }
}