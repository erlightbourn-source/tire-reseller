-- Admin bans that survive login/reset/purge. User.bannedAt marks a banned
-- account (the row is kept as the tombstone that blocks re-signup with the
-- same email); Listing.hiddenByAdmin marks listings hidden by a moderator so
-- the soft-delete reactivation path never unhides them. Both additive,
-- zero-downtime (nullable / default false).

-- AlterTable
ALTER TABLE "User" ADD COLUMN "bannedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "hiddenByAdmin" BOOLEAN NOT NULL DEFAULT false;
