import { Decimal } from "decimal.js";

export const toDecimal = (value: string | number | Decimal) => new Decimal(value);

export const toMoneyString = (value: string | number | Decimal) => toDecimal(value).toFixed(2);

export const addMoney = (a: string | number | Decimal, b: string | number | Decimal) =>
  toDecimal(a).add(toDecimal(b));

export const subMoney = (a: string | number | Decimal, b: string | number | Decimal) =>
  toDecimal(a).sub(toDecimal(b));

export const mulMoney = (a: string | number | Decimal, b: string | number | Decimal) =>
  toDecimal(a).mul(toDecimal(b));

export const gteMoney = (a: string | number | Decimal, b: string | number | Decimal) =>
  toDecimal(a).gte(toDecimal(b));

export const gtMoney = (a: string | number | Decimal, b: string | number | Decimal) =>
  toDecimal(a).gt(toDecimal(b));

export const isPositiveMoney = (value: string | number | Decimal) => toDecimal(value).gt(0);

export const formatBDT = (value: string | number | Decimal) => {
  const amount = toDecimal(value).toNumber();
  const formatted = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${amount < 0 ? "-" : ""}৳${formatted}`;
};

export const calcTransferFee = (
  amount: string | number | Decimal,
  feePercent: string | number | Decimal,
  minFee: string | number | Decimal,
) => {
  const percentFee = toDecimal(amount).mul(toDecimal(feePercent)).div(100);
  const min = toDecimal(minFee);
  return Decimal.max(percentFee, min).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
};
