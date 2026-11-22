import { toDecimal } from "./money";

export function calculateEmi(
  principal: number | string,
  annualRatePercent: number | string,
  months: number,
) {
  const P = toDecimal(principal);
  const annual = toDecimal(annualRatePercent);
  const n = months;
  if (n <= 0) throw new Error("months must be > 0");
  const r = annual.div(12).div(100); // monthly rate
  if (r.lte(0)) return P.div(n).toDecimalPlaces(2);
  const onePlusRPowerN = r.add(1).pow(n);
  const emi = P.mul(r).mul(onePlusRPowerN).div(onePlusRPowerN.sub(1));
  return emi.toDecimalPlaces(2);
}

export function generateInstallments(params: {
  principal: number | string;
  annualRatePercent: number | string;
  months: number;
  startDate: Date;
}) {
  const P = toDecimal(params.principal);
  const r = toDecimal(params.annualRatePercent).div(12).div(100);
  const emi = calculateEmi(params.principal, params.annualRatePercent, params.months);
  let balance = P;
  const items: Array<{
    number: number;
    dueDate: Date;
    principal: string;
    interest: string;
    amount: string;
  }> = [];

  for (let i = 1; i <= params.months; i++) {
    const interest = balance.mul(r).toDecimalPlaces(2);
    let principalPart = emi.sub(interest);
    if (i === params.months || principalPart.gt(balance)) principalPart = balance;
    const amount = principalPart.add(interest).toDecimalPlaces(2);
    balance = balance.sub(principalPart);
    const dueDate = new Date(params.startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    items.push({
      number: i,
      dueDate,
      principal: principalPart.toDecimalPlaces(2).toFixed(2),
      interest: interest.toFixed(2),
      amount: amount.toFixed(2),
    });
  }

  return { emi: emi.toFixed(2), items };
}
