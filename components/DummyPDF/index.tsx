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

// ==========================================
// 1. HELPER FUNCTIONS (Used by all templates)
// ==========================================
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
  return res.trim().replace(/\s\s+/g, " ") + " RUPEES ONLY.";
}

type DummyPDFProps = {
  invoice: Invoice;
  profile: CompanyProfile;
  templateId?: string;
};


// =========================================================================
// 2. TEMPLATE 1 - DEFAULT (Original Classic Layout)
// =========================================================================
const styles = StyleSheet.create({
  page: {
    padding: 22,
  },
  container: {
    borderWidth: 1,
    width: "100%",
    height: 797.89,
  },
  boldText: {
    fontWeight: "bold",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 5,
  },
  companyLogo: {
    height: 72,
    width: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  companyLogoImg: {
    height: 72,
    width: 72,
    objectFit: "contain",
  },
  companyDetails: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  companyHeaderName: {
    width: "100%",
    textAlign: "center",
    marginBottom: 2,
    fontWeight: "bold",
  },
  companyHeaderAddress: {
    fontSize: 8,
    textAlign: "center",
  },
  companyHeaderGSTIN: {
    fontSize: 8,
    textAlign: "center",
  },
  companyHeaderPAN: {
    fontSize: 8,
    textAlign: "center",
  },
  companyQR: {
    height: 72,
    width: 72,
    borderWidth: 1,
    borderColor: "black",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  taxTransportInvoiceDetails: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderColor: "black",
  },
  taxInvoiceDetails: {
    flex: 1,
    padding: 6,
  },
  transportInvoiceDetails: {
    flex: 1,
    padding: 6,
    borderLeftWidth: 1,
    borderColor: "black",
  },
  labelWithValue: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  lwvLabel: {
    width: "40%",
    textAlign: "left",
    paddingRight: 4,
    fontSize: 9,
    fontWeight: 500,
  },
  addressLabel: {
    width: "18%",
    textAlign: "left",
    paddingRight: 4,
    fontSize: 9,
    fontWeight: 500,
  },
  lwvColon: {
    width: 6,
    textAlign: "center",
    fontSize: 9,
  },
  lwvValue: {
    flex: 1,
    paddingLeft: 2,
    fontSize: 9,
    textAlign: "left",
  },
  stateCodeContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  stateWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  stateInlineText: {
    fontSize: 9,
  },
  lwvValueRight: {
    flex: 1,
    fontSize: 9,
    textAlign: "right",
    paddingRight: 2,
  },
  lwvValueWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  lwvValueWrapperSingleLine: {
    width: "50%",
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  bankLabel: {
    width: "40%",
    textAlign: "left",
    paddingRight: 6,
    fontSize: 9,
    fontWeight: 500,
  },
  bankValueWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bankValue: {
    flex: 1,
    paddingLeft: 2,
    fontSize: 9,
    textAlign: "left",
  },
  addressBillShipping: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "black",
  },
  billAddressDetails: {
    flex: 1,
    padding: 4,
  },
  shippingAddressDetails: {
    flex: 1,
    padding: 4,
    borderLeftWidth: 1,
    borderColor: "black",
  },
  h3LabelBgGray: {
    height: 22,
    backgroundColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  h3Text: {
    fontSize: 9,
    fontWeight: "bold",
  },
  amountDetails: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "black",
    fontWeight: "bold",
  },
  amountInWord: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: "black",
  },
  labelTotalAmountInWords: {
    width: "100%",
  },
  amountWordsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountWordsLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginRight: 3,
  },
  amountWordsValue: {
    fontSize: 9,
    lineHeight: 1.1,
    flexGrow: 1,
  },
  labelTitleTotalAmountInWords: {
    fontSize: 9,
    fontWeight: "bold",
  },
  labelValueTotalAmountInWords: {
    fontSize: 9,
    marginTop: 1,
  },
  taxDivider: {
    borderTopWidth: 1,
    borderColor: "black",
    paddingTop: 4,
    marginTop: 2,
  },
  amountTaxDetails: {
    flex: 1,
    padding: 6,
  },
  bankDetails: {
    flexDirection: "row",
    width: "100%",
  },
  bankDetailsInfo: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 8,
  },
  termConditionSupplyContainer: {
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  termConditionSupplyTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    textDecoration: "underline",
  },
  termConditionSupplyItem: {
    fontSize: 8,
    marginBottom: 2,
    textAlign: "left",
  },
  productTable: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 14,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 24,
  },
  headerRow: {
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 1,
  },
  tableHeaderCellContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  tableCellContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  tableCellText: {
    fontSize: 9,
    flexGrow: 1,
  },
  serialNo: {
    width: 30,
    borderRightWidth: 1,
  },
  productName: {
    width: 187.5,
    borderRightWidth: 1,
  },
  hsnCode: {
    width: 60,
    borderRightWidth: 1,
  },
  uom: {
    width: 50,
    borderRightWidth: 1,
  },
  qty: {
    width: 75,
    borderRightWidth: 1,
  },
  rate: {
    width: 65.5,
    borderRightWidth: 1,
  },
  total: {
    width: 87,
  },
  textCenter: { textAlign: "center" },
  textLeft: { textAlign: "left" },
  textRight: { textAlign: "right" },
  textRightPadded: {
    textAlign: "right",
    paddingRight: 6,
  },
  footerContainer: {
    width: "100%",
    flexDirection: "row",
    height: 110,
  },
  footerSubject: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  fSLabel: {
    fontSize: 8,
    paddingBottom: 4,
    paddingLeft: 8,
  },
  footerStamp: {
    flex: 1,
    padding: 8,
    flexDirection: "column",
    alignItems: "center",
  },
  fStampStampImg: {
    width: 100,
    height: 100,
    objectFit: "contain",
    alignSelf: "center",
  },
  fSignImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  fStampLabel: {
    paddingTop: 4,
    fontSize: 8,
    paddingBottom: 4,
    textAlign: "center",
  },
  footerSignature: {
    flex: 1,
    padding: 8,
    flexDirection: "column",
  },
  fSignLabel: {
    marginBottom: 4,
    fontSize: 8,
  },
  fSignPhoto: {
    width: "100%",
    height: 58,
    objectFit: "contain",
  },
  fSignLabelAuth: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "flex-end",
    fontSize: 8,
  },
  bottomBlock: {
    marginTop: 0,
  },
  bankRowHeader: {
    fontSize: 8,
    fontWeight: "bold",
  },
});

function formatDateDDMMYYYY(dateStr: string | undefined): string {
  if (!dateStr) return "";
  // Handle YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  // Handle YYYYMMDD
  const compactMatch = dateStr.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) return `${compactMatch[3]}/${compactMatch[2]}/${compactMatch[1]}`;
  return dateStr;
}

function getCompanyNameFontSize(name: string): number {
  const len = (name || "").length;
  if (len <= 20) return 24;
  if (len <= 30) return 20;
  if (len <= 40) return 16;
  if (len <= 50) return 13;
  return 11;
}

