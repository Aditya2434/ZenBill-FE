import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Invoice, CompanyProfile } from "../../types";

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 8, fontFamily: "Helvetica", color: "#000" },
  container: { borderWidth: 1, borderColor: "#000", flex: 1 },
  row: { flexDirection: "row" },
  col: { flexDirection: "column" },
  borderBottom: { borderBottomWidth: 1, borderColor: "#000" },
  borderRight: { borderRightWidth: 1, borderColor: "#000" },
  borderTop: { borderTopWidth: 1, borderColor: "#000" },
  bold: { fontWeight: "bold" },
  textCenter: { textAlign: "center" },
  textRight: { textAlign: "right" },
  p4: { padding: 4 },
  p2: { padding: 2 },
  muted: { color: "#444" },
  label: { fontSize: 7, color: "#444", marginBottom: 2 },
  value: { fontWeight: "bold", fontSize: 8 },
  tableHeader: { backgroundColor: "#f0f0f0", textAlign: "center", fontWeight: "bold" },
});

// Helper Functions
function formatCurrencyINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function numberToWordsINR(num: number): string {
  const a = ["", "ONE ", "TWO ", "THREE ", "FOUR ", "FIVE ", "SIX ", "SEVEN ", "EIGHT ", "NINE ", "TEN ", "ELEVEN ", "TWELVE ", "THIRTEEN ", "FOURTEEN ", "FIFTEEN ", "SIXTEEN ", "SEVENTEEN ", "EIGHTEEN ", "NINETEEN "];
  const b = ["", "", "TWENTY ", "THIRTY ", "FORTY ", "FIFTY ", "SIXTY ", "SEVENTY ", "EIGHTY ", "NINETY "];

  const [integerPartStr] = num.toFixed(2).split(".");
  let n = parseInt(integerPartStr, 10);
  if (n === 0) return "ZERO RUPEES ONLY.";
  if (n > 999999999) return "NUMBER TOO LARGE";

  const inWords = (val: number, suffix: string) => {
    let str = "";
    if (val > 19) {
      str += b[Math.floor(val / 10)] + a[val % 10];
    } else {
      str += a[val];
    }
    if (val !== 0) {
      str += suffix;
    }
    return str;
  };

  let res = "";
  res += inWords(Math.floor(n / 10000000), "CRORE ");
  n %= 10000000;
  res += inWords(Math.floor(n / 100000), "LAKH ");
  n %= 100000;
  res += inWords(Math.floor(n / 1000), "THOUSAND ");
  n %= 1000;
  res += inWords(Math.floor(n / 100), "HUNDRED ");
  n %= 100;
  if (n > 0 && res.trim() !== "") {
    res += "AND ";
  }
  res += inWords(n, "");
  return res.trim().replace(/\s\s+/g, " ") + " RUPEES ONLY.";
}

