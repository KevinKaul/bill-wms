/*
  Warnings:

  - You are about to drop the column `bankAccount` on the `suppliers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `suppliers` DROP COLUMN `bankAccount`,
    ADD COLUMN `accountName` VARCHAR(191) NULL;
