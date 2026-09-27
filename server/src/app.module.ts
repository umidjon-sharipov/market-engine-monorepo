import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { MarketsModule } from './markets/markets.module';
import { ProductsModule } from './products/products.module';
import { CommentsModule } from './comments/comments.module';
import { OrdersModule } from './orders/orders.module';
import { ReactionsModule } from './reactions/reactions.module';
import { DiscountsModule } from './discounts/discounts.module';
import { SlidersModule } from './sliders/sliders.module';
import { FeatureRequestsModule } from './feature-requests/feature-requests.module';
import { AuthModule } from './auth/auth.module';
import { FollowingsModule } from './followings/followings.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VacanciesModule } from './vacancies/vacancies.module';
import { WorkersModule } from './workers/workers.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { CategoriesModule } from './categories/categories.module';
import { GroupsModule } from './groups/groups.module';
import { MessagesModule } from './messages/messages.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    DatabaseModule,
    UsersModule,
    MarketsModule,
    ProductsModule,
    CommentsModule,
    OrdersModule,
    ReactionsModule,
    DiscountsModule,
    SlidersModule,
    FeatureRequestsModule,
    AuthModule,
    FollowingsModule,
    VacanciesModule,
    WorkersModule,
    WarehousesModule,
    CategoriesModule,
    GroupsModule,
    MessagesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
