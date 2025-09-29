// Email utility functions for password reset and notifications
// This is a placeholder implementation - integrate with your preferred email service

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Integrate with email service (SendGrid, AWS SES, Nodemailer, etc.)
  // For now, we'll just log the email content
  
  console.log('=== EMAIL WOULD BE SENT ===')
  console.log('To:', options.to)
  console.log('Subject:', options.subject)
  console.log('HTML:', options.html)
  console.log('Text:', options.text)
  console.log('============================')
  
  // Return true to simulate successful email sending
  return true
}

export function generatePasswordResetEmail(email: string, resetToken: string): EmailOptions {
  const resetUrl = `${process.env.NEXTAUTH_URL}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 20px 0; 
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have requested to reset your password for your admin account. Click the button below to set a new password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Admin Panel.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Password Reset Request
    
    You have requested to reset your password for your admin account.
    
    Please visit the following link to set a new password:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this password reset, you can safely ignore this email.
  `
  
  return {
    to: email,
    subject: 'Password Reset Request - Admin Panel',
    html,
    text
  }
}

export function generateWelcomeEmail(email: string, tempPassword: string): EmailOptions {
  const loginUrl = `${process.env.NEXTAUTH_URL}/admin/login`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Admin Panel</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .credentials { background: #e5e7eb; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .button { 
          display: inline-block; 
          padding: 12px 24px; 
          background: #2563eb; 
          color: white; 
          text-decoration: none; 
          border-radius: 4px; 
          margin: 20px 0; 
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Admin Panel</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your admin account has been created. Here are your login credentials:</p>
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to Admin Panel</a>
          </p>
          <p><strong>Important:</strong> Please change your password after your first login for security.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Admin Panel.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
    Welcome to Admin Panel
    
    Your admin account has been created. Here are your login credentials:
    
    Email: ${email}
    Temporary Password: ${tempPassword}
    
    Please login at: ${loginUrl}
    
    Important: Please change your password after your first login for security.
  `
  
  return {
    to: email,
    subject: 'Welcome to Admin Panel - Account Created',
    html,
    text
  }
}