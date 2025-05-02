import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import React from "react";

// Page dimensions
const PAGE_WIDTH = 849.89;
const PAGE_HEIGHT = 595.28;

// Styles
const styles = StyleSheet.create({
  page: {
    position: "relative",
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    backgroundColor: "white",
    fontFamily: "Times-Roman",
  },
  fullPageWrapper: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  sideBorder: {
    position: "absolute",
    top: 0,
    height: PAGE_HEIGHT,
    width: 1000, // Adjust depending on your border image width
  },
  leftBorder: {
    left: 0,
  },
  rightBorder: {
    right: 0,
  },
  contentContainer: {
    position: "relative",
    paddingLeft: 80, // push content in from left border
    paddingRight: 80, // push content in from right border
    paddingTop: 60,
    paddingBottom: 60,
    alignItems: "center",
    textAlign: "center",
    height: "100%",
    justifyContent: "center",
    zIndex: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 20,
    marginBottom: 30,
  },
  name: {
    fontSize: 30,
    fontWeight: "bold",
    marginVertical: 10,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 50,
    width: "100%",
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
  job: string;
  companyName: string;
  companyLogo: string;
  supervisorSig: string;
  coordinatorSig: string;
  leftSide: string;
  rightSide: string;
}

const CertificatePDF: React.FC<CertificateProps> = ({
  companyName,
  companyLogo,
  name,
  job,
  supervisorSig,
  coordinatorSig,
  leftSide,
  rightSide,
}) => {
  return (
    <Document>
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        {/* Background borders */}
        <View style={styles.fullPageWrapper}>
          {leftSide && (
            <Image src={leftSide} style={[styles.sideBorder, styles.leftBorder]} />
          )}
          {rightSide && (
            <Image src={rightSide} style={[styles.sideBorder, styles.rightBorder]} />
          )}
        </View>

        {/* Main content */}
        <View style={styles.contentContainer}>
          {companyLogo && (
            <Image
              src={companyLogo}
              style={{ width: 100, height: 80, marginBottom: 10 }}
            />
          )}
          <Text style={styles.header}>{companyName} Philippines</Text>
          <Text style={styles.title}>CERTIFICATE OF COMPLETION</Text>

          <Text style={styles.subHeader}>This award is proudly presented to</Text>
          <Text style={styles.name}>{name}</Text>

          <Text style={styles.bodyText}>
            for successfully completing 300 hours of {job} for On-the-Job Training (OJT)
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
        </View>
      </Page>
    </Document>
  );
};

export default CertificatePDF;