function TemplateDefaultPDF({ invoice, profile }: DummyPDFProps) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;

  const companyNameFontSize = getCompanyNameFontSize(profile.companyName);

  const totalRows = 10;
  const rows = Array.from(
    { length: Math.max(invoice.items.length, totalRows) },
    (_, i) => invoice.items[i]
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.companyLogo}>
              {profile.logo ? <Image src={profile.logo} style={styles.companyLogoImg} /> : <Text></Text>}
            </View>
            <View style={styles.companyDetails}>
              <Text style={[styles.companyHeaderName, { fontSize: companyNameFontSize }]}>{profile.companyName || "COMPANY NAME"}</Text>
              <Text style={styles.companyHeaderAddress}>{profile.companyAddress || ""}</Text>
              <Text style={[styles.companyHeaderGSTIN, styles.boldText]}>GSTIN: {profile.gstin || ""}</Text>
              <Text style={[styles.companyHeaderPAN, styles.boldText]}>PAN: {profile.pan || ""}</Text>
            </View>
            <View style={styles.companyQR}>
              <Text style={{ fontSize: 8, color: "#aaa", fontWeight: "bold" }}>QR CODE</Text>
            </View>
          </View>

          <View style={styles.sectionTitle}>
            <Text>TAX INVOICE</Text>
          </View>

          <View style={styles.taxTransportInvoiceDetails}>
            <View style={styles.taxInvoiceDetails}>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Tax Invoice No.</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.invoiceNumber}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Date</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{formatDateDDMMYYYY(invoice.issueDate)}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Tax Payable on Reverse Charge</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.taxPayableOnReverseCharge ? "Yes" : "No"}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <View style={styles.stateCodeContainer}>
                  <View style={styles.stateWrapper}>
                    <Text style={styles.stateInlineText}>State</Text>
                    <Text style={styles.lwvColon}>:</Text>
                    <Text style={[styles.stateInlineText, styles.boldText]}>{profile.companyState || ""}</Text>
                  </View>
                  <View style={styles.codeWrapper}>
                    <Text style={styles.stateInlineText}>Code</Text>
                    <Text style={styles.lwvColon}>:</Text>
                    <Text style={[styles.stateInlineText, styles.boldText]}>{profile.companyStateCode || ""}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.transportInvoiceDetails}>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Transport Mode</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.transportMode || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Vehicle No</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.vehicleNo || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Date of Supply</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{formatDateDDMMYYYY(invoice.dateOfSupply) || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Place of Supply</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.placeOfSupply || ""}</Text>
                </View> 
                {/* What is this mess, clean this up */}
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Order No</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.orderNo || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>GR/LR No</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.grLrNo || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>E WAY BILL No</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.eWayBillNo || ""}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.addressBillShipping}>
            <View style={styles.billAddressDetails}>
              <View style={styles.h3LabelBgGray}>
                <Text style={styles.h3Text}>DETAILS OF RECEIVER (BILLED TO)</Text>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.addressLabel}>Name</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.client?.name || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.addressLabel}>Address</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.client?.address || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.addressLabel}>GSTIN</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.client?.gstin || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <View style={styles.stateCodeContainer}>
                  <View style={styles.stateWrapper}>
                    <Text style={styles.stateInlineText}>State</Text>
                    <Text style={styles.lwvColon}>:</Text>
                    <Text style={[styles.stateInlineText, styles.boldText]}>{invoice.client?.state || ""}</Text>
                  </View>
                  <View style={styles.codeWrapper}>
                    <Text style={styles.stateInlineText}>Code</Text>
                    <Text style={styles.lwvColon}>:</Text>
                    <Text style={[styles.stateInlineText, styles.boldText]}>{invoice.client?.stateCode || ""}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.shippingAddressDetails}>
              <View style={styles.h3LabelBgGray}>
                <Text style={styles.h3Text}>DETAILS OF RECEIVER (SHIPPED TO)</Text>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.addressLabel}>Name</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.shippingDetails?.name || invoice.client?.name || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.addressLabel}>Address</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.shippingDetails?.address || invoice.client?.address || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.addressLabel}>GSTIN</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.shippingDetails?.gstin || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <View style={styles.stateCodeContainer}>
                  <View style={styles.stateWrapper}>
                    <Text style={styles.stateInlineText}>State</Text>
                    <Text style={styles.lwvColon}>:</Text>
                    <Text style={[styles.stateInlineText, styles.boldText]}>{invoice.shippingDetails?.state || ""}</Text>
                  </View>
                  <View style={styles.codeWrapper}>
                    <Text style={styles.stateInlineText}>Code</Text>
                    <Text style={styles.lwvColon}>:</Text>
                    <Text style={[styles.stateInlineText, styles.boldText]}>{invoice.shippingDetails?.stateCode || ""}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.productTable}>
            <View style={[styles.rowHeader, styles.headerRow]}>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.serialNo]}><Text style={[styles.tableCellText, styles.textCenter]}>S.NO</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.productName]}><Text style={[styles.tableCellText, styles.textCenter]}>DESCRIPTION OF GOODS</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.hsnCode]}><Text style={[styles.tableCellText, styles.textCenter]}>HSN CODE</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.uom]}><Text style={[styles.tableCellText, styles.textCenter]}>UOM</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.qty]}><Text style={[styles.tableCellText, styles.textCenter]}>QUANTITY</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.rate]}><Text style={[styles.tableCellText, styles.textCenter]}>RATE</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.total]}><Text style={[styles.tableCellText, styles.textCenter]}>AMOUNT</Text></View>
            </View>
            {rows.map((item, index) => {
              const hasItem = !!item;
              const lineTotal = hasItem ? item.quantity * item.unitPrice : 0;
              return (
                <View key={(hasItem && (item.id || String(index))) || `empty-${index}`} style={styles.row}>
                  <View style={[styles.tableCellContainer, styles.serialNo]}><Text style={[styles.tableCellText, styles.textCenter]}>{hasItem ? index + 1 : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.productName]}><Text style={[styles.tableCellText, styles.textLeft]}>{hasItem ? item.description : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.hsnCode]}><Text style={[styles.tableCellText, styles.textCenter]}>{hasItem ? item.hsnCode || "" : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.uom]}><Text style={[styles.tableCellText, styles.textCenter]}>{hasItem ? item.uom || "" : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.qty]}><Text style={[styles.tableCellText, styles.textRightPadded]}>{hasItem ? item.quantity : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.rate]}><Text style={[styles.tableCellText, styles.textRightPadded]}>{hasItem ? formatCurrencyINR(item.unitPrice) : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.total]}><Text style={[styles.tableCellText, styles.textRightPadded]}>{hasItem ? formatCurrencyINR(lineTotal) : ""}</Text></View>
                </View>
              );
            })}
          </View>

          <View style={styles.amountDetails}>
            <View style={styles.amountInWord}>
              <View style={styles.labelTotalAmountInWords}>
                <Text style={styles.amountWordsLabel}>Total Amount in Words INR:</Text>
                <Text style={styles.amountWordsValue}>{numberToWordsINR(total)}</Text>
              </View>
            </View>
            <View style={styles.amountTaxDetails}>
              <View style={styles.labelWithValue}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Total Amount before tax</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(subtotal)}</Text></View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Add: CGST @ {invoice.cgstRate || 0}%</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(cgstAmount)}</Text></View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Add: SGST @ {invoice.sgstRate || 0}%</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(sgstAmount)}</Text></View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Add: IGST @ {invoice.igstRate || 0}%</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(igstAmount)}</Text></View>
              </View>
              <View style={[styles.labelWithValue, styles.taxDivider]}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Total Tax Amount</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(totalTax)}</Text></View>
              </View>
              <View style={[styles.labelWithValue, styles.taxDivider]}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Total Amount after Tax</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(total)}</Text></View>
              </View>
            </View>
          </View>

          <View style={{ flexGrow: 1 }} />

          <View wrap={false} style={styles.bottomBlock}>
            <View style={styles.bankDetails}>
              <View style={styles.bankDetailsInfo}>
                <Text style={styles.bankRowHeader}>OUR BANK DETAIL :</Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>A/C NAME</Text>
                  <View style={[styles.bankValueWrapper, styles.boldText]}>
                    <Text style={styles.bankValue}>{invoice.bankDetails?.accountName || "PARAGON REFRACTORIES & MINERALS"}</Text>
                  </View>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>A/C NO</Text>
                  <View style={styles.bankValueWrapper}>
                    <Text style={[styles.bankValue, styles.boldText]}>{invoice.bankDetails?.accountNumber || "758601010050048"}</Text>
                  </View>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>BANK</Text>
                  <View style={styles.bankValueWrapper}>
                    <Text style={[styles.bankValue, styles.boldText]}>{invoice.bankDetails?.bankName || "UNION BANK OF INDIA"}</Text>
                  </View>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>BRANCH / IFSC</Text>
                  <View style={styles.bankValueWrapper}>
                    <Text style={[styles.bankValue, styles.boldText]}>
                      {invoice.bankDetails?.branch || "CITY CENTRE"} / {invoice.bankDetails?.ifsc || "UBIN0815187"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.termConditionSupplyContainer}>
              <Text style={styles.termConditionSupplyTitle}>Terms & Condition for Supply:</Text>
              <Text style={styles.termConditionSupplyItem}>1. Goods once sold will not be taken back.</Text>
              <Text style={styles.termConditionSupplyItem}>
                2. Interest @<Text style={styles.boldText}>18%</Text> p.a. will be charged if the payment is not made within the stipulated time.
              </Text>
            </View>

            <View style={styles.footerContainer}>
              <View style={styles.footerSubject}>
                <Text style={styles.fSLabel}>Subject to <Text style={styles.boldText}>{invoice.jurisdiction || ""}</Text> Jurisdiction</Text>
              </View>
              <View style={styles.footerStamp}>
                {profile.companySeal ? <Image src={profile.companySeal} style={styles.fStampStampImg} /> : <View style={styles.fStampStampImg} />}
                <Text style={styles.fStampLabel}>Common seal</Text>
              </View>
              <View style={styles.footerSignature}>
                <Text style={[styles.fSignLabel, styles.boldText]}>For {profile.companyName}</Text>
                {profile.authorizedSignature ? <Image src={profile.authorizedSignature} style={styles.fSignPhoto} /> : <View style={styles.fSignPhoto} />}
                <Text style={[styles.fSignLabelAuth, styles.boldText]}>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}


