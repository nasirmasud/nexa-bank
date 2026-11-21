import { Decimal } from "decimal.js";

export const toDecimal = (value: string | number | Decimal) => new Decimal(value);

export const toMoneyString = (value: string | number | Decimal) =>
  toDecimal(value).toFixed(2);

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

export const isPositiveMoney = (value: string | number | Decimal) =>
  toDecimal(value).gt(0);

export const formatBDT = (value: string | number | Decimal) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toDecimal(value).toNumber());
