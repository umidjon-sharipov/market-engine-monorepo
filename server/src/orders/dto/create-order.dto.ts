import { Type } from 'class-transformer';
import { Prisma, OrderStatus } from '@prisma/client';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';

export class OrderStockReservationDto {
    @IsUUID()
    productId!: string;

    @IsUUID()
    warehouseId!: string;

    @IsUUID()
    binId!: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity!: number;
}

export class CreateOrderDto {
    @IsNotEmpty({ message: "Ism (name) kiritilishi shart" })
    @IsString({ message: "Ism matn shaklida bo'lishi kerak" })
    name!: string;

    @IsNotEmpty({ message: "Mahsulot (product) kiritilishi shart" })
    @IsString({ message: "Mahsulot matn shaklida bo'lishi kerak" })
    product!: string;

    @IsNotEmpty({ message: "Telefon raqam kiritilishi shart" })
    @IsString({ message: "Telefon raqam matn shaklida bo'lishi kerak" })
    phone!: string;

    @IsNotEmpty({ message: "Manzil (address) kiritilishi shart" })
    @IsString({ message: "Manzil matn shaklida bo'lishi kerak" })
    address!: string;

    @IsNotEmpty({ message: "Buyurtma elementlari (items) kiritilishi shart" })
    items!: Prisma.InputJsonValue;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderStockReservationDto)
    stockReservations?: OrderStockReservationDto[];
}

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status!: OrderStatus;
}