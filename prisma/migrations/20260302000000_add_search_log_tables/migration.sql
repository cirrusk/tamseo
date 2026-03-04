-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "SearchEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "ipRaw" TEXT,
    "userAgentRaw" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "osName" TEXT,
    "browserName" TEXT,
    "districtCode" TEXT NOT NULL,
    "districtName" TEXT,
    "queries" JSONB NOT NULL,
    "normalizedQueries" JSONB NOT NULL,
    "queryCount" INTEGER NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "statusCode" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,

    CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchEventQuery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "original" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchEventQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRateLimit" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "ipHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SearchEvent_requestId_key" ON "SearchEvent"("requestId");

-- CreateIndex
CREATE INDEX "SearchEvent_createdAt_idx" ON "SearchEvent"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "SearchEvent_ipHash_createdAt_idx" ON "SearchEvent"("ipHash", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SearchEvent_deviceType_createdAt_idx" ON "SearchEvent"("deviceType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SearchEventQuery_normalized_createdAt_idx" ON "SearchEventQuery"("normalized", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SearchEventQuery_eventId_idx" ON "SearchEventQuery"("eventId");

-- CreateIndex
CREATE INDEX "DailyRateLimit_day_count_idx" ON "DailyRateLimit"("day", "count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyRateLimit_day_ipHash_key" ON "DailyRateLimit"("day", "ipHash");

-- AddForeignKey
ALTER TABLE "SearchEventQuery" ADD CONSTRAINT "SearchEventQuery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SearchEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

