import axios from "axios";

// Podaci sa tvog Infobip Dashboarda
const API_KEY = "078f57d51d74347b96548ee707aa2bd1-e687457f-a97d-4d23-89c3-6d2f722a62c9"; 
const BASE_URL = "https://x1qpjq.api.infobip.com"; 

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