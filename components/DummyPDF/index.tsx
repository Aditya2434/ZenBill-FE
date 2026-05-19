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
    padding: 12,
    paddingTop: 24,
  },
  container: {
    borderWidth: 1,
    width: "100%",
  },
  boldText: {
    fontWeight: "bold",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
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
    flexGrow: 1,
    marginHorizontal: 12,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  companyHeaderName: {
    fontSize: 20,
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
    height: 36,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
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
    padding: 8,
  },
  transportInvoiceDetails: {
    flex: 1,
    padding: 8,
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
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    marginBottom: 3,
  },
  stateWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
  },
  codeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
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
    width: "60%",
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
    width: "60%",
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
    marginBottom: 8,
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
    padding: 8,
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
    flex: 2,
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
    width: 80,
    borderRightWidth: 1,
  },
  rate: {
    width: 70,
    borderRightWidth: 1,
  },
  total: {
    width: 90,
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
    height: 90,
  },
  footerSubject: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  fSLabel: {
    fontSize: 8,
    paddingBottom: 6,
    paddingLeft: 8,
  },
  footerStamp: {
    flex: 1,
    padding: 8,
    flexDirection: "column",
    alignItems: "center",
  },
  fStampStampImg: {
    width: 92,
    height: 92,
    objectFit: "contain",
    alignSelf: "center",
  },
  fStampLabel: {
    paddingTop: 6,
    fontSize: 8,
    paddingBottom: 6,
    textAlign: "center",
  },
  footerSignature: {
    flex: 1,
    padding: 8,
    flexDirection: "column",
  },
  fSignLabel: {
    marginBottom: 6,
    fontSize: 8,
  },
  fSignPhoto: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  fSignLabelAuth: {
    paddingTop: 6,
    paddingBottom: 6,
    alignSelf: "flex-end",
    fontSize: 8,
  },
  bottomBlock: {
    marginTop: 8,
  },
  bankRowHeader: {
    fontSize: 8,
    fontWeight: "bold",
  },
});

function TemplateDefaultPDF({ invoice, profile }: DummyPDFProps) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;

  const totalRows = 11;
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
              <Text style={styles.companyHeaderName}>{profile.companyName || "COMPANY NAME"}</Text>
              <Text style={styles.companyHeaderAddress}>{profile.companyAddress || ""}</Text>
              <Text style={[styles.companyHeaderGSTIN, styles.boldText]}>GSTIN: {profile.gstin || ""}</Text>
              <Text style={[styles.companyHeaderPAN, styles.boldText]}>PAN: {profile.pan || ""}</Text>
            </View>
            <View style={styles.companyQR}></View>
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
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.issueDate}</Text>
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
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.dateOfSupply || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Place of Supply</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.placeOfSupply || ""}</Text>
                </View>
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
                <Text style={styles.lwvLabel}>Name</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.client?.name || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Address</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.client?.address || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>GSTIN</Text>
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
                <Text style={styles.lwvLabel}>Name</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={[styles.lwvValue, styles.boldText]}>{invoice.shippingDetails?.name || invoice.client?.name || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>Address</Text>
                <View style={styles.lwvValueWrapper}>
                  <Text style={styles.lwvColon}>:</Text>
                  <Text style={styles.lwvValue}>{invoice.shippingDetails?.address || invoice.client?.address || ""}</Text>
                </View>
              </View>
              <View style={styles.labelWithValue}>
                <Text style={styles.lwvLabel}>GSTIN</Text>
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
                <Text style={[styles.fSignLabelAuth, styles.boldText]}>Authorised</Text>
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
  label: { fontSize: 7, color: "#444", marginBottom: 2 },
  value: { fontWeight: "bold", fontSize: 8 },
  tableHeader: { backgroundColor: "#f0f0f0", textAlign: "center", fontWeight: "bold" },
});

