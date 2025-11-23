-- AlterTable
ALTER TABLE `process_orders` MODIFY `paymentStatus` ENUM('UNPAID', 'PARTIAL_PAID', 'PAID') NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE `purchase_orders` ADD COLUMN `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    MODIFY `paymentStatus` ENUM('UNPAID', 'PARTIAL_PAID', 'PAID') NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE `suppliers` ADD COLUMN `bankAccount` VARCHAR(191) NULL,
    ADD COLUMN `bankName` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `purchase_order_payments` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseOrderId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paymentMethod` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `purchase_order_payments` ADD CONSTRAINT `purchase_order_payments_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
