import axios from "axios";

// Podaci sa tvog Infobip Dashboarda
const API_KEY = process.env.INFOBIP_API_KEY; 
const BASE_URL = process.env.INFOBIP_BASE_URL;

export const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    // Čišćenje broja (Infobip traži format npr. 38761123456)
    const cleanNumber = phoneNumber.replace(/\D/g, ""); 

    const response = await axios.post(
      `${BASE_URL}/sms/2/text/advanced`,
      {
        messages: [{
          destinations: [{ to: cleanNumber }],
          from: "SwiftMed",
          text: message
        }]
      },
      {
        headers: {
          'Authorization': `App ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log("SMS uspješno poslan preko Infobipa:", response.data);
    return true;
  } catch (error: any) {
    console.error("Greška pri slanju SMS-a:", error.response?.data || error.message);
    return false;
  }
};