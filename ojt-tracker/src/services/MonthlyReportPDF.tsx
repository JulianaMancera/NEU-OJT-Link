import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  headerImage: {
    width: '100%',
    marginBottom: 20,
  },
  section: { 
    marginBottom: 15 
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableColHeader: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    padding: 5,
    backgroundColor: "#e6f7ff",
  },
  tableCol: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableColWide: {
    width: "40%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    padding: 5,
  },
  tableCellHeader: {
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
    color: "#0066cc"
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10
  },
  textRight: {
    textAlign: "right"
  },
  totalRow: {
    backgroundColor: "#f0f9ff"
  }
});

interface ReportEntry {
  week: number;
  date: string;
  hours: string;
}

interface MonthlyReportProps {
  name: string;
  position: string;
  company: string;
  date: string;
  reportData: ReportEntry[];
  totalHours: number;
}

const MonthlyReportPDF: React.FC<MonthlyReportProps> = ({
  name,
  position,
  company,
  date,
  reportData,
  totalHours,
}) => {
  const reportPeriod = date.slice(0, 7);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Image Placeholder */}
        <View style={styles.headerImage}>
            <Image src={'MonthlyReportHeader.png'} />
        </View>

        {/* Header */}
        <View style={styles.section}>
          <Text>Date: {date}</Text>
        </View>
        <View style={styles.section}>
          <Text>To: {company}</Text>
          <Text>Subject: Monthly Report Submission</Text>
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text>
            I, {name}, currently working as a {position}, am submitting my monthly
            report for the period of {reportPeriod}. Below is a summary of the
            weekly hours rendered:
          </Text>
        </View>

        {/* Table with borders */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Week #</Text>
            </View>
            <View style={[styles.tableColHeader, styles.tableColWide]}>
              <Text style={styles.tableCellHeader}>Week Starting</Text>
            </View>
            <View style={[styles.tableColHeader, styles.tableColWide]}>
              <Text style={styles.tableCellHeader}>Hours Rendered</Text>
            </View>
          </View>
          
          {/* Table Rows */}
          {reportData.map((entry, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{entry.week}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColWide]}>
                <Text style={styles.tableCell}>{entry.date}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColWide]}>
                <Text style={[styles.tableCell]}>{entry.hours}</Text>
              </View>
            </View>
          ))}
          
          {/* Table Footer */}
          <View style={[styles.tableRow, styles.totalRow]}>
            <View style={[styles.tableCol, {width: "60%"}]}>
              <Text style={[styles.tableCell, {fontWeight: "bold"}]}>Total Hours</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColWide]}>
              <Text style={[styles.tableCell, {fontWeight: "bold"}]}>
                {totalHours}
              </Text>
            </View>
          </View>
        </View>

        {/* Closing */}
        <View style={styles.section}>
          <Text>Thank you.</Text>
          <Text>Sincerely,</Text>
          <Text>{name}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default MonthlyReportPDF;