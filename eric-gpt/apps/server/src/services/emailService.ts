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
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
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
   * Send a coaching session scheduling prompt to the user
   * @param user The user to send the prompt to
   * @param submissionId The ID of the relevant submission
   */
  async sendCoachingPrompt(user: IUser & Document, submissionId: string) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Schedule Your Leadership Coaching Session',
      html: `
        <h2>Ready for Your Coaching Session?</h2>
        <p>Hello ${user.name || 'there'},</p>
        
        <p>Based on your recent worksheet submissions, we believe you would benefit from a personalized coaching session with Eric Jackier.</p>
        
        <p>During this session, Eric will:</p>
        <ul>
          <li>Review your leadership assessment results</li>
          <li>Provide targeted guidance for your specific challenges</li>
          <li>Help you develop an action plan for continued growth</li>
        </ul>
        
        <p><strong>Click below to schedule your session:</strong></p>
        <p style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/coaching/schedule?submission=${submissionId}" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Schedule My Coaching Session
          </a>
        </p>
        
        <p>We look forward to supporting your leadership journey!</p>
        
        <p>Best regards,<br>The Eric Jackier Leadership Team</p>
      `,
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending coaching prompt:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const emailService = new EmailService();
