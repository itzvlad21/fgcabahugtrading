const https = require('follow-redirects').https;
require('dotenv').config();

class SMSService {
    constructor() {
        this.options = {
            'method': 'POST',
            'hostname': process.env.INFOBIP_HOST,
            'path': '/sms/2/text/advanced',
            'headers': {
                'Authorization': `App ${process.env.INFOBIP_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            'maxRedirects': 20
        };
    }

    async sendBookingConfirmation(phoneNumber, bookingDetails) {
        // Sanitize phone number
        const cleanPhone = this.sanitizePhoneNumber(phoneNumber);
        
        if (!this.isValidPhoneNumber(cleanPhone)) {
            throw new Error('Invalid phone number');
        }

        const message = {
            messages: [{
                destinations: [{ to: cleanPhone }],
                from: "FGCabahug",
                text: `Thank you for booking with FG Cabahug Trading! Your appointment is scheduled for ${bookingDetails.date}. Need to change your booking? Please contact us at our landline.`
            }]
        };

        return this.sendSMS(message);
    }

    sanitizePhoneNumber(phone) {
        // Remove all non-numeric characters
        let cleaned = phone.replace(/\D/g, '');
        
        // Ensure it starts with 63 for Philippines
        if (cleaned.startsWith('0')) {
            cleaned = '63' + cleaned.substring(1);
        } else if (!cleaned.startsWith('63')) {
            cleaned = '63' + cleaned;
        }
        
        return cleaned;
    }

    isValidPhoneNumber(phone) {
        // Basic validation for Philippine numbers
        return /^63\d{10}$/.test(phone);
    }

    sendSMS(messageData) {
        return new Promise((resolve, reject) => {
            const req = https.request(this.options, (res) => {
                const chunks = [];
                
                res.on("data", (chunk) => chunks.push(chunk));
                
                res.on("end", () => {
                    const body = Buffer.concat(chunks);
                    resolve(JSON.parse(body.toString()));
                });
                
                res.on("error", (error) => reject(error));
            });

            req.on('error', (error) => reject(error));
            req.write(JSON.stringify(messageData));
            req.end();
        });
    }
}

module.exports = new SMSService();