// =========================================================================
// 3. TEMPLATE 2 (Tally ERP Style with 3-Column Header)
// =========================================================================
const stylesTally = StyleSheet.create({
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
  label: { fontSize: 9, color: "#444", marginBottom: 2 },
  value: { fontWeight: "bold", fontSize: 9 },
  termsVal: { fontSize: 9 },
  tableHeader: { backgroundColor: "#f0f0f0", textAlign: "center", fontWeight: "bold" },
  tableText: { fontSize: 9 },
  addressText: { fontSize: 9 },
  footerContainer: {
    width: "100%",
    flexDirection: "row",
    height: 110,
  },
  footerSubject: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  fSLabel: {
    fontSize: 8,
    paddingBottom: 4,
    paddingLeft: 8,
  },
  footerStamp: {
    flex: 1,
    padding: 8,
    flexDirection: "column",
    alignItems: "center",
  },
  fStampStampImg: {
    width: 100,
    height: 100,
    objectFit: "contain",
    alignSelf: "center",
  },
  fStampLabel: {
    paddingTop: 4,
    fontSize: 8,
    paddingBottom: 4,
    textAlign: "center",
  },
  footerSignature: {
    flex: 1,
    padding: 8,
    flexDirection: "column",
  },
  fSignLabel: {
    marginBottom: 4,
    fontSize: 8,
  },
  fSignPhoto: {
    width: "100%",
    height: 58,
    objectFit: "contain",
  },
  fSignLabelAuth: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "flex-end",
    fontSize: 8,
  },
});

