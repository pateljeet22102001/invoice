import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ChallanDetail } from "@/lib/challans";
import { BRAND } from "@/lib/constants/brand";
import { formatEwayBillNumber } from "@/lib/eway-bill";
import { getChallanPurposeLabel } from "@/lib/constants/challan";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: {
    marginBottom: 20,
    borderBottom: "1 solid #ddd",
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: { fontSize: 11, color: "#444", marginBottom: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 16,
  },
  box: { flex: 1 },
  boxTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#666",
    marginBottom: 6,
  },
  table: { marginTop: 8, border: "1 solid #ddd" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottom: "1 solid #ddd",
    padding: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #eee",
    padding: 6,
  },
  colItem: { width: "50%" },
  colHsn: { width: "25%" },
  colQty: { width: "25%", textAlign: "right" },
  footer: { marginTop: 24, fontSize: 8, color: "#666" },
  notice: {
    marginTop: 16,
    padding: 8,
    backgroundColor: "#fffbeb",
    fontSize: 9,
    color: "#92400e",
  },
});

function formatPdfDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function ChallanPdfDocument({ challan }: { challan: ChallanDetail }) {
  const business = challan.business;
  const customer = challan.customer;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>DELIVERY CHALLAN</Text>
          <Text style={styles.subtitle}>{business.name}</Text>
          {business.gstin && (
            <Text style={styles.subtitle}>GSTIN: {business.gstin}</Text>
          )}
          {challan.ewayBillNumber && (
            <Text style={{ fontSize: 12, fontWeight: "bold", marginTop: 6, color: "#065f46" }}>
              E-way Bill (Govt.): {formatEwayBillNumber(challan.ewayBillNumber)}
            </Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Sent To</Text>
            <Text>{customer.name}</Text>
            {customer.gstin && <Text>GSTIN: {customer.gstin}</Text>}
            {(customer.address || customer.city || customer.state) && (
              <Text>
                {[customer.address, customer.city, customer.state]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Challan Details</Text>
            <Text>Challan No: {challan.challanNumber}</Text>
            <Text>Date: {formatPdfDate(challan.issueDate)}</Text>
            <Text>Purpose: {getChallanPurposeLabel(challan.purpose)}</Text>
            <Text>Status: {challan.status}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Description of Goods</Text>
            <Text style={styles.colHsn}>HSN</Text>
            <Text style={styles.colQty}>Quantity</Text>
          </View>
          {challan.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colItem}>{item.description}</Text>
              <Text style={styles.colHsn}>
                {item.hsnCode ?? item.product?.hsnCode ?? "—"}
              </Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
            </View>
          ))}
        </View>

        {(challan.dispatchPlace ||
          challan.deliveryPlace ||
          challan.vehicleNumber ||
          challan.transporterName ||
          challan.ewayBillNumber) && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.boxTitle}>Transport Details</Text>
            {challan.dispatchPlace && (
              <Text>Dispatch From: {challan.dispatchPlace}</Text>
            )}
            {challan.deliveryPlace && (
              <Text>Delivery To: {challan.deliveryPlace}</Text>
            )}
            {challan.vehicleNumber && (
              <Text>Vehicle: {challan.vehicleNumber}</Text>
            )}
            {challan.transporterName && (
              <Text>Transporter: {challan.transporterName}</Text>
            )}
            {challan.transporterGstin && (
              <Text>Transporter GSTIN: {challan.transporterGstin}</Text>
            )}
            {challan.ewayBillNumber && (
              <Text>E-way Bill: {challan.ewayBillNumber}</Text>
            )}
          </View>
        )}

        {challan.notes && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.boxTitle}>Notes</Text>
            <Text>{challan.notes}</Text>
          </View>
        )}

        <View style={styles.notice}>
          <Text>
            This is a delivery challan for movement of goods only. It is NOT a tax
            invoice. No GST (CGST/SGST/IGST) is applicable unless a separate tax
            invoice is issued.
          </Text>
        </View>

        <Text style={styles.footer}>
          Computer-generated delivery challan from {BRAND.pdfFooter}.
        </Text>
      </Page>
    </Document>
  );
}
