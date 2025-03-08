/*
  Warnings:

  - You are about to drop the column `paymentIntent` on the `Orders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Orders_paymentIntent_key";

-- AlterTable
ALTER TABLE "Orders" DROP COLUMN "paymentIntent",
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "notes" TEXT;