function TemplateTallyPDF({ invoice, profile }: DummyPDFProps) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;

  const companyNameFontSize = getCompanyNameFontSize(profile.companyName);

  return (
    <Document>
      <Page size="A4" style={stylesTally.page}>
        <View style={stylesTally.container}>
          <View style={[stylesTally.borderBottom, { padding: 12, minHeight: 90, flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ width: '20%', alignItems: 'flex-start', justifyContent: 'center' }}>
               {profile.logo && <Image src={profile.logo} style={{ width: 75, height: 75, objectFit: 'contain' }} />}
            </View>
            <View style={{ width: '60%', alignItems: 'center', justifyContent: 'center' }}>
               <Text style={[stylesTally.bold, { fontSize: companyNameFontSize, marginBottom: 6, textAlign: 'center', textTransform: 'uppercase' }]}>{profile.companyName}</Text>
               <Text style={{ textAlign: 'center', marginBottom: 2 }}>{profile.companyAddress}</Text>
               <Text style={{ textAlign: 'center', marginBottom: 2 }}>State: {profile.companyState} | Code: {profile.companyStateCode}</Text>
               {profile.email && <Text style={{ textAlign: 'center', marginBottom: 2 }}>Email: {profile.email}</Text>}
               <Text style={{ marginTop: 3, textAlign: 'center' }}>PAN No.: <Text style={stylesTally.bold}>{profile.pan}</Text> | GSTIN: <Text style={stylesTally.bold}>{profile.gstin}</Text></Text>
            </View>
            <View style={{ width: '20%', alignItems: 'flex-end', justifyContent: 'center' }}>
               <View style={{ width: 72, height: 72, borderWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' }}>
                  <Text style={{ color: '#aaa', fontSize: 8 }}>QR CODE</Text>
               </View>
            </View>
          </View>

          <View style={[stylesTally.borderBottom, stylesTally.p2, { backgroundColor: '#f0f0f0' }]}>
             <Text style={[stylesTally.bold, stylesTally.textCenter, { fontSize: 12, letterSpacing: 2, paddingVertical: 2 }]}>TAX INVOICE</Text>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom]}>
             <View style={[{ width: "50%" }, stylesTally.col, stylesTally.borderRight]}>
              <View style={[stylesTally.p4, stylesTally.borderBottom, { minHeight: 110 }]}>
                <Text style={stylesTally.label}>Consignee (Ship to)</Text>
                <Text style={stylesTally.value}>{invoice.shippingDetails?.name || invoice.client.name}</Text>
                <Text style={stylesTally.addressText}>{invoice.shippingDetails?.address || invoice.client.address}</Text>
                <Text style={stylesTally.addressText}>State: {invoice.shippingDetails?.state || invoice.client.state} | Code: {invoice.shippingDetails?.stateCode || invoice.client.stateCode}</Text>
                <Text style={stylesTally.addressText}>GSTIN: {invoice.shippingDetails?.gstin || invoice.client.gstin}</Text>
              </View>
              <View style={[stylesTally.p4, { minHeight: 110 }]}>
                <Text style={stylesTally.label}>Buyer (Bill to)</Text>
                <Text style={stylesTally.value}>{invoice.client.name}</Text>
                <Text style={stylesTally.addressText}>{invoice.client.address}</Text>
                <Text style={stylesTally.addressText}>State: {invoice.client.state} | Code: {invoice.client.stateCode}</Text>
                <Text style={stylesTally.addressText}>GSTIN: {invoice.client.gstin}</Text>
              </View>
            </View>

            <View style={[{ width: "50%" }, stylesTally.col]}>
              <View style={[stylesTally.row, stylesTally.borderBottom]}>
                <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Invoice No.</Text>
                  <Text style={stylesTally.value}>{invoice.invoiceNumber}</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Dated</Text>
                  <Text style={stylesTally.value}>{invoice.issueDate}</Text>
                </View>
              </View>
              <View style={[stylesTally.row, stylesTally.borderBottom]}>
                <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Delivery Note</Text>
                  <Text style={stylesTally.value}>{invoice.deliveryNote || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Buyer's Order No.</Text>
                  <Text style={stylesTally.value}>{invoice.orderNo || "-"}</Text>
                </View>
              </View>
              <View style={[stylesTally.row, stylesTally.borderBottom]}>
                <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                  <Text style={stylesTally.label}>E-Way Bill No :</Text>
                  <Text style={stylesTally.value}>{invoice.eWayBillNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Delivery Date </Text>
                  <Text style={stylesTally.value}>{invoice.dateOfSupply || "-"}</Text>
                </View>
              </View>
              <View style={[stylesTally.row, stylesTally.borderBottom]}>
                <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Dispatched through</Text>
                  <Text style={stylesTally.value}>{invoice.transportMode || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Destination</Text>
                  <Text style={stylesTally.value}>{invoice.placeOfSupply || "-"}</Text>
                </View>
              </View>
              <View style={[stylesTally.row, stylesTally.borderBottom]}>
                <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Bill of Lading/LR-RR No.</Text>
                  <Text style={stylesTally.value}>{invoice.grLrNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Motor Vehicle No.</Text>
                  <Text style={stylesTally.value}>{invoice.vehicleNo || "-"}</Text>
                </View>
              </View>
              <View style={[stylesTally.p4, { flex: 1 }]}>
                <Text style={stylesTally.label}>Terms of Delivery</Text>
                <Text style={stylesTally.termsVal}>{invoice.termsAndConditions || "-"}</Text>
              </View>
            </View>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom, stylesTally.tableHeader]}>
            <View style={[{ width: "5%" }, stylesTally.borderRight, stylesTally.p4]}><Text style={stylesTally.tableText}>S.NO</Text></View>
            <View style={[{ width: "35%" }, stylesTally.borderRight, stylesTally.p4]}><Text style={stylesTally.tableText}>DESCRIPTION OF GOODS</Text></View>
            <View style={[{ width: "12%" }, stylesTally.borderRight, stylesTally.p4]}><Text style={stylesTally.tableText}>HSN CODE</Text></View>
            <View style={[{ width: "8%" }, stylesTally.borderRight, stylesTally.p4]}><Text style={stylesTally.tableText}>UOM</Text></View>
            <View style={[{ width: "10%" }, stylesTally.borderRight, stylesTally.p4]}><Text style={stylesTally.tableText}>QUANTITY</Text></View>
            <View style={[{ width: "15%" }, stylesTally.borderRight, stylesTally.p4]}><Text style={stylesTally.tableText}>RATE</Text></View>
            <View style={[{ width: "15%" }, stylesTally.p4]}><Text style={stylesTally.tableText}>AMOUNT</Text></View>
          </View>

          {(() => {
            const tallyMaxRows = 8;
            const tallyRows = Array.from({ length: Math.max(invoice.items.length, tallyMaxRows) }, (_, i) => invoice.items[i]);
            return null;
          })()}
          <View style={[stylesTally.row, stylesTally.borderBottom, { flexGrow: 1 }]}>
            <View style={[{ width: "5%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textCenter]}>
              {Array.from({ length: Math.max(invoice.items.length, 8) }, (_, i) => invoice.items[i]).map((item, i) => <Text key={i} style={[stylesTally.tableText, { marginBottom: 4 }]}>{item ? i + 1 : ''}</Text>)}
            </View>
            <View style={[{ width: "35%" }, stylesTally.borderRight, stylesTally.p4]}>
              {Array.from({ length: Math.max(invoice.items.length, 8) }, (_, i) => invoice.items[i]).map((item, i) => <Text key={i} style={[stylesTally.bold, stylesTally.tableText, { marginBottom: 4 }]}>{item ? item.description : ''}</Text>)}
              <View style={{ marginTop: 20 }}>
                 {cgstAmount > 0 && <Text style={[stylesTally.textRight, stylesTally.bold, stylesTally.tableText]}>CGST @ {invoice.cgstRate || 0}%:</Text>}
                 {sgstAmount > 0 && <Text style={[stylesTally.textRight, stylesTally.bold, stylesTally.tableText]}>SGST @ {invoice.sgstRate || 0}%:</Text>}
                 {igstAmount > 0 && <Text style={[stylesTally.textRight, stylesTally.bold, stylesTally.tableText]}>IGST @ {invoice.igstRate || 0}%:</Text>}
              </View>
            </View>
            {/* HSN CODE */}
            <View style={[{ width: "12%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textCenter]}>
              {Array.from({ length: Math.max(invoice.items.length, 8) }, (_, i) => invoice.items[i]).map((item, i) => <Text key={i} style={[stylesTally.tableText, { marginBottom: 4 }]}>{item ? (item.hsnCode || "-") : ''}</Text>)}
            </View>
            {/* UOM */}
            <View style={[{ width: "8%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textCenter]}>
              {Array.from({ length: Math.max(invoice.items.length, 8) }, (_, i) => invoice.items[i]).map((item, i) => <Text key={i} style={[stylesTally.tableText, { marginBottom: 4 }]}>{item ? (item.uom || "-") : ''}</Text>)}
            </View>
            {/* Quantity */}
            <View style={[{ width: "10%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textRight]}>
              {Array.from({ length: Math.max(invoice.items.length, 8) }, (_, i) => invoice.items[i]).map((item, i) => <Text key={i} style={[stylesTally.tableText, { marginBottom: 4 }]}>{item ? item.quantity : ''}</Text>)}
            </View>
            {/* Rate */}
            <View style={[{ width: "15%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textRight]}>
              {Array.from({ length: Math.max(invoice.items.length, 8) }, (_, i) => invoice.items[i]).map((item, i) => <Text key={i} style={[stylesTally.tableText, { marginBottom: 4 }]}>{item ? formatCurrencyINR(item.unitPrice) : ''}</Text>)}
            </View>
            {/* Amount */}
            <View style={[{ width: "15%" }, stylesTally.p4, stylesTally.textRight]}>
              {Array.from({ length: Math.max(invoice.items.length, 8) }, (_, i) => invoice.items[i]).map((item, i) => <Text key={i} style={[stylesTally.tableText, { marginBottom: 4 }]}>{item ? formatCurrencyINR(item.quantity * item.unitPrice) : ''}</Text>)}
              <View style={{ marginTop: 20 }}>
                 {cgstAmount > 0 && <Text style={stylesTally.tableText}>{formatCurrencyINR(cgstAmount)}</Text>}
                 {sgstAmount > 0 && <Text style={stylesTally.tableText}>{formatCurrencyINR(sgstAmount)}</Text>}
                 {igstAmount > 0 && <Text style={stylesTally.tableText}>{formatCurrencyINR(igstAmount)}</Text>}
              </View>
            </View>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom]}>
             <View style={[{ width: "85%" }, stylesTally.borderRight, stylesTally.p4, { alignItems: "flex-end" }]}>
                <Text style={stylesTally.bold}>Total</Text>
             </View>
             <View style={[{ width: "15%" }, stylesTally.p4, stylesTally.textRight]}>
                <Text style={stylesTally.bold}>{formatCurrencyINR(total)}</Text>
             </View>
          </View>

          <View style={[stylesTally.borderBottom, stylesTally.p4]}>
             <Text style={stylesTally.label}>Amount Chargeable (in words)</Text>
             <Text style={stylesTally.bold}>{numberToWordsINR(total)}</Text>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom, stylesTally.tableHeader]}>
             <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2]}><Text>HSN/SAC</Text></View>
             <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2]}><Text>Taxable Value</Text></View>
             <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2]}><Text>CGST Amount</Text></View>
             <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2]}><Text>SGST Amount</Text></View>
             <View style={[{ width: "20%" }, stylesTally.p2]}><Text>Total Tax Amount</Text></View>
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
               <View key={hsn} style={[stylesTally.row, stylesTally.borderBottom]}>
                  <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2, stylesTally.textCenter]}><Text>{hsn}</Text></View>
                  <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2, stylesTally.textRight]}><Text>{formatCurrencyINR(data.taxableValue)}</Text></View>
                  <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2, stylesTally.textRight]}><Text>{formatCurrencyINR(data.cgst)}</Text></View>
                  <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2, stylesTally.textRight]}><Text>{formatCurrencyINR(data.sgst)}</Text></View>
                  <View style={[{ width: "20%" }, stylesTally.p2, stylesTally.textRight]}><Text>{formatCurrencyINR(data.totalTax)}</Text></View>
               </View>
             ));
           })()}

          <View style={[stylesTally.row, stylesTally.borderBottom]}>
             <View style={[{ width: "100%" }, stylesTally.p4]}>
                <Text style={[stylesTally.label, { textDecoration: "underline", marginBottom: 4 }]}>Company's Bank Details</Text>
                <View style={stylesTally.row}><Text style={[{ width: "20%" }, stylesTally.label]}>Bank Name</Text><Text style={stylesTally.value}>: {invoice.bankDetails?.bankName || profile.defaultBankDetails?.bankName || ""}</Text></View>
                <View style={stylesTally.row}><Text style={[{ width: "20%" }, stylesTally.label]}>A/c No.</Text><Text style={stylesTally.value}>: {invoice.bankDetails?.accountNumber || profile.defaultBankDetails?.accountNumber || ""}</Text></View>
                <View style={stylesTally.row}><Text style={[{ width: "20%" }, stylesTally.label]}>Branch & IFSC</Text><Text style={stylesTally.value}>: {invoice.bankDetails?.branch || profile.defaultBankDetails?.branch || ""} & {invoice.bankDetails?.ifsc || profile.defaultBankDetails?.ifsc || ""}</Text></View>
             </View>
          </View>

          <View style={stylesTally.footerContainer}>
             <View style={stylesTally.footerSubject}>
                <Text style={stylesTally.fSLabel}>Subject to <Text style={stylesTally.bold}>{invoice.jurisdiction || ""}</Text> Jurisdiction</Text>
             </View>
             <View style={stylesTally.footerStamp}>
                {profile.companySeal ? <Image src={profile.companySeal} style={stylesTally.fStampStampImg} /> : <View style={stylesTally.fStampStampImg} />}
                <Text style={stylesTally.fStampLabel}>Common seal</Text>
             </View>
             <View style={stylesTally.footerSignature}>
                <Text style={[stylesTally.fSignLabel, stylesTally.bold]}>For {profile.companyName}</Text>
                {profile.authorizedSignature ? <Image src={profile.authorizedSignature} style={stylesTally.fSignPhoto} /> : <View style={stylesTally.fSignPhoto} />}
                <Text style={[stylesTally.fSignLabelAuth, stylesTally.bold]}>Authorised Signatory</Text>
             </View>
          </View>
          <View style={[stylesTally.row, { borderTopWidth: 1, borderColor: '#000', padding: 2 }]}>
             <Text style={[stylesTally.textCenter, { width: "100%", fontSize: 7, color: "#555" }]}>This is a Computer Generated Invoice</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}


