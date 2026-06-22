import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { InvoiceDetail } from "@/lib/invoices";
import { amountInWordsInr } from "@/lib/amount-in-words";
import { BRAND } from "@/lib/constants/brand";
import { getBusinessTypeLabel } from "@/lib/constants/business-types";
import { splitGstTax, resolvePartyState } from "@/lib/gst";
import { formatEwayBillNumber } from "@/lib/eway-bill";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  border: {
    border: "1 solid #cbd5e1",
    flex: 1,
  },
  brandBar: {
    backgroundColor: "#0f766e",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  brandBarText: {
    color: "#ffffff",
    fontSize: 9,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderBottom: "1 solid #e2e8f0",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  companyLine: {
    fontSize: 8.5,
    color: "#374151",
    marginBottom: 2,
  },
  taxInvoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 8,
    borderBottom: "1 solid #e2e8f0",
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
  },
  metaBox: {
    flex: 1,
    padding: 10,
  },
  metaBoxRight: {
    flex: 1,
    padding: 10,
    borderLeft: "1 solid #e2e8f0",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#0f766e",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  metaLine: {
    marginBottom: 3,
    fontSize: 8.5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1 solid #cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: "bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e7eb",
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 8.5,
  },
  colSl: { width: "5%", textAlign: "center" },
  colItem: { width: "30%" },
  colHsn: { width: "10%", textAlign: "center" },
  colQty: { width: "8%", textAlign: "right" },
  colRate: { width: "12%", textAlign: "right" },
  colTaxable: { width: "13%", textAlign: "right" },
  colGst: { width: "8%", textAlign: "right" },
  colTax: { width: "14%", textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    borderTop: "1 solid #cbd5e1",
  },
  summaryLeft: {
    width: "55%",
    padding: 10,
    borderRight: "1 solid #e2e8f0",
  },
  summaryRight: {
    width: "45%",
    padding: 10,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 8.5,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1 solid #111827",
    fontSize: 10,
    fontWeight: "bold",
  },
  amountWords: {
    marginTop: 8,
    fontSize: 8.5,
    fontWeight: "bold",
  },
  hsnTable: {
    marginTop: 8,
    border: "1 solid #e2e8f0",
  },
  hsnHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 4,
    fontWeight: "bold",
    fontSize: 7.5,
  },
  hsnRow: {
    flexDirection: "row",
    padding: 4,
    fontSize: 7.5,
    borderTop: "1 solid #e5e7eb",
  },
  footer: {
    marginTop: 12,
    padding: 10,
    borderTop: "1 solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signBox: {
    alignItems: "flex-end",
  },
  footerNote: {
    fontSize: 7,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
});

