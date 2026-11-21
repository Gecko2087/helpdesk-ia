CREATE TABLE "TicketAnalysis" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "sandboxId" TEXT NOT NULL REFERENCES "Sandbox"("id") ON DELETE CASCADE,
    "inputHash" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL
);

CREATE INDEX "TicketAnalysis_sandboxId_idx" ON "TicketAnalysis"("sandboxId");
ALTER TABLE "Ticket" ADD COLUMN "analysisId" TEXT REFERENCES "TicketAnalysis"("id") ON DELETE SET NULL;
CREATE UNIQUE INDEX "Ticket_analysisId_key" ON "Ticket"("analysisId");
ALTER TABLE "TicketEvent" ADD COLUMN "details" TEXT;