// =========================================================================
// 4. TEMPLATE 3 - PROFESSIONAL (New Requested Hierarchical Layout)
// =========================================================================
function TemplateThreePDF({ invoice, profile }: DummyPDFProps) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;

  const totalRows = 10;
  const rows = Array.from(
    { length: Math.max(invoice.items.length, totalRows) },
    (_, i) => invoice.items[i]
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          
          {/* Box 1: Company Name */}
          <View style={{ borderBottomWidth: 1, borderColor: "black", padding: 8, backgroundColor: "#f9fafb" }}>
             <Text style={[styles.companyHeaderName, { textAlign: "center", marginBottom: 0, fontSize: 22 }]}>
               {profile.companyName || "COMPANY NAME"}
             </Text>
          </View>

          {/* Box 2: Three Parts (Logo, Parent Company Details, QR) */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "black", minHeight: 72 }}>
             {/* Part 1: Logo */}
             <View style={{ width: "20%", padding: 4, alignItems: "center", justifyContent: "center" }}>
                {profile.logo ? <Image src={profile.logo} style={styles.companyLogoImg} /> : <View />}
             </View>
             {/* Part 2: Parent Company Details */}
             <View style={{ width: "60%", padding: 6, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderRightWidth: 1, borderColor: "black" }}>
                <Text style={styles.companyHeaderAddress}>{profile.companyAddress || ""}</Text>
                <Text style={styles.companyHeaderAddress}>State: {profile.companyState || ""} | Code: {profile.companyStateCode || ""}</Text>
                <Text style={[styles.companyHeaderGSTIN, styles.boldText, { marginTop: 3 }]}>GSTIN: {profile.gstin || ""} &nbsp;&nbsp;&nbsp; PAN: {profile.pan || ""}</Text>
                {profile.email && <Text style={styles.companyHeaderAddress}>Email: {profile.email}</Text>}
             </View>
             {/* Part 3: QR Code */}
             <View style={{ width: "20%", padding: 4, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 45, height: 45, borderWidth: 1, borderColor: "#aaa", justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa" }}>
                   <Text style={{ fontSize: 8, color: "#aaa" }}>QR</Text>
                </View>
             </View>
          </View>

          {/* Box 3: Tax Invoice Heading Box */}
          <View style={{ borderBottomWidth: 1, borderColor: "black", padding: 6, backgroundColor: "#f0f0f0" }}>
             <Text style={[styles.sectionTitle, { marginBottom: 0, letterSpacing: 1, fontSize: 14 }]}>TAX INVOICE</Text>
          </View>

          {/* Box 4: Divided into 2 equal parts (Bill To / Ship To addresses) */}
          <View style={[styles.addressBillShipping, { borderTopWidth: 0, borderBottomWidth: 1 }]}>
              {/* Billed To */}
              <View style={styles.billAddressDetails}>
                  <View style={styles.h3LabelBgGray}><Text style={styles.h3Text}>DETAILS OF RECEIVER (BILLED TO)</Text></View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Name</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={[styles.lwvValue, styles.boldText]}>{invoice.client?.name || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Address</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={styles.lwvValue}>{invoice.client?.address || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>GSTIN</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={styles.lwvValue}>{invoice.client?.gstin || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <View style={styles.stateCodeContainer}>
                      <View style={styles.stateWrapper}>
                        <Text style={styles.stateInlineText}>State</Text><Text style={styles.lwvColon}>:</Text><Text style={[styles.stateInlineText, styles.boldText]}>{invoice.client?.state || ""}</Text>
                      </View>
                      <View style={styles.codeWrapper}>
                        <Text style={styles.stateInlineText}>Code</Text><Text style={styles.lwvColon}>:</Text><Text style={[styles.stateInlineText, styles.boldText]}>{invoice.client?.stateCode || ""}</Text>
                      </View>
                    </View>
                  </View>
              </View>
              {/* Shipped To */}
              <View style={styles.shippingAddressDetails}>
                  <View style={styles.h3LabelBgGray}><Text style={styles.h3Text}>DETAILS OF RECEIVER (SHIPPED TO)</Text></View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Name</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={[styles.lwvValue, styles.boldText]}>{invoice.shippingDetails?.name || invoice.client?.name || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Address</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={styles.lwvValue}>{invoice.shippingDetails?.address || invoice.client?.address || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>GSTIN</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={styles.lwvValue}>{invoice.shippingDetails?.gstin || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <View style={styles.stateCodeContainer}>
                      <View style={styles.stateWrapper}>
                        <Text style={styles.stateInlineText}>State</Text><Text style={styles.lwvColon}>:</Text><Text style={[styles.stateInlineText, styles.boldText]}>{invoice.shippingDetails?.state || ""}</Text>
                      </View>
                      <View style={styles.codeWrapper}>
                        <Text style={styles.stateInlineText}>Code</Text><Text style={styles.lwvColon}>:</Text><Text style={[styles.stateInlineText, styles.boldText]}>{invoice.shippingDetails?.stateCode || ""}</Text>
                      </View>
                    </View>
                  </View>
              </View>
          </View>

          {/* Box 5: Meta Details Section (Divided into 2 equal columns) */}
          <View style={[styles.taxTransportInvoiceDetails, { borderTopWidth: 0 }]}>
              {/* Left Column Fields */}
              <View style={styles.taxInvoiceDetails}>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Tax Invoice No.</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={[styles.lwvValue, styles.boldText]}>{invoice.invoiceNumber}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Date</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={[styles.lwvValue, styles.boldText]}>{invoice.issueDate}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Tax Payable on Reverse Charge</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={styles.lwvValue}>{invoice.taxPayableOnReverseCharge ? "Yes" : "No"}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <View style={styles.stateCodeContainer}>
                      <View style={styles.stateWrapper}>
                        <Text style={styles.stateInlineText}>State</Text><Text style={styles.lwvColon}>:</Text><Text style={[styles.stateInlineText, styles.boldText]}>{profile.companyState || ""}</Text>
                      </View>
                      <View style={styles.codeWrapper}>
                        <Text style={styles.stateInlineText}>Code</Text><Text style={styles.lwvColon}>:</Text><Text style={[styles.stateInlineText, styles.boldText]}>{profile.companyStateCode || ""}</Text>
                      </View>
                    </View>
                  </View>
              </View>

              {/* Right Column Fields */}
              <View style={styles.transportInvoiceDetails}>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Transport Mode</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={styles.lwvValue}>{invoice.transportMode || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Vehicle No</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={[styles.lwvValue, styles.boldText]}>{invoice.vehicleNo || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Date of Supply</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={[styles.lwvValue, styles.boldText]}>{invoice.dateOfSupply || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Place of Supply</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={styles.lwvValue}>{invoice.placeOfSupply || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.labelWithValue}>
                    <Text style={styles.lwvLabel}>Order No</Text>
                    <View style={styles.lwvValueWrapper}>
                      <Text style={styles.lwvColon}>:</Text><Text style={[styles.lwvValue, styles.boldText]}>{invoice.orderNo || ""}</Text>
                    </View>
                  </View>
              </View>
          </View>

          {/* Box 6: Product Table (Identical to default classic template) */}
          <View style={[styles.productTable, { flexGrow: 1 }]}>
            <View style={[styles.rowHeader, styles.headerRow]}>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.serialNo]}><Text style={[styles.tableCellText, styles.textCenter]}>S.NO</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.productName]}><Text style={[styles.tableCellText, styles.textCenter]}>DESCRIPTION OF GOODS</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.hsnCode]}><Text style={[styles.tableCellText, styles.textCenter]}>HSN CODE</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.uom]}><Text style={[styles.tableCellText, styles.textCenter]}>UOM</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.qty]}><Text style={[styles.tableCellText, styles.textCenter]}>QUANTITY</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.rate]}><Text style={[styles.tableCellText, styles.textCenter]}>RATE</Text></View>
              <View style={[{ fontWeight: "bold" }, styles.tableHeaderCellContainer, styles.total]}><Text style={[styles.tableCellText, styles.textCenter]}>AMOUNT</Text></View>
            </View>
            {rows.map((item, index) => {
              const hasItem = !!item;
              const lineTotal = hasItem ? item.quantity * item.unitPrice : 0;
              return (
                <View key={(hasItem && (item.id || String(index))) || `empty-${index}`} style={styles.row}>
                  <View style={[styles.tableCellContainer, styles.serialNo]}><Text style={[styles.tableCellText, styles.textCenter]}>{hasItem ? index + 1 : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.productName]}><Text style={[styles.tableCellText, styles.textLeft]}>{hasItem ? item.description : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.hsnCode]}><Text style={[styles.tableCellText, styles.textCenter]}>{hasItem ? item.hsnCode || "" : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.uom]}><Text style={[styles.tableCellText, styles.textCenter]}>{hasItem ? item.uom || "" : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.qty]}><Text style={[styles.tableCellText, styles.textRightPadded]}>{hasItem ? item.quantity : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.rate]}><Text style={[styles.tableCellText, styles.textRightPadded]}>{hasItem ? formatCurrencyINR(item.unitPrice) : ""}</Text></View>
                  <View style={[styles.tableCellContainer, styles.total]}><Text style={[styles.tableCellText, styles.textRightPadded]}>{hasItem ? formatCurrencyINR(lineTotal) : ""}</Text></View>
                </View>
              );
            })}
          </View>

          {/* Box 7+: Totals and Footer (Identical to default classic template) */}
          <View style={styles.amountDetails}>
            <View style={styles.amountInWord}>
              <View style={styles.labelTotalAmountInWords}>
                <Text style={styles.amountWordsLabel}>Total Amount in Words INR:</Text>
                <Text style={styles.amountWordsValue}>{numberToWordsINR(total)}</Text>
              </View>
            </View>
            <View style={styles.amountTaxDetails}>
              <View style={styles.labelWithValue}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Total Amount before tax</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(subtotal)}</Text></View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Add: CGST @ {invoice.cgstRate || 0}%</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(cgstAmount)}</Text></View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Add: SGST @ {invoice.sgstRate || 0}%</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(sgstAmount)}</Text></View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Add: IGST @ {invoice.igstRate || 0}%</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(igstAmount)}</Text></View>
              </View>
              <View style={[styles.labelWithValue, styles.taxDivider]}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Total Tax Amount</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(totalTax)}</Text></View>
              </View>
              <View style={[styles.labelWithValue, styles.taxDivider]}>
                <Text style={[styles.lwvLabel, styles.boldText]}>Total Amount after Tax</Text>
                <View style={styles.lwvValueWrapper}><Text style={styles.lwvValueRight}>{formatCurrencyINR(total)}</Text></View>
              </View>
            </View>
          </View>

          <View wrap={false} style={styles.bottomBlock}>
            <View style={styles.bankDetails}>
              <View style={styles.bankDetailsInfo}>
                <Text style={styles.bankRowHeader}>OUR BANK DETAIL :</Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>A/C NAME</Text>
                  <View style={[styles.bankValueWrapper, styles.boldText]}>
                    <Text style={styles.bankValue}>{invoice.bankDetails?.accountName || "PARAGON REFRACTORIES & MINERALS"}</Text>
                  </View>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>A/C NO</Text>
                  <View style={styles.bankValueWrapper}>
                    <Text style={[styles.bankValue, styles.boldText]}>{invoice.bankDetails?.accountNumber || "758601010050048"}</Text>
                  </View>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>BANK</Text>
                  <View style={styles.bankValueWrapper}>
                    <Text style={[styles.bankValue, styles.boldText]}>{invoice.bankDetails?.bankName || "UNION BANK OF INDIA"}</Text>
                  </View>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>BRANCH / IFSC</Text>
                  <View style={styles.bankValueWrapper}>
                    <Text style={[styles.bankValue, styles.boldText]}>
                      {invoice.bankDetails?.branch || "CITY CENTRE"} / {invoice.bankDetails?.ifsc || "UBIN0815187"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.termConditionSupplyContainer}>
              <Text style={styles.termConditionSupplyTitle}>Terms & Condition for Supply:</Text>
              <Text style={styles.termConditionSupplyItem}>1. Goods once sold will not be taken back.</Text>
              <Text style={styles.termConditionSupplyItem}>
                2. Interest @<Text style={styles.boldText}>18%</Text> p.a. will be charged if the payment is not made within the stipulated time.
              </Text>
            </View>

            <View style={styles.footerContainer}>
              <View style={styles.footerSubject}>
                <Text style={styles.fSLabel}>Subject to <Text style={styles.boldText}>{invoice.jurisdiction || ""}</Text> Jurisdiction</Text>
              </View>
              <View style={styles.footerStamp}>
                {profile.companySeal ? <Image src={profile.companySeal} style={styles.fStampStampImg} /> : <View style={styles.fStampStampImg} />}
                <Text style={styles.fStampLabel}>Common seal</Text>
              </View>
              <View style={styles.footerSignature}>
                <Text style={[styles.fSignLabel, styles.boldText]}>For {profile.companyName}</Text>
                {profile.authorizedSignature ? <Image src={profile.authorizedSignature} style={styles.fSignPhoto} /> : <View style={styles.fSignPhoto} />}
                <Text style={[styles.fSignLabelAuth, styles.boldText]}>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}


