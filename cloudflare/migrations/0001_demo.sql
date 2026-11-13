CREATE TABLE "Sandbox" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "mutations" INTEGER NOT NULL DEFAULT 0,
    "analyses" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "DemoBudget" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "analyses" INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "Category" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "sandboxId" TEXT NOT NULL REFERENCES "Sandbox"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "responsibleArea" TEXT NOT NULL,
    "active" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL
);

CREATE TABLE "Ticket" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "sandboxId" TEXT NOT NULL REFERENCES "Sandbox"("id") ON DELETE CASCADE,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterArea" TEXT NOT NULL,
    "sourceChannel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "categoryId" INTEGER,
    "aiStatus" TEXT NOT NULL DEFAULT 'not_analyzed',
    "aiProvider" TEXT,
    "aiConfidence" TEXT,
    "summary" TEXT,
    "possibleCause" TEXT,
    "responsibleArea" TEXT,
    "suggestedReply" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TEXT NOT NULL,
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL
);

CREATE TABLE "SuggestedStep" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "ticketId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE
);

CREATE TABLE "TicketNote" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "ticketId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE
);

CREATE TABLE "TicketEvent" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "ticketId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE
);

CREATE INDEX "Sandbox_expiresAt_idx" ON "Sandbox"("expiresAt");
CREATE UNIQUE INDEX "Category_sandboxId_name_key" ON "Category"("sandboxId","name");
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");
CREATE INDEX "Ticket_sandboxId_createdAt_idx" ON "Ticket"("sandboxId","createdAt");
CREATE INDEX "SuggestedStep_ticketId_idx" ON "SuggestedStep"("ticketId");
CREATE INDEX "TicketNote_ticketId_idx" ON "TicketNote"("ticketId");
CREATE INDEX "TicketEvent_ticketId_idx" ON "TicketEvent"("ticketId");
