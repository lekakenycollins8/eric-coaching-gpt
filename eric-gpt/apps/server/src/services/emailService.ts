import nodemailer from 'nodemailer';
import { IUser } from '@/models/User';
import { IWorkbookSubmission } from '@/models/WorkbookSubmission';
import { IFollowupAssessment } from '@/models/FollowupAssessment';
import { Document } from 'mongoose';

/**
 * Email Service for sending coaching-related notifications
 */
export class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    // Initialize the nodemailer transporter
    // Use the exact same configuration pattern as the working auth implementation
    const server = {
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    };
    
    console.log('Email service initializing with config:', {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      user: process.env.EMAIL_SERVER_USER ? '***provided***' : '***missing***'
    });
    
    this.transporter = nodemailer.createTransport(server);
  }
  
  /**
   * Send a notification to the coaching team about a new workbook submission
   * @param user The user who submitted the workbook
   * @param submission The workbook submission
   */
  async sendWorkbookSubmissionNotification(user: IUser & Document, submission: IWorkbookSubmission & Document) {
    const coachingEmail = process.env.COACHING_EMAIL || 'coaching@ericjackier.com';
    
    // Extract key information from the diagnosis
    const strengths = submission.diagnosis?.strengths?.join(', ');
    const challenges = submission.diagnosis?.challenges?.join(', ');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: coachingEmail,
      subject: `New Workbook Submission: ${user.name || user.email}`,
      html: `
        <h2>New Workbook Submission</h2>
        <p><strong>User:</strong> ${user.name} (${user.email})</p>
        <p><strong>Submission Date:</strong> ${new Date(submission.createdAt).toLocaleString()}</p>
        <p><strong>Diagnosis Generated:</strong> ${submission.diagnosisGeneratedAt ? 'Yes' : 'No'}</p>
        
        <h3>Key Insights</h3>
        <p><strong>Strengths:</strong> ${strengths}</p>
        <p><strong>Challenges:</strong> ${challenges}</p>
      `,
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending workbook submission notification:', error);
      return false;
    }
  }
  
  /**
   * Send a notification to the coaching team about a new follow-up worksheet submission
   * @param user The user who submitted the follow-up worksheet
   * @param followupAssessment The follow-up assessment submission
   * @param workbookSubmission The original workbook submission
   */
  async sendFollowupSubmissionNotification(
    user: IUser & Document, 
    followupAssessment: IFollowupAssessment & Document,
    workbookSubmission: IWorkbookSubmission & Document
  ) {
    const coachingEmail = process.env.COACHING_EMAIL;
    
    // Determine the worksheet type (pillar or follow-up)
    const isPillar = followupAssessment.followupId.includes('pillar');
    const worksheetType = isPillar ? 'Pillar' : 'Implementation';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: coachingEmail,
      subject: `New ${worksheetType} Follow-up Submission: ${user.name || user.email}`,
      html: `
        <h2>New Follow-up Worksheet Submission</h2>
        <p><strong>User:</strong> ${user.name || 'Not provided'} (${user.email})</p>
        <p><strong>Submission Date:</strong> ${new Date(followupAssessment.createdAt).toLocaleString()}</p>
        <p><strong>Worksheet Type:</strong> ${worksheetType}</p>
        <p><strong>Worksheet ID:</strong> ${followupAssessment.followupId}</p>
      `,
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending follow-up submission notification:', error);
      return false;
    }
  }
  
  /**
   * Send coaching session confirmation emails
   * @param user The user who scheduled the session
   * @param schedulingDetails The details of the scheduled coaching session
   * @param submissionId Optional submission ID related to this coaching session
   */
  async sendCoachingPrompt(user: IUser & Document, submissionId?: string, schedulingDetails?: { date: string; time: string; notes?: string }) {
    // Verify required environment variables
    if (!process.env.EMAIL_FROM) {
      console.error('EMAIL_FROM environment variable is not set');
      return false;
    }
    
    const coachingEmail = process.env.COACHING_EMAIL || 'coaching@ericjackier.com';
    const formattedDate = schedulingDetails?.date ? new Date(schedulingDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified';
    const formattedTime = schedulingDetails?.time || 'Not specified';
    const userNotes = schedulingDetails?.notes || 'No additional notes provided';
    
    // Email to the user confirming their scheduled session
    const userMailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Your Leadership Coaching Session Confirmation',
      html: `
        <h2>Your Coaching Session is Confirmed!</h2>
        <p>Hello ${user.name || 'there'},</p>
        
        <p>Thank you for scheduling your leadership coaching session with Eric Jackier. Here are the details of your upcoming session:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Format:</strong> Virtual meeting (Zoom link will be sent before the session)</p>
          ${submissionId ? `<p><strong>Related to submission:</strong> ${submissionId}</p>` : ''}
          <p><strong>Your notes:</strong> ${userNotes}</p>
        </div>
        
        <p>Please add this appointment to your calendar. You'll receive a Zoom meeting link via email before your scheduled session.</p>
        
        <p>If you need to reschedule or have any questions, please reply to this email or contact us at ${coachingEmail}.</p>
        
        <p>We look forward to working with you!</p>
        
        <p>Best regards,<br>The Eric GPT Coaching Team</p>
      `,
    };
    
    try {
      // Add verification step before sending
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      
      // Send confirmation email to the user
      const userResult = await this.transporter.sendMail(userMailOptions);
      console.log('User confirmation email sent result:', userResult);
      
      // Only send notification to coaching team if we have scheduling details
      let coachingTeamResult = { rejected: [], pending: [] };
      if (schedulingDetails && coachingEmail) {
        // Email to the coaching team with the scheduling details
        const coachingTeamMailOptions = {
          from: process.env.EMAIL_FROM,
          to: coachingEmail,
          subject: `New Coaching Session Scheduled: ${user.name || user.email}`,
          html: `
            <h2>New Coaching Session Scheduled</h2>
            <p>A new leadership coaching session has been scheduled.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>User:</strong> ${user.name || 'Not provided'} (${user.email})</p>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
              ${submissionId ? `<p><strong>Related to submission:</strong> ${submissionId}</p>` : ''}
              <p><strong>User notes:</strong> ${userNotes}</p>
            </div>
            
            <p>Please prepare for this session and ensure you're available at the scheduled time.</p>
          `,
        };
        
        coachingTeamResult = await this.transporter.sendMail(coachingTeamMailOptions);
        console.log('Coaching team notification email sent result:', coachingTeamResult);
      }
      
      // Check for rejected or pending emails
      const failed = [...(userResult.rejected || []), ...(coachingTeamResult.rejected || [])]
        .concat([...(userResult.pending || []), ...(coachingTeamResult.pending || [])])
        .filter(Boolean);
        
      if (failed.length) {
        console.error(`Email(s) (${failed.join(", ")}) could not be sent`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error sending coaching emails:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const emailService = new EmailService();
