const rand = (len: number) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

export const generateReference = (prefix = "TXN") => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${prefix}-${ymd}-${rand(8)}`;
};

export const generateAccountNumber = () => {
  let n = "";
  for (let i = 0; i < 12; i++) n += Math.floor(Math.random() * 10).toString();
  return n;
};

export const generateCustomerNo = (seq: number) => `CUS-${String(seq).padStart(6, "0")}`;
export const generateLoanNo = (year: number, seq: number) => `LN-${year}-${String(seq).padStart(6, "0")}`;
