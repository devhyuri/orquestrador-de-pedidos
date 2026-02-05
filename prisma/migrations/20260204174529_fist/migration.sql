-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'ENQUEUED', 'PROCESSING_ENRICHMENT', 'ENRICHED', 'FAILED_ENRICHMENT');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "enrichment_data" JSONB,
    "error" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_idempotency_key_idx" ON "orders"("idempotency_key");
