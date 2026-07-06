import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { PurchaseDetail } from "@/types/models";
import { amountInWordsInr } from "@/lib/amount-in-words";
import { purchasePaymentModeLabel } from "@/lib/constants/payment-modes";
import { purchaseTypeLabel } from "@/lib/constants/supplier-types";
import { BRAND } from "@/lib/constants/brand";
import {
  formatPdfAddress,
  formatPdfDate,
  formatPdfQty,
  formatPdfRs,
} from "@/lib/pdf-format";

/** Full A4 voucher — ruled item lines like Tally accounting printouts. */
const FARMER_PAGE_TABLE_LINES = 14;
const GST_PAGE_TABLE_LINES = 20;
const TABLE_ROW_HEIGHT = 20;

const styles = StyleSheet.create({
  page: {
    padding: 14,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
    flexDirection: "column",
  },
  tallyFrame: {
    border: "1.5 solid #1f2937",
    flexDirection: "column",
    flex: 1,
    minHeight: "100%",
  },
  brandBar: {
    backgroundColor: "#0f766e",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  brandBarText: {
    color: "#ffffff",
    fontSize: 8.5,
    textAlign: "center",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  billTypePill: {
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 3,
    paddingVertical: 2,
    paddingHorizontal: 12,
    border: "1 solid #374151",
    borderRadius: 20,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  headerBlock: {
    paddingHorizontal: 10,
    paddingBottom: 6,
    borderBottom: "1 solid #9ca3af",
    alignItems: "center",
  },
  businessName: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  headerLine: {
    fontSize: 8.5,
    textAlign: "center",
    marginBottom: 1.5,
    color: "#374151",
  },
  metaRow: {
    flexDirection: "row",
    borderBottom: "1 solid #9ca3af",
  },
  metaCell: {
    flex: 1,
    padding: 6,
    borderRight: "1 solid #d1d5db",
  },
  metaCellLast: {
    flex: 1,
    padding: 6,
  },
  metaLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 2,
  },
  metaValue: { fontSize: 9 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottom: "1 solid #9ca3af",
    fontWeight: "bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e7eb",
    minHeight: TABLE_ROW_HEIGHT,
    alignItems: "center",
  },
  tableRowEmpty: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e7eb",
    height: TABLE_ROW_HEIGHT,
  },
  cell: { paddingVertical: 4, paddingHorizontal: 5 },
  colSl: { width: "6%", textAlign: "center" },
  colItem: { width: "38%" },
  colQty: { width: "16%", textAlign: "right" },
  colRate: { width: "16%", textAlign: "right" },
  colAmount: { width: "24%", textAlign: "right", borderLeft: "1 solid #e5e7eb" },
  colHsn: { width: "10%", textAlign: "center" },
  colGst: { width: "8%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    borderTop: "1 solid #9ca3af",
    backgroundColor: "#f9fafb",
    fontWeight: "bold",
    minHeight: 20,
    alignItems: "center",
  },
  billFooter: {
    borderTop: "1 solid #9ca3af",
    marginTop: "auto",
  },
  footerRow: {
    flexDirection: "row",
    borderBottom: "1 solid #d1d5db",
  },
  wordsBoxFull: {
    width: "100%",
    padding: 8,
  },
  wordsBoxSplit: {
    width: "58%",
    padding: 8,
    borderRight: "1 solid #d1d5db",
  },
  totalBox: {
    width: "42%",
    padding: 8,
  },
  wordsTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 3,
  },
  grandLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1 solid #374151",
    fontSize: 11,
    fontWeight: "bold",
  },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  signBlock: { width: "44%" },
  signLine: {
    borderTop: "1 solid #6b7280",
    marginTop: 28,
    paddingTop: 4,
    fontSize: 8.5,
    textAlign: "center",
  },
  signCaption: {
    fontSize: 7.5,
    textAlign: "center",
    marginTop: 2,
    color: "#4b5563",
  },
  poweredBy: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 4,
    borderTop: "1 solid #e5e7eb",
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 8.5,
  },
});

