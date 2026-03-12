-- AlterTable
ALTER TABLE "OrderMessage" ADD COLUMN     "attachmentUrl" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "orderId" TEXT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