// =========================================================================
// TEMPLATE 4 - SIMPLE CLEAN (Minimalist Layout)
// =========================================================================
const stylesSimple = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: '#374151' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  companyName: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  companyAddress: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  logo: { height: 45, width: 45, objectFit: 'contain' },
  infoRow: { flexDirection: 'row', marginBottom: 30 },
  billTo: { width: '65%' },
  invoiceInfo: { width: '35%', alignItems: 'flex-end' },
  label: { fontSize: 8, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 10, fontWeight: 'bold', color: '#1f2937' },
  valueNormal: { fontSize: 9, color: '#374151' },
  invoiceNumber: { fontSize: 14, fontWeight: 'bold', fontFamily: 'Courier', color: '#1f2937' },
  tableContainer: { flexGrow: 1, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderColor: '#d1d5db', paddingBottom: 6, marginBottom: 4 },
  tableHeaderCell: { fontSize: 8, fontWeight: 'bold', color: '#6b7280' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#e5e7eb', paddingVertical: 5, minHeight: 18 },
  descCol: { width: '45%' },
  qtyCol: { width: '15%', textAlign: 'right' },
  rateCol: { width: '20%', textAlign: 'right' },
  totalCol: { width: '20%', textAlign: 'right' },
  cellText: { fontSize: 9 },
  totalsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  totalsBox: { width: '40%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: '#6b7280' },
  totalValue: { fontSize: 9 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 2, borderColor: '#d1d5db', marginTop: 4 },
  grandTotalLabel: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  grandTotalValue: { fontSize: 13, fontWeight: 'bold', color: '#111827' },
  amountWords: { marginBottom: 10 },
  amountWordsLabel: { fontSize: 8, fontWeight: 'bold', color: '#4b5563', marginBottom: 2 },
  amountWordsValue: { fontSize: 8, color: '#6b7280' },
  footer: { borderTopWidth: 0.5, borderColor: '#e5e7eb', paddingTop: 12, flexDirection: 'row', marginTop: 10 },
  footerLeft: { width: '50%' },
  footerRight: { width: '50%', alignItems: 'center' },
  footerTitle: { fontSize: 8, fontWeight: 'bold', color: '#4b5563', marginBottom: 4 },
  footerText: { fontSize: 8, color: '#6b7280', marginBottom: 1 },
  sealImg: { width: 55, height: 55, objectFit: 'contain', opacity: 0.7, marginVertical: 4 },
  signImg: { height: 30, objectFit: 'contain', marginVertical: 4 },
  signLine: { fontSize: 8, color: '#6b7280', borderTopWidth: 0.5, borderColor: '#e5e7eb', paddingTop: 4, marginTop: 4 },
});