function TemplateTallyPDF({ invoice, profile }: DummyPDFProps) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgstAmount = subtotal * ((invoice.cgstRate || 0) / 100);
  const sgstAmount = subtotal * ((invoice.sgstRate || 0) / 100);
  const igstAmount = subtotal * ((invoice.igstRate || 0) / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal + totalTax;

  return (
    <Document>
      <Page size="A4" style={stylesTally.page}>
        <View style={stylesTally.container}>
          <View style={[stylesTally.borderBottom, { padding: 12, minHeight: 90, flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ width: '25%', alignItems: 'flex-start', justifyContent: 'center' }}>
              {profile.logo && <Image src={profile.logo} style={{ width: 75, height: 75, objectFit: 'contain' }} />}
            </View>
            <View style={{ width: '50%', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[stylesTally.bold, { fontSize: 16, marginBottom: 6, textAlign: 'center', textTransform: 'uppercase' }]}>{profile.companyName}</Text>
              <Text style={{ textAlign: 'center', marginBottom: 2 }}>{profile.companyAddress}</Text>
              <Text style={{ textAlign: 'center', marginBottom: 2 }}>State: {profile.companyState} | Code: {profile.companyStateCode}</Text>
              {profile.email && <Text style={{ textAlign: 'center', marginBottom: 2 }}>Email: {profile.email}</Text>}
              <Text style={{ marginTop: 3, textAlign: 'center' }}>PAN No.: <Text style={stylesTally.bold}>{profile.pan}</Text> | GSTIN: <Text style={stylesTally.bold}>{profile.gstin}</Text></Text>
            </View>
            <View style={{ width: '25%', alignItems: 'flex-end', justifyContent: 'center' }}>
               <View style={{ width: 60, height: 60, borderWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' }}>
                  <Text style={{ color: '#aaa', fontSize: 8 }}>QR CODE</Text>
               </View>
            </View>
          </View>

          <View style={[stylesTally.borderBottom, stylesTally.p2, { backgroundColor: '#f0f0f0' }]}>
             <Text style={[stylesTally.bold, stylesTally.textCenter, { fontSize: 14, letterSpacing: 2, paddingVertical: 4 }]}>TAX INVOICE</Text>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom]}>
            <View style={[{ width: "50%" }, stylesTally.col, stylesTally.borderRight]}>
              <View style={[stylesTally.p4, stylesTally.borderBottom, { minHeight: 90 }]}>
                <Text style={stylesTally.label}>Consignee (Ship to)</Text>
                <Text style={stylesTally.value}>{invoice.shippingDetails?.name || invoice.client.name}</Text>
                <Text>{invoice.shippingDetails?.address || invoice.client.address}</Text>
                <Text>State: {invoice.shippingDetails?.state || invoice.client.state} | Code: {invoice.shippingDetails?.stateCode || invoice.client.stateCode}</Text>
                <Text>GSTIN: {invoice.shippingDetails?.gstin || invoice.client.gstin}</Text>
              </View>
              <View style={[stylesTally.p4, { minHeight: 90 }]}>
                <Text style={stylesTally.label}>Buyer (Bill to)</Text>
                <Text style={stylesTally.value}>{invoice.client.name}</Text>
                <Text>{invoice.client.address}</Text>
                <Text>State: {invoice.client.state} | Code: {invoice.client.stateCode}</Text>
                <Text>GSTIN: {invoice.client.gstin}</Text>
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
                  <Text style={stylesTally.value}>{invoice.grLrNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Mode/Terms of Payment</Text>
                  <Text style={stylesTally.value}>-</Text>
                </View>
              </View>
              <View style={[stylesTally.row, stylesTally.borderBottom]}>
                <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Reference No. & Date.</Text>
                  <Text style={stylesTally.value}>-</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Other Reference(s)</Text>
                  <Text style={stylesTally.value}>-</Text>
                </View>
              </View>
              <View style={[stylesTally.row, stylesTally.borderBottom]}>
                <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Buyer's Order No.</Text>
                  <Text style={stylesTally.value}>{invoice.orderNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Dated</Text>
                  <Text style={stylesTally.value}>-</Text>
                </View>
              </View>
              <View style={[stylesTally.row, stylesTally.borderBottom]}>
                <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Dispatch Doc No.</Text>
                  <Text style={stylesTally.value}>{invoice.eWayBillNo || "-"}</Text>
                </View>
                <View style={[{ width: "50%" }, stylesTally.p4]}>
                  <Text style={stylesTally.label}>Delivery Note Date</Text>
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
                <Text style={stylesTally.value}>{invoice.termsAndConditions || "-"}</Text>
              </View>
            </View>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom, stylesTally.tableHeader]}>
            <View style={[{ width: "5%" }, stylesTally.borderRight, stylesTally.p4]}><Text>Sl No.</Text></View>
            <View style={[{ width: "35%" }, stylesTally.borderRight, stylesTally.p4]}><Text>Description of Goods</Text></View>
            <View style={[{ width: "12%" }, stylesTally.borderRight, stylesTally.p4]}><Text>HSN/SAC</Text></View>
            <View style={[{ width: "12%" }, stylesTally.borderRight, stylesTally.p4]}><Text>Quantity</Text></View>
            <View style={[{ width: "12%" }, stylesTally.borderRight, stylesTally.p4]}><Text>Rate</Text></View>
            <View style={[{ width: "8%" }, stylesTally.borderRight, stylesTally.p4]}><Text>Per</Text></View>
            <View style={[{ width: "16%" }, stylesTally.p4]}><Text>Amount</Text></View>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom, { minHeight: 200 }]}>
            <View style={[{ width: "5%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textCenter]}>
              {invoice.items.map((_, i) => <Text key={i} style={{ marginBottom: 4 }}>{i + 1}</Text>)}
            </View>
            <View style={[{ width: "35%" }, stylesTally.borderRight, stylesTally.p4]}>
              {invoice.items.map((item, i) => <Text key={i} style={[stylesTally.bold, { marginBottom: 4 }]}>{item.description}</Text>)}
              <View style={{ marginTop: 20 }}>
                 {cgstAmount > 0 && <Text style={[stylesTally.textRight, stylesTally.bold]}>CGST:</Text>}
                 {sgstAmount > 0 && <Text style={[stylesTally.textRight, stylesTally.bold]}>SGST:</Text>}
                 {igstAmount > 0 && <Text style={[stylesTally.textRight, stylesTally.bold]}>IGST:</Text>}
              </View>
            </View>
            <View style={[{ width: "12%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textCenter]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{item.hsnCode || "-"}</Text>)}
            </View>
            <View style={[{ width: "12%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textRight]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{item.quantity}</Text>)}
            </View>
            <View style={[{ width: "12%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textRight]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{formatCurrencyINR(item.unitPrice)}</Text>)}
            </View>
            <View style={[{ width: "8%" }, stylesTally.borderRight, stylesTally.p4, stylesTally.textCenter]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{item.uom || "-"}</Text>)}
            </View>
            <View style={[{ width: "16%" }, stylesTally.p4, stylesTally.textRight]}>
              {invoice.items.map((item, i) => <Text key={i} style={{ marginBottom: 4 }}>{formatCurrencyINR(item.quantity * item.unitPrice)}</Text>)}
              <View style={{ marginTop: 20 }}>
                 {cgstAmount > 0 && <Text>{formatCurrencyINR(cgstAmount)}</Text>}
                 {sgstAmount > 0 && <Text>{formatCurrencyINR(sgstAmount)}</Text>}
                 {igstAmount > 0 && <Text>{formatCurrencyINR(igstAmount)}</Text>}
              </View>
            </View>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom]}>
             <View style={[{ width: "84%" }, stylesTally.borderRight, stylesTally.p4, { alignItems: "flex-end" }]}>
                <Text style={stylesTally.bold}>Total</Text>
             </View>
             <View style={[{ width: "16%" }, stylesTally.p4, stylesTally.textRight]}>
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
          <View style={[stylesTally.row, stylesTally.borderBottom]}>
             <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2, stylesTally.textCenter]}><Text>As per items</Text></View>
             <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2, stylesTally.textRight]}><Text>{formatCurrencyINR(subtotal)}</Text></View>
             <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2, stylesTally.textRight]}><Text>{formatCurrencyINR(cgstAmount)}</Text></View>
             <View style={[{ width: "20%" }, stylesTally.borderRight, stylesTally.p2, stylesTally.textRight]}><Text>{formatCurrencyINR(sgstAmount)}</Text></View>
             <View style={[{ width: "20%" }, stylesTally.p2, stylesTally.textRight]}><Text>{formatCurrencyINR(totalTax)}</Text></View>
          </View>

          <View style={[stylesTally.row, stylesTally.borderBottom]}>
             <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                <Text style={[stylesTally.label, { textDecoration: "underline", marginBottom: 4 }]}>Company's Bank Details</Text>
                <View style={stylesTally.row}><Text style={[{ width: "30%" }, stylesTally.label]}>Bank Name</Text><Text style={stylesTally.value}>: {invoice.bankDetails?.bankName || profile.defaultBankDetails?.bankName || ""}</Text></View>
                <View style={stylesTally.row}><Text style={[{ width: "30%" }, stylesTally.label]}>A/c No.</Text><Text style={stylesTally.value}>: {invoice.bankDetails?.accountNumber || profile.defaultBankDetails?.accountNumber || ""}</Text></View>
                <View style={stylesTally.row}><Text style={[{ width: "30%" }, stylesTally.label]}>Branch & IFSC</Text><Text style={stylesTally.value}>: {invoice.bankDetails?.branch || profile.defaultBankDetails?.branch || ""} & {invoice.bankDetails?.ifsc || profile.defaultBankDetails?.ifsc || ""}</Text></View>
             </View>
             <View style={[{ width: "50%" }, stylesTally.p4]}>
                <Text style={[stylesTally.label, { textDecoration: "underline", marginBottom: 4 }]}>Company's Tax Details</Text>
                <View style={stylesTally.row}><Text style={[{ width: "30%" }, stylesTally.label]}>PAN</Text><Text style={stylesTally.value}>: {profile.pan}</Text></View>
                <View style={stylesTally.row}><Text style={[{ width: "30%" }, stylesTally.label]}>GSTIN</Text><Text style={stylesTally.value}>: {profile.gstin}</Text></View>
             </View>
          </View>

          <View style={[stylesTally.row, { flexGrow: 1 }]}>
             <View style={[{ width: "50%" }, stylesTally.borderRight, stylesTally.p4]}>
                <Text style={[stylesTally.label, { textDecoration: "underline", marginBottom: 4 }]}>Declaration</Text>
                <Text style={{ marginTop: 2, lineHeight: 1.3 }}>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</Text>
             </View>
             <View style={[{ width: "50%" }, stylesTally.p4, { justifyContent: "space-between" }]}>
                <Text style={[stylesTally.bold, stylesTally.textRight]}>for {profile.companyName}</Text>
                {profile.authorizedSignature ? (
                  <Image src={profile.authorizedSignature} style={{ height: 40, objectFit: 'contain', alignSelf: 'flex-end', marginTop: 10 }} />
                ) : (
                  <View style={{ height: 40, marginTop: 10 }} />
                )}
                <Text style={[stylesTally.textRight, stylesTally.label]}>Authorised Signatory</Text>
             </View>
          </View>
        </View>
        <Text style={[stylesTally.textCenter, { marginTop: 4, fontSize: 7, color: "#888" }]}>This is a Computer Generated Invoice</Text>
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

  const totalRows = 11;
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
                <Text style={[styles.fSignLabelAuth, styles.boldText]}>Authorised</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}


// =========================================================================
// 5. SMART EXPORT ROUTER
// =========================================================================
export default function DummyPDF(props: DummyPDFProps) {
  let selectedTemplate = props.templateId;
  
  if (!selectedTemplate && typeof window !== "undefined") {
    selectedTemplate = localStorage.getItem("zenbill_template") || "default";
  }

  if (selectedTemplate === "tally") {
    return <TemplateTallyPDF {...props} />;
  }

  if (selectedTemplate === "template3") {
    return <TemplateThreePDF {...props} />;
  }

  return <TemplateDefaultPDF {...props} />;
}