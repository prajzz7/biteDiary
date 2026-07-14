-- CreateTable
CREATE TABLE "DishImages" (
    "id" TEXT NOT NULL,
    "dishImageUrl" TEXT,
    "dishImagePublicUrl" TEXT,
    "dishId" TEXT NOT NULL,

    CONSTRAINT "DishImages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DishImages" ADD CONSTRAINT "DishImages_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE CASCADE ON UPDATE CASCADE;
