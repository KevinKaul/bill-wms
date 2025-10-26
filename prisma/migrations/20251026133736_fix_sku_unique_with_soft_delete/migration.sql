/*
  Warnings:

  - A unique constraint covering the columns `[sku,deletedAt]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `products_sku_key` ON `products`;

-- CreateIndex
CREATE UNIQUE INDEX `products_sku_deletedAt_key` ON `products`(`sku`, `deletedAt`);