function isFarmerReceipt(purchaseType: string) {
  return purchaseType === "FARMER" || purchaseType === "UNREGISTERED";
}

function billTypeTitle(paymentMode: string) {
  if (paymentMode === "CREDIT") return "Credit Bill";
  if (paymentMode === "CHEQUE") return "Cheque Bill";
  return "Cash Bill";
}

function farmerBlankRowCount(itemCount: number) {
  return Math.max(2, FARMER_PAGE_TABLE_LINES - itemCount);
}

function gstBillBlankRowCount(itemCount: number) {
  return Math.max(12, GST_PAGE_TABLE_LINES - itemCount);
}

function EmptyTableRow() {
  return (
    <View style={styles.tableRowEmpty}>
      <Text style={[styles.cell, styles.colSl]}> </Text>
      <Text style={[styles.cell, styles.colItem]}> </Text>
      <Text style={[styles.cell, styles.colQty]}> </Text>
      <Text style={[styles.cell, styles.colRate]}> </Text>
      <Text style={[styles.cell, styles.colAmount]}> </Text>
    </View>
  );
}

function lineAmount(quantity: number, unitCost: number) {
  return Math.round(quantity * unitCost * 100) / 100;
}

function FarmerPurchaseReceipt({ purchase }: { purchase: PurchaseDetail }) {
  const business = purchase.business;
  const farmer = purchase.supplier;
  const addressLine = formatPdfAddress([
    business.address,
    business.city,
    business.state,
    business.pincode,
  ]);
  const computedTotal = purchase.items.reduce(
    (sum, item) => sum + lineAmount(item.quantity, item.unitCost),
    0,
  );
  const grandTotal = Math.round(computedTotal * 100) / 100 || purchase.total;
  const blankRowCount = farmerBlankRowCount(purchase.items.length);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.tallyFrame}>
        <View style={styles.headerBlock}>
          <Text style={styles.billTypePill}>{billTypeTitle(purchase.paymentMode ?? "CASH")}</Text>
          <Text style={styles.businessName}>{business.name}</Text>
          {business.tradeName && business.tradeName !== business.name && (
            <Text style={styles.headerLine}>({business.tradeName})</Text>
          )}
          {addressLine ? <Text style={styles.headerLine}>{addressLine}</Text> : null}
          {business.phone ? (
            <Text style={styles.headerLine}>Mobile: {business.phone}</Text>
          ) : null}
          {business.gstin ? (
            <Text style={styles.headerLine}>GSTIN: {business.gstin}</Text>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Bill No.</Text>
            <Text style={styles.metaValue}>{purchase.purchaseNumber}</Text>
          </View>
          <View style={styles.metaCellLast}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatPdfDate(purchase.billDate)}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>To, M/s. (Farmer / Kisan)</Text>
            <Text style={{ ...styles.metaValue, fontWeight: "bold" }}>{farmer.name}</Text>
            {farmer.village ? (
              <Text style={styles.metaValue}>Village: {farmer.village}</Text>
            ) : null}
            {farmer.phone ? (
              <Text style={styles.metaValue}>Mobile: {farmer.phone}</Text>
            ) : null}
          </View>
          <View style={styles.metaCellLast}>
            <Text style={styles.metaLabel}>Payment</Text>
            <Text style={styles.metaValue}>
              {purchase.paymentMode === "CASH"
                ? "Cash paid / Nakad"
                : purchase.paymentMode === "CREDIT"
                  ? "Udhar / Credit"
                  : "Cheque"}
            </Text>
            <Text style={{ ...styles.metaValue, marginTop: 3 }}>
              Status: {purchase.status}
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.colSl]}>Sl.</Text>
          <Text style={[styles.cell, styles.colItem]}>Particulars</Text>
          <Text style={[styles.cell, styles.colQty]}>Qty</Text>
          <Text style={[styles.cell, styles.colRate]}>Rate</Text>
          <Text style={[styles.cell, styles.colAmount]}>Amount</Text>
        </View>

        {purchase.items.map((item, index) => {
          const amount = lineAmount(item.quantity, item.unitCost);
          return (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colSl]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.colItem]}>{item.description}</Text>
              <Text style={[styles.cell, styles.colQty]}>
                {formatPdfQty(item.quantity, item.product?.unit ?? "kg")}
              </Text>
              <Text style={[styles.cell, styles.colRate]}>
                {item.unitCost.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={[styles.cell, styles.colAmount]}>{formatPdfRs(amount)}</Text>
            </View>
          );
        })}

        {Array.from({ length: blankRowCount }).map((_, index) => (
          <EmptyTableRow key={`blank-${index}`} />
        ))}

        <View style={styles.totalRow}>
          <Text style={[styles.cell, styles.colSl]} />
          <Text style={[styles.cell, styles.colItem]}>Total</Text>
          <Text style={[styles.cell, styles.colQty]} />
          <Text style={[styles.cell, styles.colRate]} />
          <Text style={[styles.cell, styles.colAmount]}>{formatPdfRs(grandTotal)}</Text>
        </View>

        <View style={styles.billFooter}>
          <View style={styles.footerRow}>
            <View style={styles.wordsBoxFull}>
              <Text style={styles.wordsTitle}>Rupees in words</Text>
              <Text style={{ fontSize: 9, lineHeight: 1.35 }}>
                {amountInWordsInr(grandTotal)}
              </Text>
              {purchase.notes ? (
                <Text style={{ marginTop: 6, fontSize: 8, color: "#4b5563" }}>
                  Note: {purchase.notes}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.signRow}>
            <View style={styles.signBlock}>
              <Text style={styles.signLine}>For {business.name}</Text>
              <Text style={styles.signCaption}>Buyer / Vyapari — Signature</Text>
            </View>
            <View style={styles.signBlock}>
              <Text style={styles.signLine}>{farmer.name}</Text>
              <Text style={styles.signCaption}>Farmer / Kisan — Signature</Text>
            </View>
          </View>

          <Text style={styles.poweredBy}>
            {BRAND.name} · {BRAND.pdfFooter}
          </Text>
        </View>
      </View>
    </Page>
  );
}

