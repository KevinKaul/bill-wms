-- AlterTable
ALTER TABLE "public"."process_orders" ADD COLUMN     "completionDate" TIMESTAMP(3),
ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "qualityStatus" TEXT,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "public"."purchase_orders" ADD COLUMN     "actualDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "expectedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "public"."suppliers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'material';

-- CreateTable
CREATE TABLE "public"."purchase_plans" (
    "id" TEXT NOT NULL,
    "planNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalEstimatedAmount" DECIMAL(10,2) NOT NULL,
    "remark" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_plan_items" (
    "id" TEXT NOT NULL,
    "purchasePlanId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "estimatedUnitPrice" DECIMAL(10,2) NOT NULL,
    "estimatedTotalPrice" DECIMAL(10,2) NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "capacity" DECIMAL(10,3),
    "capacityUnit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_adjustments" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "reason" TEXT NOT NULL,
    "remark" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_levels" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "reservedQuantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "availableQuantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "movementType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitCost" DECIMAL(10,2),
    "totalCost" DECIMAL(10,2),
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_plans_planNumber_key" ON "public"."purchase_plans"("planNumber");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "public"."locations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_levels_productId_locationId_batchId_key" ON "public"."inventory_levels"("productId", "locationId", "batchId");

-- AddForeignKey
ALTER TABLE "public"."purchase_plan_items" ADD CONSTRAINT "purchase_plan_items_purchasePlanId_fkey" FOREIGN KEY ("purchasePlanId") REFERENCES "public"."purchase_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_plan_items" ADD CONSTRAINT "purchase_plan_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."locations" ADD CONSTRAINT "locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
