import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SliderRepository } from './slider.repository';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlidersService {
    constructor(private readonly sliders: SliderRepository, private readonly prisma: PrismaService) { }

    findAll() {
        return this.sliders.findAll({
            orderBy: { createdAt: 'desc' },
            include: { market: { select: { id: true, title: true, logo: true } } },
        });
    }

    async findData(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });
        if (!user) {
            throw new BadRequestException("Foydalanuvchi topilmadi");
        }

        const followings = await this.prisma.following.findMany({
            where: {
                userId: user.id,
            },
        });

        const activeMarketIds = followings
            .filter(item => {
                const isFollowing = Array.isArray(item.follow) && item.follow.length % 2 !== 0;

                const isBlocked = Array.isArray(item.block) && item.block.length % 2 !== 0;

                return isFollowing && !isBlocked;
            })
            .map(item => item.marketId);
        const ownedMarkets = await this.prisma.market.findMany({
            where: { email: user.email },
            select: { id: true },
        });
        const visibleMarketIds = [...new Set([
            ...activeMarketIds,
            ...ownedMarkets.map((market) => market.id),
        ])];

        if (visibleMarketIds.length === 0) return [];

        return this.sliders.findAll({
            where: {
                marketId: {
                    in: visibleMarketIds,
                },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                market: {
                    select: { id: true, title: true, logo: true }
                }
            },
        });
    }

    findByMarket(id: string) {
        return this.prisma.slider.findMany({ where: { marketId: id } })
    }

    findOne(id: string) {
        return this.sliders.findOne({ id });
    }

    create(body: CreateSliderDto) {
        return this.sliders.create(this.toCreateInput(body));
    }

    update(id: string, body: UpdateSliderDto) {
        return this.sliders.update({ id }, this.toUpdateInput(body));
    }

    delete(id: string) {
        return this.sliders.delete({ id });
    }

    private toCreateInput(body: CreateSliderDto): Prisma.SliderCreateInput {
        return {
            image: body.image ?? '',
            link: body.link,
            market: { connect: { id: body.marketId } },
        };
    }

    private toUpdateInput(body: UpdateSliderDto): Prisma.SliderUpdateInput {
        return {
            ...(body.image !== undefined && { image: body.image }),
            ...(body.link !== undefined && { link: body.link }),
            ...(body.marketId !== undefined && { market: { connect: { id: body.marketId } } }),
        };
    }
}