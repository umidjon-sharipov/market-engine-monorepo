import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Type,
    mixin,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export function MarketAccessGuard(
    serviceType?: string,
    userEmail?: string,
    roles: string[] = ['owner', 'admin'],
    marketId?: string,
    method?: string,
): Type<CanActivate> {
    @Injectable()
    class MarketAccessGuardClass implements CanActivate {
        constructor(private readonly prisma: PrismaService) {}

        async canActivate(context: ExecutionContext): Promise<boolean> {
            console.log('--- MARKET ACCESS GUARD CHECK ---');
            console.log('Service Type:', serviceType);
            console.log('User Email:', userEmail);
            console.log('Allowed Roles:', roles);
            console.log('Market ID:', marketId);
            console.log('Method:', method);

            if (!marketId || !userEmail) {
                console.log('❌ RAD ETILDI: marketId yoki userEmail berilmagan!');
                return false;
            }

            if (roles.includes('owner')) {
                const isOwner = await this.prisma.market.findFirst({
                    where: {
                        id: marketId,
                        email: userEmail,
                    },
                    select: { id: true },
                });

                if (isOwner) {
                    console.log('✅ RUXSAT BERILDI: Foydalanuvchi marketning OWNERi!');
                    return true;
                }
            }

            console.log('ℹ️ Owner emas. Worker huquqlari tekshirilmoqda...');

            const user = await this.prisma.user.findUnique({
                where: { email: userEmail },
                select: { id: true },
            });

            if (!user) {
                console.log('❌ RAD ETILDI: Bunday emailga ega foydalanuvchi topilmadi!');
                return false;
            }

            const workers = await this.prisma.worker.findMany({
                where: {
                    marketId: marketId,
                    userId: user.id,
                },
            });

            if (!workers || workers.length === 0) {
                console.log('❌ RAD ETILDI: Ushbu foydalanuvchi ushbu marketda worker emas!');
                return false;
            }

            for (const worker of workers) {
                const hasValidRole = roles.includes(worker.role.toLowerCase());

        if (hasValidRole) {
            const rawPermissions = (worker as any).permissions;
            const permissions: string[] = Array.isArray(rawPermissions)
                ? rawPermissions
                : [];

            const hasServiceAccess = permissions.some((perm) => {
                if (typeof perm !== 'string') return false;
                const [permService, permMethod] = perm.split(':');
                return permService === serviceType && (!method || permMethod === method);
            });

                    if (hasServiceAccess) {
                        console.log(`✅ RUXSAT BERILDI: Worker rolida (${worker.role}) '${serviceType}' uchun huquq topildi!`);
                        return true;
                    }
                }
            }

            console.log('❌ RAD ETILDI: Mos keladigan rol yoki service huquqi (permissions) topilmadi!');
            return false;
        }
    }

    return mixin(MarketAccessGuardClass);
}