export default function TemplateTwo({ invoice, profile }: { invoice: Invoice; profile: CompanyProfile }) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          
          {/* 1. Top Header - Company Details & QR */}
          <View style={[styles.row, styles.borderBottom]}>
            <View style={[{ width: "50%" }, styles.p4, styles.borderRight]}>
              {profile.logo && <Image src={profile.logo} style={{ width: 60, height: 60, objectFit: "contain", marginBottom: 4 }} />}
              <Text style={[styles.bold, { fontSize: 12, marginBottom: 2 }]}>{profile.companyName}</Text>
              <Text>{profile.companyAddress}</Text>
              <Text>State: {profile.companyState} | Code: {profile.companyStateCode}</Text>
              <Text>Email: {profile.email || ""}</Text>
              <Text style={{ marginTop: 2 }}>PAN No.: <Text style={styles.bold}>{profile.pan}</Text></Text>
              <Text>GSTIN: <Text style={styles.bold}>{profile.gstin}</Text></Text>
            </View>
            <View style={[{ width: "50%" }, styles.p4, { alignItems: "flex-end" }]}>
               <Text style={[styles.bold, { fontSize: 16 }]}>TAX INVOICE</Text>
               <View style={{ width: 60, height: 60, borderWidth: 1, borderColor: "#000", marginTop: 10, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: "#aaa" }}>QR CODE</Text>
               </View>
            </View>
          </View>

          {/* 2. Grid Section - Addresses & Invoice Meta Data */}
          <View style={[styles.row, styles.borderBottom]}>
            {/* Left Side: Ship To & Bill To */}
            <View style={[{ width: "50%" }, styles.col, styles.borderRight]}>
              <View style={[styles.p4, styles.borderBottom, { minHeight: 80 }]}>
                <Text style={styles.label}>Consignee (Ship to)</Text>
                <Text style={styles.value}>{invoice.shippingDetails?.name || invoice.client.name}</Text>
                <Text>{invoice.shippingDetails?.address || invoice.client.address}</Text>
                <Text>State: {invoice.shippingDetails?.state || invoice.client.state} | Code: {invoice.shippingDetails?.stateCode || invoice.client.stateCode}</Text>
                <Text>GSTIN: {invoice.shippingDetails?.gstin || invoice.client.gstin}</Text>
              </View>
              <View style={[styles.p4, { minHeight: 80 }]}>
                <Text style={styles.label}>Buyer (Bill to)</Text>
                <Text style={styles.value}>{invoice.client.name}</Text>
                <Text>{invoice.client.address}</Text>
                <Text>State: {invoice.client.state} | Code: {invoice.client.stateCode}</Text>
                <Text>GSTIN: {invoice.client.gstin}</Text>
              </View>
            </View>

            {/* Right Side: Tally-style Invoice Details Grid */}
            <View style={[{ width: "50%" }, styles.col]}>
              <View style={[styles.row, styles.borderBottom]}>
                <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                  <Text style={styles.label}>Invoice No.</Text>
                  <Text style={styles.value}>{invoice.invoiceNumber}</Text>
                </View>
                <View style={[{ width: "50%" }, styles.p4]}>
                  <Text style={styles.label}>Dated</Text>
                  <Text style={styles.value}>{invoice.issueDate}</Text>
                </View>
              </View>
              <View style={[styles.row, styles.borderBottom]}>
                <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                  <Text style={styles.label}>Delivery Note</Text>
                  <Text style={styles.value}>{invoice.grLrNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, styles.p4]}>
                  <Text style={styles.label}>Mode/Terms of Payment</Text>
                  <Text style={styles.value}>-</Text>
                </View>
              </View>
              <View style={[styles.row, styles.borderBottom]}>
                <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                  <Text style={styles.label}>Buyer's Order No.</Text>
                  <Text style={styles.value}>{invoice.orderNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, styles.p4]}>
                  <Text style={styles.label}>Dated</Text>
                  <Text style={styles.value}>-</Text>
                </View>
              </View>
              <View style={[styles.row, styles.borderBottom]}>
                <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                  <Text style={styles.label}>Dispatch Doc No.</Text>
                  <Text style={styles.value}>-</Text>
                </View>
                <View style={[{ width: "50%" }, styles.p4]}>
                  <Text style={styles.label}>Delivery Note Date</Text>
                  <Text style={styles.value}>-</Text>
                </View>
              </View>
              <View style={[styles.row, styles.borderBottom]}>
                <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                  <Text style={styles.label}>Dispatched through</Text>
                  <Text style={styles.value}>{invoice.transportMode || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, styles.p4]}>
                  <Text style={styles.label}>Destination</Text>
                  <Text style={styles.value}>{invoice.placeOfSupply || "-"}</Text>
                </View>
              </View>
              <View style={[styles.row, styles.borderBottom]}>
                <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                  <Text style={styles.label}>Bill of Lading/LR-RR No.</Text>
                  <Text style={styles.value}>{invoice.grLrNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, styles.p4]}>
                  <Text style={styles.label}>Motor Vehicle No.</Text>
                  <Text style={styles.value}>{invoice.vehicleNo || "-"}</Text>
                </View>
              </View>
              <View style={[styles.p4, { flex: 1 }]}>
                <Text style={styles.label}>Terms of Delivery</Text>
                <Text style={styles.value}>{invoice.termsAndConditions || "-"}</Text>
              </View>
            </View>
          </View>

          {/* 3. Table Header Row */}
          <View style={[styles.row, styles.borderBottom, styles.tableHeader]}>
            <View style={[{ width: "5%" }, styles.borderRight, styles.p4]}><Text>SI No.</Text></View>
            <View style={[{ width: "35%" }, styles.borderRight, styles.p4]}><Text>Description of Goods</Text></View>
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4]}><Text>HSN/SAC</Text></View>
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4]}><Text>Quantity</Text></View>
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4]}><Text>Rate</Text></View>
            <View style={[{ width: "8%" }, styles.borderRight, styles.p4]}><Text>per</Text></View>
            <View style={[{ width: "16%" }, styles.p4]}><Text>Amount</Text></View>
          </View>

          {/* 4. Table Body (Vertical Columns keep borders extending seamlessly) */}
          <View style={[styles.row, styles.borderBottom, { minHeight: 220 }]}>
            {/* SI No */}
            <View style={[{ width: "5%" }, styles.borderRight, styles.p4, styles.textCenter]}>
              {invoice.items.map((_, i) => <Text key={i} style={{ marginBottom: 4 }}>{i + 1}</Text>)}
            </View>
            {/* Description */}
            <View style={[{ width: "35%" }, styles.borderRight, styles.p4]}>
              {invoice.items.map((item, i) => <Text key={i} style={[styles.bold, { marginBottom: 4 }]}>{item.description}</Text>)}
              <View style={{ marginTop: 20 }}>
                 {cgstAmount > 0 && <Text style={[styles.textRight, styles.bold]}>CGST:</Text>}
                 {sgstAmount > 0 && <Text style={[styles.textRight, styles.bold]}>SGST:</Text>}
                 {igstAmount > 0 && <Text style={[styles.textRight, styles.bold]}>IGST:</Text>}
              </View>
            </View>
            {/* HSN/SAC */}
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4, styles.textCenter]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{item.hsnCode || "-"}</Text>)}
            </View>
            {/* Quantity */}
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4, styles.textRight]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{item.quantity}</Text>)}
            </View>
            {/* Rate */}
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4, styles.textRight]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{formatCurrencyINR(item.unitPrice)}</Text>)}
            </View>
            {/* per */}
            <View style={[{ width: "8%" }, styles.borderRight, styles.p4, styles.textCenter]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{item.uom || "-"}</Text>)}
            </View>
            {/* Amount */}
            <View style={[{ width: "16%" }, styles.p4, styles.textRight]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{formatCurrencyINR(item.quantity * item.unitPrice)}</Text>)}
              <View style={{ marginTop: 20 }}>
                 {cgstAmount > 0 && <Text>{formatCurrencyINR(cgstAmount)}</Text>}
                 {sgstAmount > 0 && <Text>{formatCurrencyINR(sgstAmount)}</Text>}
                 {igstAmount > 0 && <Text>{formatCurrencyINR(igstAmount)}</Text>}
              </View>
            </View>
          </View>

          {/* 5. Total Final Row */}
          <View style={[styles.row, styles.borderBottom]}>
             <View style={[{ width: "84%" }, styles.borderRight, styles.p4, { alignItems: "flex-end" }]}>
                <Text style={styles.bold}>Total</Text>
             </View>
             <View style={[{ width: "16%" }, styles.p4, styles.textRight]}>
                <Text style={styles.bold}>{formatCurrencyINR(total)}</Text>
             </View>
          </View>

          {/* 6. Amount in words */}
          <View style={[styles.borderBottom, styles.p4]}>
             <Text style={styles.label}>Amount Chargeable (in words)</Text>
             <Text style={styles.bold}>{numberToWordsINR(total)}</Text>
          </View>

          {/* 7. Tax Table Breakdown */}
          <View style={[styles.row, styles.borderBottom, styles.tableHeader]}>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2]}><Text>HSN/SAC</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2]}><Text>Taxable Value</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2]}><Text>CGST Amount</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2]}><Text>SGST Amount</Text></View>
             <View style={[{ width: "20%" }, styles.p2]}><Text>Total Tax Amount</Text></View>
          </View>
          <View style={[styles.row, styles.borderBottom]}>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2, styles.textCenter]}><Text>As per items</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2, styles.textRight]}><Text>{formatCurrencyINR(subtotal)}</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2, styles.textRight]}><Text>{formatCurrencyINR(cgstAmount)}</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2, styles.textRight]}><Text>{formatCurrencyINR(sgstAmount)}</Text></View>
             <View style={[{ width: "20%" }, styles.p2, styles.textRight]}><Text>{formatCurrencyINR(totalTax)}</Text></View>
          </View>

          {/* 8. Bank Details Row */}
          <View style={[styles.row, styles.borderBottom]}>
             <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                <Text style={[styles.label, { textDecoration: "underline", marginBottom: 4 }]}>Company's Bank Details</Text>
                <View style={styles.row}><Text style={[{ width: "30%" }, styles.label]}>Bank Name</Text><Text style={styles.value}>: {profile.defaultBankDetails?.bankName}</Text></View>
                <View style={styles.row}><Text style={[{ width: "30%" }, styles.label]}>A/c No.</Text><Text style={styles.value}>: {profile.defaultBankDetails?.accountNumber}</Text></View>
                <View style={styles.row}><Text style={[{ width: "30%" }, styles.label]}>Branch & IFSC</Text><Text style={styles.value}>: {profile.defaultBankDetails?.branch} & {profile.defaultBankDetails?.ifsc}</Text></View>
             </View>
             <View style={[{ width: "50%" }, styles.p4]}>
                <Text style={[styles.label, { textDecoration: "underline", marginBottom: 4 }]}>Company's Tax Details</Text>
                <View style={styles.row}><Text style={[{ width: "30%" }, styles.label]}>PAN</Text><Text style={styles.value}>: {profile.pan}</Text></View>
                <View style={styles.row}><Text style={[{ width: "30%" }, styles.label]}>GSTIN</Text><Text style={styles.value}>: {profile.gstin}</Text></View>
             </View>
          </View>

          {/* 9. Final Declaration & Signature Row */}
          <View style={[styles.row, { flexGrow: 1 }]}>
             <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                <Text style={[styles.label, { textDecoration: "underline", marginBottom: 4 }]}>Declaration</Text>
                <Text style={{ marginTop: 2, lineHeight: 1.3 }}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</Text>
             </View>
             <View style={[{ width: "50%" }, styles.p4, { justifyContent: "space-between" }]}>
                <Text style={[styles.bold, styles.textRight]}>for {profile.companyName}</Text>
                {profile.authorizedSignature ? (
                  <Image src={profile.authorizedSignature} style={{ height: 40, objectFit: 'contain', alignSelf: 'flex-end', marginTop: 10 }} />
                ) : (
                  <View style={{ height: 40, marginTop: 10 }} />
                )}
                <Text style={[styles.textRight, styles.label]}>Authorised Signatory</Text>
             </View>
          </View>

        </View>
        <Text style={[styles.textCenter, { marginTop: 4, fontSize: 7, color: "#888" }]}>This is a Computer Generated Invoice</Text>
      </Page>
    </Document>
  );
}