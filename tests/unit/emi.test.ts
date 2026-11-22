import { describe, expect, it } from "vitest";
import { calculateEmi, generateInstallments } from "@/lib/emi";

describe("emi", () => {
  it("calculates EMI for standard rate", () => {
    const emi = calculateEmi(100000, 12, 12);
    expect(emi.toFixed(2)).toBe("8884.88");
  });

  it("handles zero interest rate", () => {
    const emi = calculateEmi(1200, 0, 12);
    expect(emi.toFixed(2)).toBe("100.00");
  });

  it("generates installment schedule with final balance adjustment", () => {
    const schedule = generateInstallments({
      principal: 1000,
      annualRatePercent: 12,
      months: 3,
      startDate: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(schedule.items).toHaveLength(3);
    expect(schedule.items[0].number).toBe(1);
    expect(schedule.items[2].number).toBe(3);

    const totalPrincipal = schedule.items.reduce((a, i) => a + Number(i.principal), 0);
    const totalInterest = schedule.items.reduce((a, i) => a + Number(i.interest), 0);
    const totalAmount = schedule.items.reduce((a, i) => a + Number(i.amount), 0);

    expect(totalPrincipal).toBeCloseTo(1000, 2);
    expect(totalAmount).toBeCloseTo(totalPrincipal + totalInterest, 2);
    // last installment should leave no remaining principal due to adjustment
    expect(Number(schedule.items[2].principal)).toBeGreaterThan(0);
  });
});
