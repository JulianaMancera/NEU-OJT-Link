import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import React from "react";

// Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#F5F5F5",
    padding: 40,
    fontFamily: "Helvetica",
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 12,
    marginBottom: 30,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 12,
    marginBottom: 30,
    marginHorizontal: 50,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 50,
  },
  sigBlock: {
    alignItems: "center",
  },
  sigImage: {
    width: 100,
    height: 50,
  },
  sigLabel: {
    fontSize: 10,
    marginTop: 5,
  },
});

interface CertificateProps {
  name: string;
  companyName: string;
  supervisorSig: string; // URL to signature image
  coordinatorSig: string; // URL to signature image
}

// Component
const CertificatePDF: React.FC<CertificateProps> = ({ companyName,name, supervisorSig, coordinatorSig }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{companyName} Philippines</Text>
        <Text style={styles.title}>CERTIFICATE OF COMPLETION</Text>

        <Text style={styles.subHeader}>This award is proudly presented to</Text>
        <Text style={styles.name}>{name}</Text>

        <Text style={styles.bodyText}>
          for successfully completing 300 hours of On-the-Job Training (OJT)
          through NEU OJT-LINK with demonstrated dedication and skill.
        </Text>

        <View style={styles.signatures}>
          <View style={styles.sigBlock}>
            {supervisorSig && <Image src={supervisorSig} style={styles.sigImage} />}
            <Text>Jamie Chastain</Text>
            <Text style={styles.sigLabel}>Supervisor</Text>
          </View>
          <View style={styles.sigBlock}>
            {coordinatorSig && <Image src={coordinatorSig} style={styles.sigImage} />}
            <Text>Jamie Chastain</Text>
            <Text style={styles.sigLabel}>OJT Coordinator</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CertificatePDF;
