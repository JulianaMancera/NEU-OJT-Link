import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  section: { marginBottom: 10 },
  title: { fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  tableHeader: { flexDirection: "row", borderBottom: 1, marginBottom: 4 },
  tableRow: { flexDirection: "row", marginBottom: 2 },
  cell: { width: "50%", paddingRight: 10 },
  rightCell: { width: "50%", textAlign: "right" }
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
  totalHours
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
            report for the period of {date.slice(0, 7)}. Below is a summary of the
            weekly hours rendered:
          </Text>
        </View>

        <View style={styles.section}>
  <View style={styles.tableHeader}>
    <Text style={{ width: "20%" }}>Week #</Text>
    <Text style={{ width: "40%" }}>Week Starting</Text>
    <Text style={{ width: "40%", textAlign: "right" }}>Hours Rendered</Text>
  </View>

  {reportData.map((entry, index) => (
    <View key={index} style={styles.tableRow}>
      <Text style={{ width: "20%" }}>{entry.week}</Text>
      <Text style={{ width: "40%" }}>{entry.date}</Text>
      <Text style={{ width: "40%", textAlign: "right" }}>{entry.hours}</Text>
    </View>
  ))}

  <View style={{ ...styles.tableRow, borderTop: 1, marginTop: 5, paddingTop: 5 }}>
    <Text style={{ width: "60%" }}>Total Hours</Text>
    <Text style={{ width: "40%", textAlign: "right" }}>{totalHours}</Text>
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
