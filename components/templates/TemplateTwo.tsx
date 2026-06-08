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
          
          {/* 1. Header (Logo Left, Center Details, QR Right) */}
          <View style={[styles.borderBottom, { padding: 12, minHeight: 90, flexDirection: 'row', alignItems: 'center' }]}>
            {/* Left Side: Logo */}
            <View style={{ width: '20%', alignItems: 'flex-start', justifyContent: 'center' }}>
              {profile.logo && <Image src={profile.logo} style={{ width: 75, height: 75, objectFit: 'contain' }} />}
            </View>

            {/* Centered Company Details */}
            <View style={{ width: '60%', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.bold, { fontSize: profile.companyName.length > 30 ? 11 : profile.companyName.length > 20 ? 13 : 16, marginBottom: 6, textAlign: 'center', textTransform: 'uppercase' }]}>{profile.companyName}</Text>
              <Text style={{ textAlign: 'center', marginBottom: 2 }}>{profile.companyAddress}</Text>
              <Text style={{ textAlign: 'center', marginBottom: 2 }}>State: {profile.companyState} | Code: {profile.companyStateCode}</Text>
              {profile.email && <Text style={{ textAlign: 'center', marginBottom: 2 }}>Email: {profile.email}</Text>}
              <Text style={{ marginTop: 3, textAlign: 'center' }}>PAN No.: <Text style={styles.bold}>{profile.pan}</Text> | GSTIN: <Text style={styles.bold}>{profile.gstin}</Text></Text>
            </View>

            {/* Right Side: QR Code */}
            <View style={{ width: '20%', alignItems: 'flex-end', justifyContent: 'center' }}>
               <View style={{ width: 60, height: 60, borderWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' }}>
                  <Text style={{ color: '#aaa', fontSize: 8 }}>QR CODE</Text>
               </View>
            </View>
          </View>

          {/* 2. TAX INVOICE Title Row */}
          <View style={[styles.borderBottom, styles.p2, { backgroundColor: '#f0f0f0' }]}>
             <Text style={[styles.bold, styles.textCenter, { fontSize: 14, letterSpacing: 2, paddingVertical: 4 }]}>TAX INVOICE</Text>
          </View>

          {/* 3. Grid Section - Addresses & Invoice Meta Data */}
          <View style={[styles.row, styles.borderBottom]}>
            {/* Left Side: Ship To & Bill To */}
            <View style={[{ width: "50%" }, styles.col, styles.borderRight]}>
              <View style={[styles.p4, styles.borderBottom, { minHeight: 90 }]}>
                <Text style={styles.label}>Consignee (Ship to)</Text>
                <Text style={styles.value}>{invoice.shippingDetails?.name || invoice.client.name}</Text>
                <Text>{invoice.shippingDetails?.address || invoice.client.address}</Text>
                <Text>State: {invoice.shippingDetails?.state || invoice.client.state} | Code: {invoice.shippingDetails?.stateCode || invoice.client.stateCode}</Text>
                <Text>GSTIN: {invoice.shippingDetails?.gstin || invoice.client.gstin}</Text>
              </View>
              <View style={[styles.p4, { minHeight: 90 }]}>
                <Text style={styles.label}>Buyer (Bill to)</Text>
                <Text style={styles.value}>{invoice.client.name}</Text>
                <Text>{invoice.client.address}</Text>
                <Text>State: {invoice.client.state} | Code: {invoice.client.stateCode}</Text>
                <Text>GSTIN: {invoice.client.gstin}</Text>
              </View>
            </View>

            {/* Right Side: 8-Row Meta Grid */}
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
                  <Text style={styles.value}>{invoice.deliveryNote || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, styles.p4]}>
                  <Text style={styles.label}>Buyer's Order No.</Text>
                  <Text style={styles.value}>{invoice.orderNo || "-"}</Text>
                </View>
              </View>
              <View style={[styles.row, styles.borderBottom]}>
                <View style={[{ width: "50%" }, styles.borderRight, styles.p4]}>
                  <Text style={styles.label}>E-Way Bill No :</Text>
                  <Text style={styles.value}>{invoice.eWayBillNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, styles.p4]}>
                  <Text style={styles.label}>Delivery Date </Text>
                  <Text style={styles.value}>{invoice.dateOfSupply || "-"}</Text>
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

          {/* 4. Table Header Row */}
          <View style={[styles.row, styles.borderBottom, styles.tableHeader]}>
            <View style={[{ width: "5%" }, styles.borderRight, styles.p4]}><Text>Sl No.</Text></View>
            <View style={[{ width: "35%" }, styles.borderRight, styles.p4]}><Text>Description of Goods</Text></View>
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4]}><Text>HSN/SAC</Text></View>
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4]}><Text>Quantity</Text></View>
            <View style={[{ width: "12%" }, styles.borderRight, styles.p4]}><Text>Rate</Text></View>
            <View style={[{ width: "8%" }, styles.borderRight, styles.p4]}><Text>Per</Text></View>
            <View style={[{ width: "16%" }, styles.p4]}><Text>Amount</Text></View>
          </View>

          {/* 5. Table Body */}
          <View style={[styles.row, styles.borderBottom, { minHeight: 200 }]}>
            {/* Sl No */}
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
            {/* Per */}
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

          {/* 6. Total Final Row */}
          <View style={[styles.row, styles.borderBottom]}>
             <View style={[{ width: "84%" }, styles.borderRight, styles.p4, { alignItems: "flex-end" }]}>
                <Text style={styles.bold}>Total</Text>
             </View>
             <View style={[{ width: "16%" }, styles.p4, styles.textRight]}>
                <Text style={styles.bold}>{formatCurrencyINR(total)}</Text>
             </View>
          </View>

          {/* 7. Amount in words */}
          <View style={[styles.borderBottom, styles.p4]}>
             <Text style={styles.label}>Amount Chargeable (in words)</Text>
             <Text style={styles.bold}>{numberToWordsINR(total)}</Text>
          </View>

          {/* 8. Tax Table Breakdown */}
          <View style={[styles.row, styles.borderBottom, styles.tableHeader]}>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2]}><Text>HSN/SAC</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2]}><Text>Taxable Value</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2]}><Text>CGST Amount</Text></View>
             <View style={[{ width: "20%" }, styles.borderRight, styles.p2]}><Text>SGST Amount</Text></View>
             <View style={[{ width: "20%" }, styles.p2]}><Text>Total Tax Amount</Text></View>
          </View>
          {(() => {
             const hsnGroups: Record<string, { taxableValue: number; cgst: number; sgst: number; totalTax: number }> = {};
             invoice.items.forEach((item) => {
               const hsn = item.hsnCode?.trim() || "-";
               const itemAmount = item.quantity * item.unitPrice;
               const cgst = itemAmount * ((invoice.cgstRate || 0) / 100);
               const sgst = itemAmount * ((invoice.sgstRate || 0) / 100);
               const igst = itemAmount * ((invoice.igstRate || 0) / 100);
               const tax = cgst + sgst + igst;
               if (!hsnGroups[hsn]) {
                 hsnGroups[hsn] = { taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0 };
               }
               hsnGroups[hsn].taxableValue += itemAmount;
               hsnGroups[hsn].cgst += cgst;
               hsnGroups[hsn].sgst += sgst;
               hsnGroups[hsn].totalTax += tax;
             });
             return Object.entries(hsnGroups).map(([hsn, data]) => (
               <View key={hsn} style={[styles.row, styles.borderBottom]}>
                  <View style={[{ width: "20%" }, styles.borderRight, styles.p2, styles.textCenter]}><Text>{hsn}</Text></View>
                  <View style={[{ width: "20%" }, styles.borderRight, styles.p2, styles.textRight]}><Text>{formatCurrencyINR(data.taxableValue)}</Text></View>
                  <View style={[{ width: "20%" }, styles.borderRight, styles.p2, styles.textRight]}><Text>{formatCurrencyINR(data.cgst)}</Text></View>
                  <View style={[{ width: "20%" }, styles.borderRight, styles.p2, styles.textRight]}><Text>{formatCurrencyINR(data.sgst)}</Text></View>
                  <View style={[{ width: "20%" }, styles.p2, styles.textRight]}><Text>{formatCurrencyINR(data.totalTax)}</Text></View>
               </View>
             ));
           })()}

          {/* 9. Bank Details Row */}
          <View style={[styles.row, styles.borderBottom]}>
             <View style={[{ width: "100%" }, styles.p4]}>
                <Text style={[styles.label, { textDecoration: "underline", marginBottom: 4 }]}>Company's Bank Details</Text>
                <View style={styles.row}><Text style={[{ width: "20%" }, styles.label]}>Bank Name</Text><Text style={styles.value}>: {invoice.bankDetails?.bankName || profile.defaultBankDetails?.bankName}</Text></View>
                <View style={styles.row}><Text style={[{ width: "20%" }, styles.label]}>A/c No.</Text><Text style={styles.value}>: {invoice.bankDetails?.accountNumber || profile.defaultBankDetails?.accountNumber}</Text></View>
                <View style={styles.row}><Text style={[{ width: "20%" }, styles.label]}>Branch & IFSC</Text><Text style={styles.value}>: {invoice.bankDetails?.branch || profile.defaultBankDetails?.branch} & {invoice.bankDetails?.ifsc || profile.defaultBankDetails?.ifsc}</Text></View>
             </View>
          </View>

          {/* 10. Final Signature Row */}
          <View style={[styles.row, { flexGrow: 1, justifyContent: 'flex-end' }]}>
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
          <View style={[styles.row, { borderTopWidth: 1, borderColor: '#000', padding: 2 }]}>
             <Text style={[styles.textCenter, { width: "100%", fontSize: 7, color: "#555" }]}>This is a Computer Generated Invoice</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}