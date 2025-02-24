////////////Using email based on/////////////////


const { User } = require('../../models'); // Import the User model 
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Secret key for encryption (this should ideally be stored in environment variables)
const secretKey = 'mttmtt4699';

// Function to encrypt password
const encryptPassword = (password) => {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Function to send password reset link
const sendForgotPasswordLink = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email exists in the database
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Generate the reset token (for security)
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Store reset token and expiration time (10 minutes from now)
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    user.resetToken = resetToken;
    user.resetTokenExpiration = expirationTime;
    await user.save();

    // Generate the reset link
    const resetLink = `https://erp.keramruth.com/create-password?token=${resetToken}`;

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'rajuking9160@gmail.com', // Your email
        pass: 'ifye whlp asxl owhf', // Your email password
      },
    });

    // Compose the email content
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Reset Your Password',
      html: `<p>Click the link below to reset your password. It will expire in 10 minutes:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Reset link sent to your email.' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

const resetPassword = async (req, res) => {
    const { email, token, password } = req.body;
  
    try {
      // Find user by email to get resetToken and resetTokenExpiration
      const user = await User.findOne({ where: { email: email } });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Check if the reset token matches and is not expired
      if (user.resetToken !== token) {
        return res.status(400).json({ message: 'Invalid or expired reset token.' });
      }
  
      // Check if the reset token is expired
      const currentTime = Date.now();
      if (user.resetTokenExpiration < currentTime) {
        return res.status(400).json({ message: 'Reset link has expired.' });
      }
  
      // Encrypt the new password
      const encryptedPassword = encryptPassword(password);
      console.log('Encrypted Password:', encryptedPassword); // Log encrypted password for debugging
  
      // Update the user's password in the database and clear the reset token
      const updateUser = await User.update(
        { password: encryptedPassword, resetToken: null, resetTokenExpiration: null },
        { where: { email: email } }
      );
  
      if (updateUser[0] === 0) {
        return res.status(500).json({ message: 'Failed to update the password.' });
      }
  
      // Send confirmation email
      const fullName = user.full_name;
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'rajuking9160@gmail.com', // Your email
          pass: 'ifye whlp asxl owhf', // Your email password
        },
      });
  
      const mailOptions = {
        from: 'your-email@gmail.com',
        to: user.email,
        subject: 'Password Successfully Updated',
        html: `<p>Hello ${fullName},</p><p>Your password has been successfully updated. If this was not you, please contact support immediately.</p>`,
      };
  
      try {
        await transporter.sendMail(mailOptions);
      } catch (mailError) {
        console.error('Error sending confirmation email:', mailError);
        return res.status(500).json({ message: 'Failed to send confirmation email.' });
      }
  
      return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
};

  

module.exports = { sendForgotPasswordLink, resetPassword };











////////////////Mobile Number based on password updated///////////



// const { User } = require('../../models'); // Import the User model 
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');

// // Secret key for encryption (this should ideally be stored in environment variables)
// const secretKey = 'mttmtt4699';

// // Function to encrypt password
// const encryptPassword = (password) => {
//   const cipher = crypto.createCipher('aes-256-cbc', secretKey);
//   let encrypted = cipher.update(password, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
//   return encrypted;
// };

// // Function to send password reset link
// const sendForgotPasswordLink = async (req, res) => {
//   const { email } = req.body;

//   try {
//     // Check if the email exists in the database
//     const user = await User.findOne({ where: { email } });
//     if (!user) {
//       return res.status(404).json({ message: 'Email not found.' });
//     }

//     // Generate the reset token (for security)
//     const resetToken = crypto.randomBytes(20).toString('hex');
    
//     // Store reset token and expiration time (10 minutes from now)
//     const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now
//     user.resetToken = resetToken;
//     user.resetTokenExpiration = expirationTime;
//     await user.save();

//     // Generate the reset link
//     const resetLink = `https://erp.keramruth.com/create-password?token=${resetToken}`;

//     // Configure Nodemailer transporter
//     const transporter = nodemailer.createTransport({
//       service: 'Gmail',
//       auth: {
//         user: 'rajuking9160@gmail.com', // Your email
//         pass: 'ifye whlp asxl owhf', // Your email password
//       },
//     });

//     // Compose the email content
//     const mailOptions = {
//       from: 'your-email@gmail.com',
//       to: email,
//       subject: 'Reset Your Password',
//       html: `<p>Click the link below to reset your password. It will expire in 10 minutes:</p><a href="${resetLink}">${resetLink}</a>`,
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);

//     return res.status(200).json({ message: 'Reset link sent to your email.' });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     return res.status(500).json({ message: 'Internal server error.' });
//   }
// };

// const resetPassword = async (req, res) => {
//   const { mobileNumber, password } = req.body;

//   try {
//     // Find user by mobile number
//     const user = await User.findOne({ where: { mobile_number: mobileNumber } });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     // Encrypt the new password
//     const encryptedPassword = encryptPassword(password);

//     // Update the user's password in the database
//     const updateUser = await User.update(
//       { password: encryptedPassword },
//       { where: { mobile_number: mobileNumber } }  // Use mobileNumber here
//     );

//     if (updateUser[0] === 0) {
//       return res.status(500).json({ message: 'Failed to update the password.' });
//     }

//     return res.status(200).json({ message: 'Password updated successfully.' });
//   } catch (error) {
//     console.error('Error updating password:', error);
//     return res.status(500).json({ message: 'Internal server error.' });
//   }
// };


  

// module.exports = { sendForgotPasswordLink, resetPassword };
