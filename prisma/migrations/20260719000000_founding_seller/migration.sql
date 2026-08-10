-- Founding-seller promo (launch cohort). Grants Pro-tier perks + ranked
-- placement for free (no Stripe). foundingSeller lives on the seller; the
-- denormalized sellerFounding mirrors it onto each listing so cards/browse can
-- render the founding badge without a join (same pattern as sellerPro).

-- AlterTable
ALTER TABLE "User" ADD COLUMN "foundingSeller" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "sellerFounding" BOOLEAN NOT NULL DEFAULT false;