function inr(amount: number) {
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPdfDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatAddress(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(", ");
}

export function InvoicePdfDocument({ invoice }: { invoice: InvoiceDetail }) {
  const business = invoice.business;
  const customer = invoice.customer;

  const displayName = business.tradeName?.trim() || business.name;
  const legalName =
    business.tradeName?.trim() && business.tradeName.trim() !== business.name
      ? business.name
      : null;
  const businessTagline = getBusinessTypeLabel(business.businessType);

  const placeOfSupply =
    resolvePartyState(customer.state, customer.gstin) ??
    customer.state ??
    "—";

  const gstSplit =
    invoice.cgstAmount > 0 || invoice.sgstAmount > 0 || invoice.igstAmount > 0
      ? {
          cgst: invoice.cgstAmount,
          sgst: invoice.sgstAmount,
          igst: invoice.igstAmount,
          isInterState: invoice.isInterState,
        }
      : splitGstTax(
          invoice.taxAmount,
          business.state,
          customer.state,
          business.gstin,
          customer.gstin,
        );

  const hsnSummary = new Map<
    string,
    { taxable: number; tax: number; gstRate: number }
  >();

  for (const item of invoice.items) {
    const hsn = item.product?.hsnCode ?? "—";
    const lineTax = item.total * (item.gstRate / 100);
    const existing = hsnSummary.get(hsn) ?? {
      taxable: 0,
      tax: 0,
      gstRate: item.gstRate,
    };
    hsnSummary.set(hsn, {
      taxable: existing.taxable + item.total,
      tax: existing.tax + lineTax,
      gstRate: item.gstRate,
    });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.companyName}>{displayName}</Text>
              {legalName && (
                <Text style={styles.companyLine}>{legalName}</Text>
              )}
              <Text style={styles.companyLine}>
                {formatAddress([
                  business.address,
                  business.city,
                  business.state,
                  business.pincode,
                ])}
              </Text>
              {business.phone && (
                <Text style={styles.companyLine}>Phone: {business.phone}</Text>
              )}
              {business.email && (
                <Text style={styles.companyLine}>Email: {business.email}</Text>
              )}
            </View>
            <View style={{ width: 120, alignItems: "flex-end" }}>
              {business.gstin && (
                <Text style={[styles.companyLine, { fontWeight: "bold" }]}>
                  GSTIN: {business.gstin}
                </Text>
              )}
              {business.pan && (
                <Text style={styles.companyLine}>PAN: {business.pan}</Text>
              )}
            </View>
          </View>

          <View style={styles.brandBar}>
            <Text style={styles.brandBarText}>{businessTagline}</Text>
          </View>

          <Text style={styles.taxInvoiceTitle}>
            {invoice.invoiceType === "B2C" ? "RETAIL TAX INVOICE" : "TAX INVOICE"}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <Text style={[styles.metaLine, { fontWeight: "bold", fontSize: 10 }]}>
                {customer.name}
              </Text>
              <Text style={styles.metaLine}>
                {formatAddress([
                  customer.address,
                  customer.city,
                  customer.state,
                ])}
              </Text>
              {customer.phone && (
                <Text style={styles.metaLine}>Phone: {customer.phone}</Text>
              )}
              {customer.gstin && (
                <Text style={styles.metaLine}>GSTIN: {customer.gstin}</Text>
              )}
              <Text style={styles.metaLine}>
                Place of Supply: {placeOfSupply}
              </Text>
            </View>

            <View style={styles.metaBoxRight}>
              <Text style={styles.sectionTitle}>Invoice Details</Text>
              <Text style={styles.metaLine}>
                Invoice No: {invoice.invoiceNumber}
              </Text>
              <Text style={styles.metaLine}>
                Invoice Date: {formatPdfDate(invoice.issueDate)}
              </Text>
              <Text style={styles.metaLine}>
                Due Date: {formatPdfDate(invoice.dueDate)}
              </Text>
              <Text style={styles.metaLine}>Type: {invoice.invoiceType}</Text>
              {invoice.ewayBillNumber && (
                <Text style={[styles.metaLine, { fontWeight: "bold" }]}>
                  E-way Bill: {formatEwayBillNumber(invoice.ewayBillNumber)}
                </Text>
              )}
              {invoice.transporterName && (
                <Text style={styles.metaLine}>
                  Transporter: {invoice.transporterName}
                </Text>
              )}
              {invoice.vehicleNumber && (
                <Text style={styles.metaLine}>
                  Vehicle: {invoice.vehicleNumber}
                </Text>
              )}
            </View>
          </View>

          {(invoice.dispatchPlace || invoice.deliveryPlace) && (
            <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
              {invoice.dispatchPlace && (
                <Text style={styles.metaLine}>
                  Dispatch From: {invoice.dispatchPlace}
                </Text>
              )}
              {invoice.deliveryPlace && (
                <Text style={styles.metaLine}>
                  Delivery To: {invoice.deliveryPlace}
                </Text>
              )}
            </View>
          )}

          <View style={styles.tableHeader}>
            <Text style={styles.colSl}>Sl.</Text>
            <Text style={styles.colItem}>Name of Product / Service</Text>
            <Text style={styles.colHsn}>HSN/SAC</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colTaxable}>Taxable</Text>
            <Text style={styles.colGst}>GST%</Text>
            <Text style={styles.colTax}>Tax</Text>
          </View>

          {invoice.items.map((item, index) => {
            const lineTax = item.total * (item.gstRate / 100);
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colSl}>{index + 1}</Text>
                <Text style={styles.colItem}>{item.description}</Text>
                <Text style={styles.colHsn}>{item.product?.hsnCode ?? "—"}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colRate}>{inr(item.unitPrice)}</Text>
                <Text style={styles.colTaxable}>{inr(item.total)}</Text>
                <Text style={styles.colGst}>{item.gstRate}%</Text>
                <Text style={styles.colTax}>{inr(lineTax)}</Text>
              </View>
            );
          })}

          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Text style={styles.sectionTitle}>Amount in Words</Text>
              <Text style={styles.amountWords}>
                {amountInWordsInr(invoice.total)}
              </Text>

              {invoice.notes && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.metaLine}>{invoice.notes}</Text>
                </View>
              )}

              <View style={styles.hsnTable}>
                <Text
                  style={{
                    padding: 4,
                    fontSize: 7.5,
                    fontWeight: "bold",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  HSN/SAC Tax Summary
                </Text>
                <View style={styles.hsnHeader}>
                  <Text style={{ width: "20%" }}>HSN/SAC</Text>
                  <Text style={{ width: "25%", textAlign: "right" }}>
                    Taxable
                  </Text>
                  <Text style={{ width: "15%", textAlign: "right" }}>Rate</Text>
                  <Text style={{ width: "20%", textAlign: "right" }}>
                    {gstSplit.isInterState ? "IGST" : "CGST+SGST"}
                  </Text>
                  <Text style={{ width: "20%", textAlign: "right" }}>
                    Total Tax
                  </Text>
                </View>
                {[...hsnSummary.entries()].map(([hsn, row]) => (
                  <View key={hsn} style={styles.hsnRow}>
                    <Text style={{ width: "20%" }}>{hsn}</Text>
                    <Text style={{ width: "25%", textAlign: "right" }}>
                      {inr(row.taxable)}
                    </Text>
                    <Text style={{ width: "15%", textAlign: "right" }}>
                      {row.gstRate}%
                    </Text>
                    <Text style={{ width: "20%", textAlign: "right" }}>
                      {inr(row.tax)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.summaryRight}>
              <View style={styles.totalLine}>
                <Text>Total Taxable Value</Text>
                <Text>{inr(invoice.subtotal)}</Text>
              </View>
              {gstSplit.isInterState ? (
                <View style={styles.totalLine}>
                  <Text>IGST</Text>
                  <Text>{inr(gstSplit.igst)}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.totalLine}>
                    <Text>CGST</Text>
                    <Text>{inr(gstSplit.cgst)}</Text>
                  </View>
                  <View style={styles.totalLine}>
                    <Text>SGST</Text>
                    <Text>{inr(gstSplit.sgst)}</Text>
                  </View>
                </>
              )}
              <View style={styles.totalLine}>
                <Text>Total Tax</Text>
                <Text>{inr(invoice.taxAmount)}</Text>
              </View>
              <View style={styles.grandTotal}>
                <Text>Grand Total</Text>
                <Text>{inr(invoice.total)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.metaLine}>
                Terms: Payment due by {formatPdfDate(invoice.dueDate)}.
              </Text>
              <Text style={styles.metaLine}>
                Subject to {business.state ?? "local"} jurisdiction.
              </Text>
            </View>
            <View style={styles.signBox}>
              <Text style={{ fontSize: 8.5, fontWeight: "bold" }}>
                For {displayName}
              </Text>
              <Text style={{ fontSize: 7.5, color: "#6b7280", marginTop: 20 }}>
                Authorised Signatory
              </Text>
            </View>
          </View>

          <Text style={styles.footerNote}>
            Computer-generated GST tax invoice via {BRAND.name}. {BRAND.pdfFooter}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
