import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

type ReceiptTx = {
  reference: string;
  type: string;
  status: string;
  amount: string;
  fee: string;
  currency: string;
  description: string | null;
  createdAt: string | Date;
  completedAt: string | Date | null;
  fromAccount: { accountNumber: string } | null;
  toAccount: { accountNumber: string } | null;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica", color: "#111827" },
  title: { fontSize: 20, marginBottom: 4, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 20 },
  section: { marginBottom: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  label: { color: "#6b7280" },
  value: { fontWeight: 600 },
  footer: { marginTop: 24, fontSize: 9, color: "#6b7280" },
});

function mask(num: string) {
  return num.length > 4 ? `****${num.slice(-4)}` : num;
}

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US");
}

export function TransactionReceiptDocument({ tx }: { tx: ReceiptTx }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>NexaBank</Text>
          <Text style={styles.subtitle}>Transaction Receipt</Text>
        </View>
        <View style={styles.section}>
          <Row label="Reference" value={tx.reference} />
          <Row label="Type" value={tx.type} />
          <Row label="Status" value={tx.status} />
          <Row label="Amount" value={`${tx.amount} ${tx.currency}`} />
          <Row label="Fee" value={`${tx.fee} ${tx.currency}`} />
          <Row
            label="From account"
            value={tx.fromAccount ? mask(tx.fromAccount.accountNumber) : "—"}
          />
          <Row label="To account" value={tx.toAccount ? mask(tx.toAccount.accountNumber) : "—"} />
          <Row label="Created" value={fmtDate(tx.createdAt)} />
          <Row label="Completed" value={fmtDate(tx.completedAt)} />
          <Row label="Description" value={tx.description ?? "—"} />
        </View>
        <Text style={styles.footer}>This is a system-generated receipt from NexaBank.</Text>
      </Page>
    </Document>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
