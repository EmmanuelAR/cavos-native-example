// Twilio configuration from Expo constants
const TWILIO_ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;

class TwilioService {
    constructor() {
        this.baseUrl = `https://verify.twilio.com/v2/Services/VA747cb855176fefb6ba56f5bd9c11f2b1`;
    }

    // Send verification code via Twilio Verify
    async sendOTP(phoneNumber) {
        // Ensure phone number has proper E.164 format
        let formattedPhone = phoneNumber;
        if (!phoneNumber.startsWith('+')) {
            formattedPhone = `+${phoneNumber}`;
        }

        try {
            // Use FormData to avoid encoding issues
            const formData = new FormData();
            formData.append('To', formattedPhone.trim());
            formData.append('Channel', 'sms');

            const response = await fetch(`${this.baseUrl}/Verifications`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Twilio Verify Error:', errorData);
                throw new Error(`Twilio Verify API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }

            const result = await response.json();
            return { success: true, verificationSid: result.sid };
        } catch (error) {
            console.error('Error sending verification code:', error);
            throw new Error('Failed to send verification code');
        }
    }

    // Verify OTP using Twilio Verify
    async verifyOTP(phoneNumber, code) {
        // Ensure phone number has proper E.164 format
        let formattedPhone = phoneNumber;
        if (!phoneNumber.startsWith('+')) {
            formattedPhone = `+${phoneNumber}`;
        }
        try {
            const formData = new FormData();
            formData.append('To', formattedPhone.trim());
            formData.append('Code', code);
            const response = await fetch(`${this.baseUrl}/VerificationCheck`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Twilio Verify Check Error:', errorData);
                return { valid: false, message: 'Invalid verification code' };
            }

            const result = await response.json();

            if (result.status === 'approved') {
                return { valid: true };
            } else {
                return { valid: false, message: 'Invalid or expired verification code' };
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return { valid: false, message: 'Error verifying code' };
        }
    }

    async saveUserProfile(phoneNumber, userId = null) {
        try {
            return { success: true };
        } catch (error) {
            console.error('Error saving user profile:', error);
            throw new Error('Failed to save user profile');
        }
    }
}

export const twilioService = new TwilioService(); 