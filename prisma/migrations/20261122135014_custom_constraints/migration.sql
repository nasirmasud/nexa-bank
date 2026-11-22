-- Custom constraints and ledger immutability guards
-- Source: docs/05_schema.md §3

ALTER TABLE "Account"
  ADD CONSTRAINT "balance_non_negative"
  CHECK ("balance" >= 0 OR "type" = 'SYSTEM');

ALTER TABLE "Transaction"
  ADD CONSTRAINT "amount_positive"
  CHECK ("amount" > 0);

ALTER TABLE "Transaction"
  ADD CONSTRAINT "fee_non_negative"
  CHECK ("fee" >= 0);

ALTER TABLE "DepositWithdrawRequest"
  ADD CONSTRAINT "no_self_review"
  CHECK ("reviewedById" IS NULL OR "reviewedById" <> "requesterId");

ALTER TABLE "Loan"
  ADD CONSTRAINT "no_self_approve"
  CHECK ("reviewedById" IS NULL OR "reviewedById" <> "applicantId");

-- Block deletes on immutable financial records
CREATE OR REPLACE FUNCTION prevent_financial_record_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'DELETE is not allowed on immutable financial records (%)', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "transaction_no_delete"
BEFORE DELETE ON "Transaction"
FOR EACH ROW
EXECUTE FUNCTION prevent_financial_record_delete();

CREATE TRIGGER "ledger_entry_no_delete"
BEFORE DELETE ON "LedgerEntry"
FOR EACH ROW
EXECUTE FUNCTION prevent_financial_record_delete();
