-- AlterTable
ALTER TABLE "WikiItem" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "WikiItem" ADD CONSTRAINT "WikiItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