function GstEmptyTableRow({
  itemColWidth,
  showHsn,
  showGst,
}: {
  itemColWidth: string;
  showHsn: boolean;
  showGst: boolean;
}) {
  return (
    <View style={styles.tableRowEmpty}>
      <Text style={[styles.cell, styles.colSl]}> </Text>
      <Text style={[styles.cell, { width: itemColWidth }]}> </Text>
      {showHsn ? <Text style={[styles.cell, styles.colHsn]}> </Text> : null}
      <Text style={[styles.cell, styles.colQty]}> </Text>
      <Text style={[styles.cell, styles.colRate]}> </Text>
      {showGst ? <Text style={[styles.cell, styles.colGst]}> </Text> : null}
      <Text style={[styles.cell, { width: "16%", textAlign: "right" }]}> </Text>
    </View>
  );
}

function purchaseBillTitle(purchaseType: string) {
  if (purchaseType === "APMC_MANDI") return "Mandi Purchase Bill";
  if (purchaseType === "B2B") return "Tax Invoice — Purchase";
  return "Purchase Bill";
}

function partySectionLabel(purchaseType: string) {
  if (purchaseType === "APMC_MANDI") return "Mandi shop / Agent";
  return "Supplier";
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalLine}>
      <Text>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

function GstPurchaseBill({ purchase }: { purchase: PurchaseDetail }) {
  const business = purchase.business;
  const supplier = purchase.supplier;
  const isMandi = purchase.purchaseType === "APMC_MANDI";
  const showHsn = isMandi || purchase.purchaseType === "B2B";
  const showGst = purchase.taxAmount > 0 || purchase.purchaseType === "B2B";
  const itemColWidth = showGst ? (showHsn ? "26%" : "36%") : showHsn ? "36%" : "46%";
  const blankRowCount = gstBillBlankRowCount(purchase.items.length);
  const addressLine = formatPdfAddress([
    business.address,
    business.city,
    business.state,
    business.pincode,
  ]);

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.tallyFrame}>
        <View style={styles.brandBar}>
          <Text style={styles.brandBarText}>{purchaseBillTitle(purchase.purchaseType)}</Text>
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.businessName}>{business.name}</Text>
          {business.tradeName && business.tradeName !== business.name ? (
            <Text style={styles.headerLine}>({business.tradeName})</Text>
          ) : null}
          {addressLine ? <Text style={styles.headerLine}>{addressLine}</Text> : null}
          {business.phone ? <Text style={styles.headerLine}>Mobile: {business.phone}</Text> : null}
          {business.gstin ? <Text style={styles.headerLine}>GSTIN: {business.gstin}</Text> : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>{partySectionLabel(purchase.purchaseType)}</Text>
            <Text style={{ ...styles.metaValue, fontWeight: "bold" }}>{supplier.name}</Text>
            {supplier.gstin ? <Text style={styles.metaValue}>GSTIN: {supplier.gstin}</Text> : null}
            {isMandi && purchase.mandiShopNo ? (
              <Text style={styles.metaValue}>Shop no.: {purchase.mandiShopNo}</Text>
            ) : null}
            {!isMandi && supplier.village ? (
              <Text style={styles.metaValue}>Village: {supplier.village}</Text>
            ) : null}
            {supplier.phone ? <Text style={styles.metaValue}>Mobile: {supplier.phone}</Text> : null}
          </View>
          <View style={styles.metaCellLast}>
            <Text style={styles.metaLabel}>Bill details</Text>
            <Text style={styles.metaValue}>Bill no.: {purchase.purchaseNumber}</Text>
            <Text style={styles.metaValue}>Date: {formatPdfDate(purchase.billDate)}</Text>
            <Text style={styles.metaValue}>Type: {purchaseTypeLabel(purchase.purchaseType)}</Text>
            {isMandi && purchase.supplierInvoiceNo ? (
              <Text style={styles.metaValue}>I-Form no.: {purchase.supplierInvoiceNo}</Text>
            ) : null}
            {!isMandi && purchase.supplierInvoiceNo ? (
              <Text style={styles.metaValue}>Supplier bill: {purchase.supplierInvoiceNo}</Text>
            ) : null}
            <Text style={styles.metaValue}>
              Payment: {purchasePaymentModeLabel(purchase.paymentMode ?? "CASH")}
            </Text>
            {purchase.paymentMode === "CHEQUE" && purchase.chequeNumber ? (
              <Text style={styles.metaValue}>Cheque no.: {purchase.chequeNumber}</Text>
            ) : null}
            {isMandi && purchase.commissionRate != null ? (
              <Text style={styles.metaValue}>Commission: {purchase.commissionRate}%</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.colSl]}>Sl.</Text>
          <Text style={[styles.cell, { width: itemColWidth }]}>Particulars</Text>
          {showHsn ? <Text style={[styles.cell, styles.colHsn]}>HSN</Text> : null}
          <Text style={[styles.cell, styles.colQty]}>Qty</Text>
          <Text style={[styles.cell, styles.colRate]}>Rate</Text>
          {showGst ? <Text style={[styles.cell, styles.colGst]}>GST</Text> : null}
          <Text style={[styles.cell, { width: "16%", textAlign: "right" }]}>Amount</Text>
        </View>

        {purchase.items.map((item, index) => {
          const amount = lineAmount(item.quantity, item.unitCost);
          return (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.cell, styles.colSl]}>{index + 1}</Text>
              <Text style={[styles.cell, { width: itemColWidth }]}>{item.description}</Text>
              {showHsn ? (
                <Text style={[styles.cell, styles.colHsn]}>
                  {item.product?.hsnCode ?? "—"}
                </Text>
              ) : null}
              <Text style={[styles.cell, styles.colQty]}>
                {formatPdfQty(item.quantity, item.product?.unit ?? "kg")}
              </Text>
              <Text style={[styles.cell, styles.colRate]}>{formatPdfRs(item.unitCost)}</Text>
              {showGst ? (
                <Text style={[styles.cell, styles.colGst]}>{item.gstRate}%</Text>
              ) : null}
              <Text style={[styles.cell, { width: "16%", textAlign: "right" }]}>
                {formatPdfRs(amount)}
              </Text>
            </View>
          );
        })}

        {Array.from({ length: blankRowCount }).map((_, index) => (
          <GstEmptyTableRow
            key={`blank-${index}`}
            itemColWidth={itemColWidth}
            showHsn={showHsn}
            showGst={showGst}
          />
        ))}

        <View style={styles.totalRow}>
          <Text style={[styles.cell, styles.colSl]} />
          <Text style={[styles.cell, { width: itemColWidth, fontWeight: "bold" }]}>Total</Text>
          {showHsn ? <Text style={[styles.cell, styles.colHsn]} /> : null}
          <Text style={[styles.cell, styles.colQty]} />
          <Text style={[styles.cell, styles.colRate]} />
          {showGst ? <Text style={[styles.cell, styles.colGst]} /> : null}
          <Text style={[styles.cell, { width: "16%", textAlign: "right", fontWeight: "bold" }]}>
            {formatPdfRs(purchase.subtotal)}
          </Text>
        </View>

        <View style={styles.billFooter}>
          <View style={styles.footerRow}>
            <View style={styles.wordsBoxSplit}>
              <Text style={styles.wordsTitle}>Amount in words</Text>
              <Text style={{ fontSize: 9, lineHeight: 1.4 }}>{amountInWordsInr(purchase.total)}</Text>
              {purchase.notes ? (
                <Text style={{ marginTop: 4, fontSize: 8, color: "#4b5563" }}>
                  Note: {purchase.notes}
                </Text>
              ) : null}
            </View>
            <View style={styles.totalBox}>
              <TotalLine label="Subtotal" value={formatPdfRs(purchase.subtotal)} />
              {purchase.cgstAmount > 0 ? (
                <TotalLine label="CGST (input)" value={formatPdfRs(purchase.cgstAmount)} />
              ) : null}
              {purchase.sgstAmount > 0 ? (
                <TotalLine label="SGST (input)" value={formatPdfRs(purchase.sgstAmount)} />
              ) : null}
              {purchase.igstAmount > 0 ? (
                <TotalLine label="IGST (input)" value={formatPdfRs(purchase.igstAmount)} />
              ) : null}
              {purchase.taxAmount > 0 &&
              purchase.cgstAmount === 0 &&
              purchase.sgstAmount === 0 &&
              purchase.igstAmount === 0 ? (
                <TotalLine label="GST" value={formatPdfRs(purchase.taxAmount)} />
              ) : null}
              {purchase.commissionAmount > 0 ? (
                <TotalLine
                  label={`Mandi commission${purchase.commissionRate != null ? ` (${purchase.commissionRate}%)` : ""}`}
                  value={formatPdfRs(purchase.commissionAmount)}
                />
              ) : null}
              <View style={styles.grandLine}>
                <Text>Total Payable</Text>
                <Text>{formatPdfRs(purchase.total)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.signRow}>
            <View style={styles.signBlock}>
              <Text style={styles.signLine}>For {business.name}</Text>
              <Text style={styles.signCaption}>Buyer — Authorised Signature</Text>
            </View>
            <View style={styles.signBlock}>
              <Text style={styles.signLine}>{supplier.name}</Text>
              <Text style={styles.signCaption}>
                {isMandi ? "Mandi shop / Agent — Signature" : "Supplier — Signature"}
              </Text>
            </View>
          </View>

          <Text style={styles.poweredBy}>
            Computer-generated · {BRAND.name}
          </Text>
        </View>
      </View>
    </Page>
  );
}

export function PurchasePdfDocument({ purchase }: { purchase: PurchaseDetail }) {
  const farmerReceipt = isFarmerReceipt(purchase.purchaseType);

  return (
    <Document>
      {farmerReceipt ? (
        <FarmerPurchaseReceipt purchase={purchase} />
      ) : (
        <GstPurchaseBill purchase={purchase} />
      )}
    </Document>
  );
}
