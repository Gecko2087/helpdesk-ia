-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "sandboxId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "sandboxId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Sandbox" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "mutations" INTEGER NOT NULL DEFAULT 0,
    "analyses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sandbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoBudget" (
    "id" TEXT NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DemoBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sandbox_expiresAt_idx" ON "Sandbox"("expiresAt");

-- CreateIndex
CREATE INDEX "Ticket_sandboxId_createdAt_idx" ON "Ticket"("sandboxId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_sandboxId_name_key" ON "Category"("sandboxId", "name");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_sandboxId_fkey" FOREIGN KEY ("sandboxId") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_sandboxId_fkey" FOREIGN KEY ("sandboxId") REFERENCES "Sandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;