function TemplateSimplePDF({ invoice, profile }: DummyPDFProps) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;

  const maxRows = 12;
  const rows = Array.from({ length: Math.max(invoice.items.length, maxRows) }, (_, i) => invoice.items[i]);

  return (
    <Document>
      <Page size="A4" style={stylesSimple.page}>
        {/* Header */}
        <View style={stylesSimple.header}>
          <View>
            <Text style={stylesSimple.companyName}>{profile.companyName}</Text>
            <Text style={stylesSimple.companyAddress}>{profile.companyAddress}</Text>
          </View>
          {profile.logo && <Image src={profile.logo} style={stylesSimple.logo} />}
        </View>

        {/* Bill To & Invoice Info */}
        <View style={stylesSimple.infoRow}>
          <View style={stylesSimple.billTo}>
            <Text style={stylesSimple.label}>Bill To</Text>
            <Text style={stylesSimple.value}>{invoice.client?.name || ''}</Text>
            <Text style={stylesSimple.valueNormal}>{invoice.client?.address || ''}</Text>
          </View>
          <View style={stylesSimple.invoiceInfo}>
            <Text style={stylesSimple.label}>Invoice No.</Text>
            <Text style={stylesSimple.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={[stylesSimple.label, { marginTop: 8 }]}>Date</Text>
            <Text style={stylesSimple.valueNormal}>{invoice.issueDate}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={stylesSimple.tableContainer}>
          <View style={stylesSimple.tableHeader}>
            <Text style={[stylesSimple.tableHeaderCell, stylesSimple.descCol]}>Description</Text>
            <Text style={[stylesSimple.tableHeaderCell, stylesSimple.qtyCol]}>Qty</Text>
            <Text style={[stylesSimple.tableHeaderCell, stylesSimple.rateCol]}>Rate</Text>
            <Text style={[stylesSimple.tableHeaderCell, stylesSimple.totalCol]}>Total</Text>
          </View>
          {rows.map((item, index) => {
            const hasItem = !!item;
            const lineTotal = hasItem ? item.quantity * item.unitPrice : 0;
            return (
              <View key={hasItem ? (item.id || String(index)) : `empty-${index}`} style={stylesSimple.tableRow}>
                <Text style={[stylesSimple.cellText, stylesSimple.descCol]}>{hasItem ? item.description : ''}</Text>
                <Text style={[stylesSimple.cellText, stylesSimple.qtyCol]}>{hasItem ? String(item.quantity) : ''}</Text>
                <Text style={[stylesSimple.cellText, stylesSimple.rateCol]}>{hasItem ? formatCurrencyINR(item.unitPrice) : ''}</Text>
                <Text style={[stylesSimple.cellText, stylesSimple.totalCol]}>{hasItem ? formatCurrencyINR(lineTotal) : ''}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={stylesSimple.totalsContainer}>
          <View style={stylesSimple.totalsBox}>
            <View style={stylesSimple.totalRow}>
              <Text style={stylesSimple.totalLabel}>Subtotal</Text>
              <Text style={stylesSimple.totalValue}>{formatCurrencyINR(subtotal)}</Text>
            </View>
            <View style={stylesSimple.totalRow}>
              <Text style={stylesSimple.totalLabel}>Total Tax</Text>
              <Text style={stylesSimple.totalValue}>{formatCurrencyINR(totalTax)}</Text>
            </View>
            <View style={stylesSimple.grandTotalRow}>
              <Text style={stylesSimple.grandTotalLabel}>Amount Due</Text>
              <Text style={stylesSimple.grandTotalValue}>{formatCurrencyINR(total)}</Text>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={stylesSimple.amountWords}>
          <Text style={stylesSimple.amountWordsLabel}>Amount in Words</Text>
          <Text style={stylesSimple.amountWordsValue}>{numberToWordsINR(total)}</Text>
        </View>

        {/* Footer */}
        <View style={stylesSimple.footer}>
          <View style={stylesSimple.footerLeft}>
            <Text style={stylesSimple.footerTitle}>Payment Details</Text>
            <Text style={stylesSimple.footerText}>{invoice.bankDetails?.accountName || ''}</Text>
            <Text style={stylesSimple.footerText}>A/C: {invoice.bankDetails?.accountNumber || ''}</Text>
            <Text style={stylesSimple.footerText}>{invoice.bankDetails?.bankName || ''} ({invoice.bankDetails?.ifsc || ''})</Text>
          </View>
          <View style={stylesSimple.footerRight}>
            <Text style={stylesSimple.footerTitle}>For {profile.companyName}</Text>
            {profile.companySeal ? <Image src={profile.companySeal} style={stylesSimple.sealImg} /> : <View style={{ height: 55 }} />}
            {profile.authorizedSignature ? <Image src={profile.authorizedSignature} style={stylesSimple.signImg} /> : <View style={{ height: 30 }} />}
            <Text style={stylesSimple.signLine}>Authorised Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}


// =========================================================================
// TEMPLATE 5 - CREATIVE STUDIO (Bold Modern Layout)
// =========================================================================
const stylesCreative = StyleSheet.create({
  page: { fontSize: 10, fontFamily: 'Helvetica', color: '#374151' },
  headerBand: { backgroundColor: '#2563EB', padding: 28, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerCompanyName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerAddress: { fontSize: 9, color: '#BFDBFE', marginTop: 2 },
  headerInvoiceTitle: { fontSize: 28, fontWeight: 'extralight', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 3 },
  headerInvoiceNo: { fontSize: 9, color: '#BFDBFE', marginTop: 4, textAlign: 'right' },
  headerLogo: { height: 35, objectFit: 'contain', marginTop: 10 },
  main: { padding: 28, flexGrow: 1 },
  metaRow: { flexDirection: 'row', marginBottom: 25 },
  metaLeft: { width: '60%' },
  metaRight: { width: '40%', alignItems: 'flex-end' },
  metaLabel: { fontSize: 8, fontWeight: 'bold', color: '#6b7280', marginBottom: 2 },
  metaValue: { fontSize: 10, color: '#1f2937' },
  metaValueBold: { fontSize: 12, fontWeight: 'bold', color: '#1f2937' },
  tableContainer: { flexGrow: 1, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', paddingBottom: 6, marginBottom: 2 },
  tableHeaderCell: { fontSize: 8, color: '#6b7280' },
  tableRow: { flexDirection: 'row', borderTopWidth: 0.5, borderColor: '#e5e7eb', paddingVertical: 6, minHeight: 20 },
  descCol: { width: '45%' },
  qtyCol: { width: '15%', textAlign: 'right' },
  rateCol: { width: '20%', textAlign: 'right' },
  amtCol: { width: '20%', textAlign: 'right' },
  cellText: { fontSize: 9 },
  cellTextBold: { fontSize: 10, fontWeight: 'bold', color: '#1f2937' },
  totalsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  totalsBox: { width: '40%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: '#6b7280' },
  totalValue: { fontSize: 9 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, marginTop: 4 },
  grandTotalLabel: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  grandTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  amountWords: { marginTop: 14 },
  amountWordsLabel: { fontSize: 8, fontWeight: 'bold', color: '#4b5563' },
  amountWordsValue: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase' },
  footerBand: { backgroundColor: '#f9fafb', padding: 28, flexDirection: 'row' },
  footerCol: { width: '33.33%' },
  footerColCenter: { width: '33.33%', paddingHorizontal: 10 },
  footerColRight: { width: '33.33%', alignItems: 'center' },
  footerTitle: { fontSize: 8, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
  footerText: { fontSize: 8, color: '#6b7280', marginBottom: 1 },
  sealImg: { width: 55, height: 55, objectFit: 'contain', opacity: 0.7, marginVertical: 3 },
  signImg: { height: 30, objectFit: 'contain', marginVertical: 3 },
  signLine: { fontSize: 8, color: '#6b7280', borderTopWidth: 0.5, borderColor: '#e5e7eb', paddingTop: 4, marginTop: 4 },
});

function TemplateCreativePDF({ invoice, profile }: DummyPDFProps) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;

  const maxRows = 12;
  const rows = Array.from({ length: Math.max(invoice.items.length, maxRows) }, (_, i) => invoice.items[i]);

  return (
    <Document>
      <Page size="A4" style={stylesCreative.page}>
        {/* Blue Header Band */}
        <View style={stylesCreative.headerBand}>
          <View style={stylesCreative.headerRow}>
            <View>
              <Text style={stylesCreative.headerCompanyName}>{profile.companyName}</Text>
              <Text style={stylesCreative.headerAddress}>{profile.companyAddress}</Text>
            </View>
            <View>
              <Text style={stylesCreative.headerInvoiceTitle}>Invoice</Text>
              <Text style={stylesCreative.headerInvoiceNo}>{invoice.invoiceNumber}</Text>
            </View>
          </View>
          {profile.logo && <Image src={profile.logo} style={stylesCreative.headerLogo} />}
        </View>

        {/* Main Content */}
        <View style={stylesCreative.main}>
          {/* Billed To & Dates */}
          <View style={stylesCreative.metaRow}>
            <View style={stylesCreative.metaLeft}>
              <Text style={stylesCreative.metaLabel}>Billed To:</Text>
              <Text style={stylesCreative.metaValueBold}>{invoice.client?.name || ''}</Text>
              <Text style={stylesCreative.metaValue}>{invoice.client?.address || ''}</Text>
            </View>
            <View style={stylesCreative.metaRight}>
              <Text style={stylesCreative.metaLabel}>Date of Issue:</Text>
              <Text style={stylesCreative.metaValue}>{invoice.issueDate}</Text>
              <Text style={[stylesCreative.metaLabel, { marginTop: 8 }]}>Due Date:</Text>
              <Text style={stylesCreative.metaValue}>{invoice.dueDate || ''}</Text>
            </View>
          </View>

          {/* Items Table */}
          <View style={stylesCreative.tableContainer}>
            <View style={stylesCreative.tableHeader}>
              <Text style={[stylesCreative.tableHeaderCell, stylesCreative.descCol]}>Description</Text>
              <Text style={[stylesCreative.tableHeaderCell, stylesCreative.qtyCol]}>Qty</Text>
              <Text style={[stylesCreative.tableHeaderCell, stylesCreative.rateCol]}>Rate</Text>
              <Text style={[stylesCreative.tableHeaderCell, stylesCreative.amtCol]}>Amount</Text>
            </View>
            {rows.map((item, index) => {
              const hasItem = !!item;
              const lineTotal = hasItem ? item.quantity * item.unitPrice : 0;
              return (
                <View key={hasItem ? (item.id || String(index)) : `empty-${index}`} style={stylesCreative.tableRow}>
                  <Text style={[stylesCreative.cellTextBold, stylesCreative.descCol]}>{hasItem ? item.description : ''}</Text>
                  <Text style={[stylesCreative.cellText, stylesCreative.qtyCol]}>{hasItem ? String(item.quantity) : ''}</Text>
                  <Text style={[stylesCreative.cellText, stylesCreative.rateCol]}>{hasItem ? formatCurrencyINR(item.unitPrice) : ''}</Text>
                  <Text style={[stylesCreative.cellText, stylesCreative.amtCol]}>{hasItem ? formatCurrencyINR(lineTotal) : ''}</Text>
                </View>
              );
            })}
          </View>

          {/* Totals */}
          <View style={stylesCreative.totalsContainer}>
            <View style={stylesCreative.totalsBox}>
              <View style={stylesCreative.totalRow}>
                <Text style={stylesCreative.totalLabel}>Subtotal</Text>
                <Text style={stylesCreative.totalValue}>{formatCurrencyINR(subtotal)}</Text>
              </View>
              <View style={stylesCreative.totalRow}>
                <Text style={stylesCreative.totalLabel}>Taxes</Text>
                <Text style={stylesCreative.totalValue}>{formatCurrencyINR(totalTax)}</Text>
              </View>
              <View style={stylesCreative.grandTotalRow}>
                <Text style={stylesCreative.grandTotalLabel}>Total</Text>
                <Text style={stylesCreative.grandTotalValue}>{formatCurrencyINR(total)}</Text>
              </View>
            </View>
          </View>

          {/* Amount in Words */}
          <View style={stylesCreative.amountWords}>
            <Text style={stylesCreative.amountWordsLabel}>Amount in Words:</Text>
            <Text style={stylesCreative.amountWordsValue}>{numberToWordsINR(total)}</Text>
          </View>
        </View>

        {/* Gray Footer Band */}
        <View style={stylesCreative.footerBand}>
          <View style={stylesCreative.footerCol}>
            <Text style={stylesCreative.footerTitle}>Bank Details</Text>
            <Text style={stylesCreative.footerText}>A/C: {invoice.bankDetails?.accountNumber || ''}</Text>
            <Text style={stylesCreative.footerText}>{invoice.bankDetails?.bankName || ''}</Text>
            <Text style={stylesCreative.footerText}>IFSC: {invoice.bankDetails?.ifsc || ''}</Text>
          </View>
          <View style={stylesCreative.footerColCenter}>
            <Text style={stylesCreative.footerTitle}>Terms</Text>
            <Text style={stylesCreative.footerText}>{invoice.termsAndConditions || ''}</Text>
          </View>
          <View style={stylesCreative.footerColRight}>
            <Text style={stylesCreative.footerTitle}>For {profile.companyName}</Text>
            {profile.companySeal ? <Image src={profile.companySeal} style={stylesCreative.sealImg} /> : <View style={{ height: 55 }} />}
            {profile.authorizedSignature ? <Image src={profile.authorizedSignature} style={stylesCreative.signImg} /> : <View style={{ height: 30 }} />}
            <Text style={stylesCreative.signLine}>Authorized Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}


// =========================================================================
// SMART EXPORT ROUTER
// =========================================================================
export default function DummyPDF(props: DummyPDFProps) {
  let selectedTemplate = props.templateId;
  
  if (!selectedTemplate && typeof window !== "undefined") {
    selectedTemplate = localStorage.getItem("zenbill_template") || "default";
  }

  if (selectedTemplate === "tally") return <TemplateTallyPDF {...props} />;
  if (selectedTemplate === "template3") return <TemplateThreePDF {...props} />;
  if (selectedTemplate === "simple") return <TemplateSimplePDF {...props} />;
  if (selectedTemplate === "creative") return <TemplateCreativePDF {...props} />;

  return <TemplateDefaultPDF {...props} />;
}