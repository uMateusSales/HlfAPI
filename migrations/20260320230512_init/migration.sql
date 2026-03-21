-- CreateEnum
CREATE TYPE "ChartType" AS ENUM ('LINE', 'AREA', 'BAR', 'SCATTER');

-- CreateEnum
CREATE TYPE "AssetClass" AS ENUM ('STOCK', 'CRYPTO', 'FX', 'FIXED_INCOME', 'COMMODITY', 'INDEX', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "googleId" TEXT,
    "githubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "ticker" TEXT,
    "timeframe" TEXT,
    "assetClass" "AssetClass",
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ChartType" NOT NULL DEFAULT 'LINE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "analysis" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "studyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_points" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "close" DECIMAL(18,8) NOT NULL,
    "chartId" TEXT NOT NULL,

    CONSTRAINT "chart_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StudyTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "studies_slug_key" ON "studies"("slug");

-- CreateIndex
CREATE INDEX "studies_userId_idx" ON "studies"("userId");

-- CreateIndex
CREATE INDEX "studies_published_idx" ON "studies"("published");

-- CreateIndex
CREATE INDEX "studies_ticker_idx" ON "studies"("ticker");

-- CreateIndex
CREATE INDEX "charts_studyId_idx" ON "charts"("studyId");

-- CreateIndex
CREATE INDEX "chart_points_chartId_idx" ON "chart_points"("chartId");

-- CreateIndex
CREATE INDEX "chart_points_chartId_timestamp_idx" ON "chart_points"("chartId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_StudyTags_AB_unique" ON "_StudyTags"("A", "B");

-- CreateIndex
CREATE INDEX "_StudyTags_B_index" ON "_StudyTags"("B");

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charts" ADD CONSTRAINT "charts_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_points" ADD CONSTRAINT "chart_points_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudyTags" ADD CONSTRAINT "_StudyTags_A_fkey" FOREIGN KEY ("A") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudyTags" ADD CONSTRAINT "_StudyTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
