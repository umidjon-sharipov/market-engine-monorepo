-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('message', 'system', 'poll', 'media');

-- CreateTable
CREATE TABLE "Markets" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "logo" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "userName" VARCHAR(100),
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "phone" VARCHAR(20),
    "gender" VARCHAR(20),
    "bio" TEXT,
    "image" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "blockedUntil" TIMESTAMPTZ(6),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOtps" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "email" VARCHAR(255) NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOtps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSessions" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "refreshTokenHash" VARCHAR(255) NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "userAgent" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpBlockList" (
    "id" UUID NOT NULL,
    "ipAddress" VARCHAR(45) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "blockedUntil" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpBlockList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "ipAddress" VARCHAR(45) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Followers" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "following" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Followings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "marketId" UUID NOT NULL,
    "isFollowing" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Followings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" JSONB NOT NULL DEFAULT '[]',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gradient" JSONB NOT NULL DEFAULT '[]',
    "discountId" UUID,
    "categoryId" UUID,
    "images" JSONB NOT NULL DEFAULT '[]',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "marketId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOptions" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOptionItems" (
    "id" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ProductOptionItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sliders" (
    "id" UUID NOT NULL,
    "image" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "marketId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sliders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discounts" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6) NOT NULL,
    "market" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "product" TEXT NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "address" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureRequests" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "product" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comments" (
    "id" UUID NOT NULL,
    "reply" TEXT,
    "rate" INTEGER NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "user" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "comment" VARCHAR(400) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reactions" (
    "id" UUID NOT NULL,
    "reaction" VARCHAR(50) NOT NULL,
    "product" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workers" (
    "id" UUID NOT NULL,
    "marketId" UUID,
    "userId" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "salary" DECIMAL(12,2),
    "vacancyId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacancies" (
    "id" UUID NOT NULL,
    "marketId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "requiredRole" VARCHAR(50) NOT NULL,
    "jobType" VARCHAR(50) NOT NULL,
    "requiredWorkers" INTEGER NOT NULL,
    "salary" DECIMAL(12,2),
    "image" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "experience" VARCHAR(60) NOT NULL,
    "description" TEXT,
    "benefits" TEXT,
    "hrName" VARCHAR(255) NOT NULL,
    "hrPhone" VARCHAR(50) NOT NULL,
    "hrLink" TEXT,
    "applicants" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "marketId" UUID NOT NULL,
    "lat" VARCHAR(50) NOT NULL,
    "lng" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" UUID NOT NULL,
    "marketId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryOptions" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryOptionItems" (
    "id" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "image" TEXT,

    CONSTRAINT "CategoryOptionItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Groups" (
    "id" UUID NOT NULL,
    "url" VARCHAR(100) NOT NULL,
    "logo" TEXT,
    "securityLevel" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(200) NOT NULL,
    "topics" JSONB NOT NULL DEFAULT '[]',
    "description" VARCHAR(150),
    "founder" TEXT NOT NULL,
    "defaults" JSONB NOT NULL DEFAULT '{}',
    "users" JSONB NOT NULL DEFAULT '[]',
    "limit" VARCHAR(20) DEFAULT '\infty',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembers" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTopics" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "url" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "logo" TEXT,
    "defaults" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupTopics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMemberTopicPermissions" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "GroupMemberTopicPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPermissions" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID,
    "permission" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL DEFAULT 'true',

    CONSTRAINT "GroupPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessages" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "topicId" UUID,
    "userId" UUID,
    "message" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GroupMessages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPins" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "topicId" UUID,
    "messageId" UUID,
    "pinnedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "id" UUID NOT NULL,
    "pin" BOOLEAN NOT NULL DEFAULT false,
    "reply" TEXT,
    "user" TEXT NOT NULL,
    "message" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "audio" TEXT,
    "video" TEXT,
    "file" TEXT,
    "group" TEXT NOT NULL,
    "poll" JSONB NOT NULL DEFAULT '{}',
    "groups" JSONB NOT NULL DEFAULT '[]',
    "topic" TEXT,
    "topics" JSONB NOT NULL DEFAULT '[]',
    "views" JSONB NOT NULL DEFAULT '[]',
    "options" JSONB NOT NULL DEFAULT '[]',
    "type" "MessageType" NOT NULL DEFAULT 'message',
    "reactions" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Markets_email_idx" ON "Markets"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_userName_key" ON "Users"("userName");

-- CreateIndex
CREATE INDEX "UserOtps_email_isUsed_createdAt_idx" ON "UserOtps"("email", "isUsed", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserOtps_userId_idx" ON "UserOtps"("userId");

-- CreateIndex
CREATE INDEX "UserSessions_userId_idx" ON "UserSessions"("userId");

-- CreateIndex
CREATE INDEX "UserSessions_userId_isRevoked_expiresAt_idx" ON "UserSessions"("userId", "isRevoked", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IpBlockList_ipAddress_key" ON "IpBlockList"("ipAddress");

-- CreateIndex
CREATE INDEX "AuditLogs_userId_createdAt_idx" ON "AuditLogs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLogs_action_createdAt_idx" ON "AuditLogs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Followers_userId_idx" ON "Followers"("userId");

-- CreateIndex
CREATE INDEX "Followings_marketId_isFollowing_idx" ON "Followings"("marketId", "isFollowing");

-- CreateIndex
CREATE INDEX "Followings_userId_isFollowing_idx" ON "Followings"("userId", "isFollowing");

-- CreateIndex
CREATE UNIQUE INDEX "Followings_userId_marketId_key" ON "Followings"("userId", "marketId");

-- CreateIndex
CREATE INDEX "Products_marketId_createdAt_idx" ON "Products"("marketId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Products_warehouseId_idx" ON "Products"("warehouseId");

-- CreateIndex
CREATE INDEX "Products_categoryId_idx" ON "Products"("categoryId");

-- CreateIndex
CREATE INDEX "Products_discountId_idx" ON "Products"("discountId");

-- CreateIndex
CREATE INDEX "ProductOptions_productId_idx" ON "ProductOptions"("productId");

-- CreateIndex
CREATE INDEX "ProductOptionItems_optionId_idx" ON "ProductOptionItems"("optionId");

-- CreateIndex
CREATE INDEX "Sliders_marketId_createdAt_idx" ON "Sliders"("marketId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Discounts_market_startDate_endDate_idx" ON "Discounts"("market", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Orders_status_createdAt_idx" ON "Orders"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "FeatureRequests_createdAt_idx" ON "FeatureRequests"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comments_productId_createdAt_idx" ON "Comments"("productId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comments_rate_idx" ON "Comments"("rate");

-- CreateIndex
CREATE INDEX "Reactions_product_idx" ON "Reactions"("product");

-- CreateIndex
CREATE INDEX "Workers_userId_idx" ON "Workers"("userId");

-- CreateIndex
CREATE INDEX "Workers_vacancyId_idx" ON "Workers"("vacancyId");

-- CreateIndex
CREATE UNIQUE INDEX "Workers_marketId_userId_role_key" ON "Workers"("marketId", "userId", "role");

-- CreateIndex
CREATE INDEX "Vacancies_marketId_createdAt_idx" ON "Vacancies"("marketId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Warehouses_marketId_idx" ON "Warehouses"("marketId");

-- CreateIndex
CREATE INDEX "Categories_marketId_idx" ON "Categories"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_marketId_title_key" ON "Categories"("marketId", "title");

-- CreateIndex
CREATE INDEX "CategoryOptions_categoryId_idx" ON "CategoryOptions"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryOptionItems_optionId_idx" ON "CategoryOptionItems"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "Groups_url_key" ON "Groups"("url");

-- CreateIndex
CREATE INDEX "Groups_type_createdAt_idx" ON "Groups"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "GroupMembers_userId_idx" ON "GroupMembers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembers_groupId_userId_key" ON "GroupMembers"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupTopics_groupId_idx" ON "GroupTopics"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupTopics_groupId_url_key" ON "GroupTopics"("groupId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMemberTopicPermissions_memberId_topicId_key" ON "GroupMemberTopicPermissions"("memberId", "topicId");

-- CreateIndex
CREATE INDEX "GroupPermissions_userId_idx" ON "GroupPermissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPermissions_groupId_userId_permission_key" ON "GroupPermissions"("groupId", "userId", "permission");

-- CreateIndex
CREATE INDEX "GroupMessages_groupId_createdAt_idx" ON "GroupMessages"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupMessages_topicId_createdAt_idx" ON "GroupMessages"("topicId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupPins_topicId_idx" ON "GroupPins"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPins_groupId_messageId_key" ON "GroupPins"("groupId", "messageId");

-- CreateIndex
CREATE INDEX "Messages_group_createdAt_idx" ON "Messages"("group", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Messages_type_createdAt_idx" ON "Messages"("type", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "UserOtps" ADD CONSTRAINT "UserOtps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSessions" ADD CONSTRAINT "UserSessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogs" ADD CONSTRAINT "AuditLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followings" ADD CONSTRAINT "Followings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followings" ADD CONSTRAINT "Followings_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOptions" ADD CONSTRAINT "ProductOptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOptionItems" ADD CONSTRAINT "ProductOptionItems_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sliders" ADD CONSTRAINT "Sliders_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discounts" ADD CONSTRAINT "Discounts_market_fkey" FOREIGN KEY ("market") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_user_fkey" FOREIGN KEY ("user") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workers" ADD CONSTRAINT "Workers_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workers" ADD CONSTRAINT "Workers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workers" ADD CONSTRAINT "Workers_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancies" ADD CONSTRAINT "Vacancies_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouses" ADD CONSTRAINT "Warehouses_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categories" ADD CONSTRAINT "Categories_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOptions" ADD CONSTRAINT "CategoryOptions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOptionItems" ADD CONSTRAINT "CategoryOptionItems_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CategoryOptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembers" ADD CONSTRAINT "GroupMembers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembers" ADD CONSTRAINT "GroupMembers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTopics" ADD CONSTRAINT "GroupTopics_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberTopicPermissions" ADD CONSTRAINT "GroupMemberTopicPermissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "GroupMembers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberTopicPermissions" ADD CONSTRAINT "GroupMemberTopicPermissions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GroupTopics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPermissions" ADD CONSTRAINT "GroupPermissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPermissions" ADD CONSTRAINT "GroupPermissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessages" ADD CONSTRAINT "GroupMessages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessages" ADD CONSTRAINT "GroupMessages_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GroupTopics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessages" ADD CONSTRAINT "GroupMessages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPins" ADD CONSTRAINT "GroupPins_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPins" ADD CONSTRAINT "GroupPins_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GroupTopics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPins" ADD CONSTRAINT "GroupPins_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "GroupMessages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPins" ADD CONSTRAINT "GroupPins_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_group_fkey" FOREIGN KEY ("group") REFERENCES "Groups"("url") ON DELETE CASCADE ON UPDATE CASCADE;
