import { Page, Text, View, Document, StyleSheet, Image } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
    page:{
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 13,
        lineHeight: 1.5,
    },
    section: {
        marginBottom:10,
    },
    justifySection: {
        textAlign: "justify"
    },
    signature:{
        width:150,
        height:80,
        marginTop: 20,
    },
    img_header:{
        width: '100%',
        marginBottom: 20,
    }
})

interface userInfo{
    name: string
    position: string,
    company:string,
    companyAddress:string,
    companyEmail:string,
    date: string,
    signatureUrl: string,
    endorsementHeader:string,
    dean: string
}

const EndorsementPDF : React.FC<userInfo> =({name,position,company, companyAddress, companyEmail,date,signatureUrl, endorsementHeader, dean}) => {
    return(
    //Warning wag tularan 
    <Document>
        <Page size="A4" style={styles.page}>
        {/*Letter Header*/} 
        { endorsementHeader &&(
            <Image src={endorsementHeader} style={styles.img_header}/>
        )

        }
        <View style={styles.section}>
            <Text>Date: {date}</Text>
        </View>
        <View style={styles.section}>
            <Text>To: {company}</Text>
            <Text>To: {companyAddress}</Text>
            <Text>To: {companyEmail}</Text>
        </View>

        <View style={styles.section}>
          <Text>Dear Hiring Manager,</Text>
        </View>
        {/*Letter Content*/} 
        <View style={styles.section}>
        <Text style={styles.justifySection}>
          I am writing to formally endorse <Text>{name}</Text>  to be  <Text>{position}</Text> in
          your organization. Their contributions and dedication make them an
          excellent fit for your team. I highly recommend them without
          reservation.
        </Text>
        </View>

        <View>
            <Text style={styles.justifySection}>
                Thank You for your consideration
            </Text>
        </View>
        {/*Signature and Details*/} 
        <View>
            <Text>Sincerly,</Text>
            <Text>{dean}</Text>
            {/*This is the image */}
            {signatureUrl && (<Image src={signatureUrl} style={styles.signature}/>)}
        </View>
        </Page>
    </Document>


    )
}

export default EndorsementPDF;