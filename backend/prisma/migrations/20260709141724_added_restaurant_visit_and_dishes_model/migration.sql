/*
  Warnings:

  - You are about to drop the column `rating` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `visitedAt` on the `Restaurant` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Restaurant" DROP CONSTRAINT "Restaurant_userId_fkey";

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "rating",
DROP COLUMN "visitedAt";

-- CreateTable
CREATE TABLE "RestaurantVisit" (
    "id" TEXT NOT NULL,
    "visitNotes" TEXT,
    "rating" DOUBLE PRECISION,
    "visitedAt" TIMESTAMP(3),
    "totalAmountPaid" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RestaurantVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "notes" TEXT,
    "wouldEatAgain" BOOLEAN NOT NULL DEFAULT false,
    "restaurantVisitId" TEXT NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestaurantVisit_restaurantId_idx" ON "RestaurantVisit"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantVisit_userId_idx" ON "RestaurantVisit"("userId");

-- CreateIndex
CREATE INDEX "RestaurantVisit_visitedAt_idx" ON "RestaurantVisit"("visitedAt");

-- CreateIndex
CREATE INDEX "RestaurantVisit_userId_visitedAt_idx" ON "RestaurantVisit"("userId", "visitedAt");

-- CreateIndex
CREATE INDEX "RestaurantVisit_restaurantId_visitedAt_idx" ON "RestaurantVisit"("restaurantId", "visitedAt");

-- CreateIndex
CREATE INDEX "Dish_restaurantVisitId_idx" ON "Dish"("restaurantVisitId");

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantVisit" ADD CONSTRAINT "RestaurantVisit_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantVisit" ADD CONSTRAINT "RestaurantVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_restaurantVisitId_fkey" FOREIGN KEY ("restaurantVisitId") REFERENCES "RestaurantVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
