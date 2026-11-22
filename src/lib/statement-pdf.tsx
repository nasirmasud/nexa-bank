import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

type StatementTx = {
  reference: string;
  type: string;
  status: string;
  amount: string;
  fee: string;
  currency: string;
  createdAt: string | Date;
  description: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  title: { fontSize: 18, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 12 },
  meta: { marginBottom: 10, fontSize: 9, color: "#374151" },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    paddingBottom: 4,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 3,
  },
  cDate: { width: "18%" },
  cRef: { width: "22%" },
  cType: { width: "15%" },
  cStatus: { width: "13%" },
  cAmt: { width: "16%", textAlign: "right" },
  cFee: { width: "16%", textAlign: "right" },
  footer: { marginTop: 16, fontSize: 8, color: "#6b7280" },
});

function mask(num: string) {
  return num.length > 4 ? `****${num.slice(-4)}` : num;
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US");
}

export function StatementDocument({
  accountNumber,
  from,
  to,
  transactions,
}: {
  accountNumber: string;
  from: Date | null;
  to: Date | null;
  transactions: StatementTx[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>NexaBank</Text>
        <Text style={styles.subtitle}>Account Statement</Text>
        <Text style={styles.meta}>Account: {mask(accountNumber)}</Text>
        <Text style={styles.meta}>
          Period: {from ? fmt(from) : "Start"} - {to ? fmt(to) : "Now"}
        </Text>
        <View style={styles.tableHead}>
          <Text style={styles.cDate}>Date</Text>
          <Text style={styles.cRef}>Reference</Text>
          <Text style={styles.cType}>Type</Text>
          <Text style={styles.cStatus}>Status</Text>
          <Text style={styles.cAmt}>Amount</Text>
          <Text style={styles.cFee}>Fee</Text>
        </View>
        {transactions.map((t) => (
          <View key={t.reference + String(t.createdAt)} style={styles.row}>
            <Text style={styles.cDate}>{fmt(t.createdAt)}</Text>
            <Text style={styles.cRef}>{t.reference}</Text>
            <Text style={styles.cType}>{t.type}</Text>
            <Text style={styles.cStatus}>{t.status}</Text>
            <Text style={styles.cAmt}>
              {t.amount} {t.currency}
            </Text>
            <Text style={styles.cFee}>{t.fee}</Text>
          </View>
        ))}
        <Text style={styles.footer}>Generated {new Date().toLocaleString("en-US")} · NexaBank</Text>
      </Page>
    </Document>
  );
}
