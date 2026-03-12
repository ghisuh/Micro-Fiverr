/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Gig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Gig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gig" ADD COLUMN     "faqs" JSONB,
ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "GigPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "deliveryDays" INTEGER NOT NULL,
    "revisions" INTEGER,
    "gigId" TEXT NOT NULL,

    CONSTRAINT "GigPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gig_slug_key" ON "Gig"("slug");

-- AddForeignKey
ALTER TABLE "GigPackage" ADD CONSTRAINT "GigPackage_gigId_fkey" FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
