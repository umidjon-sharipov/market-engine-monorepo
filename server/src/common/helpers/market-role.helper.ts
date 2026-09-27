import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { JwtService } from '@nestjs/jwt';

export async function validateMarketRole(
    pool: Pool,
    jwtService: JwtService,
    validation: any
) {
    const { authorization, marketId, role } = validation;

    if (!authorization || !marketId || !role) {
        throw new ForbiddenException("Authorization, Market ID yoki Rol topilmadi!");
    }

    try {
        const token = authorization.replace('Bearer ', '').trim();
        const decodedUser: any = jwtService.verify(token);
        const userEmail = decodedUser?.email;

        if (!userEmail) {
            throw new ForbiddenException("Token yaroqsiz: email topilmadi!");
        }

        if (role === 'owner') {
            const marketCheck = await pool.query(
                'SELECT * FROM "Markets" WHERE id = $1 AND email = $2',
                [marketId, userEmail]
            );

            if (marketCheck.rows.length === 0) {
                throw new ForbiddenException("Siz bu marketning egasi emassiz!");
            }
        } else {
            const workerCheck = await pool.query(
                'SELECT * FROM "Workers" WHERE "marketId" = $1 AND email = $2 AND role = $3',
                [marketId, userEmail, role]
            );

            if (workerCheck.rows.length === 0) {
                throw new ForbiddenException("Sizning huquqingiz yo'q!");
            }
        }

        return true;
    } catch (error) {
        if (error instanceof ForbiddenException) {
            throw error;
        }
        throw new ForbiddenException("Token yaroqsiz yoki ruxsat etilmadi!");
    }
}