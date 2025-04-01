import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
    page:{
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        lineHeight: 1.5,
    },
    section: {marginBottom:10},
    signature:{
        width:150,
        height:80,
        marginTop: 20,
    }
})

interface userInfo{
    name: string
    position: string,
    company:string,
    companyAddress:string,
    companyEmail:string,
    date: string,
    signatureUrl: string
}

const EndorsementPDF : React.FC<userInfo> =({name,position,company, companyAddress, companyEmail,date,signatureUrl}) => {
    return(
    //Warning wag tularan 
    <Document>
        <Page size="A4" style={styles.page}>
        {/*Letter Header*/} 
        <View style={styles.section}>
            <Text>Date: {date}</Text>
        </View>
        <View style={styles.section}>
            <Text>To: {company}</Text>
            <Text>To: {companyAddress}</Text>
            <Text>To: {companyEmail}</Text>
            <Text>Dear Hiring Manager,</Text>
        </View>

        {/*Letter Content*/} 
        <View style={styles.section}>
        <Text>
          I am writing to formally endorse <Text>{name}</Text>  to be  <Text>{position}</Text> in
          your organization. Their contributions and dedication make them an
          excellent fit for your team. I highly recommend them without
          reservation.
        </Text>
        </View>

        <View>
            <Text>
                Thank You for your consideration
            </Text>
        </View>
        {/*Signature and Details*/} 
        <View>
            <Text>Sincerly,</Text>
            <Text>Wonka</Text>
            <Text>NEUCutie</Text>
            {/*This is the image */}
            {signatureUrl && (<Image src={signatureUrl} style={styles.signature}/>)}
        </View>
        </Page>
    </Document>


    )
}

export default EndorsementPDF;