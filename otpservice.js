
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sakshigawande13@gmail.com',
        pass: 'saub nexy mfzl fqpy' // Replace with environment variable in production
    }
});

// In-memory OTP store
const otpStore = {};

// Function to send OTP
const sendOtp = (email) => {
    const otp = crypto.randomInt(100000, 999999);
    const mailOptions = {
        from: 'sakshigawande13@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
    };

    otpStore[email] = { otp, expires: Date.now() + 300000 };
    console.log(`Sent OTP: ${otp} to ${email}, expires at ${new Date(otpStore[email].expires)}`);

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error) => {
            if (error) reject('Failed to send OTP');
            else resolve('OTP sent successfully');
        });
    });
};


// Function to resend OTP
const resendOtp = (email) => {
    const newOtp = crypto.randomInt(100000, 999999); // Generate new OTP
    const mailOptions = {
        from: 'sakshigawande13@gmail.com',
        to: email,
        subject: 'Your New OTP Code',
        text: `Your new OTP code is ${newOtp}` // Send the new OTP in email
    };

    otpStore[email] = { otp: newOtp, expires: Date.now() + 300000 }; // Update the OTP store

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error) => {
            if (error) reject('Failed to resend OTP');
            else resolve('New OTP sent successfully');
        });
    });
};

// Function to verify OTP

const verifyOtp = (email, otp) => {
    if (otpStore[email]) {
        const { otp: storedOtp, expires } = otpStore[email];
        const isExpired = Date.now() > expires;

        // Convert both OTPs to strings for comparison
        const storedOtpStr = String(storedOtp);
        const otpAsString = String(otp).trim();

        // Debug logs
        console.log("Stored OTP:", storedOtpStr);
        console.log("Entered OTP:", otpAsString);

        if (isExpired) {
            delete otpStore[email]; // Remove expired OTP
            return { success: false, message: 'OTP expired' };
        }

        if (storedOtpStr === otpAsString) {
            delete otpStore[email]; // Remove OTP after successful verification
            return { success: true, message: 'OTP verified successfully' };
        } else {
            return { success: false, message: 'Invalid OTP' };
        }
    }

    return { success: false, message: 'No OTP sent for this email' };
};

module.exports = { sendOtp, resendOtp, verifyOtp };
