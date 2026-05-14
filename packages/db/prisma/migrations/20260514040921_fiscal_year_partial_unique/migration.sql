-- Only one FiscalYear may have is_current = true at a time.
CREATE UNIQUE INDEX "one_current_fy" ON "FiscalYear" ("isCurrent") WHERE "isCurrent" = true;
