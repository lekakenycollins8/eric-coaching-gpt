import nodemailer from 'nodemailer';
import { IUser } from '@/models/User';
import { IWorkbookSubmission } from '@/models/WorkbookSubmission';
import { IFollowupAssessment } from '@/models/FollowupAssessment';
import { Document } from 'mongoose';
import path from 'path';
import fs from 'fs';
import { loadFollowupById, FollowupCategoryType } from '@/utils/followupUtils';

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
   * Send a notification to the coaching team about a new diagnosis
   * @param user The user who received the diagnosis
   * @param submission The workbook submission with diagnosis
   */
  async sendDiagnosisNotification(user: IUser & Document, submission: IWorkbookSubmission & Document): Promise<boolean> {
    const coachingEmail = process.env.COACHING_EMAIL || 'coaching@ericjackier.com';
    
    if (!submission.diagnosis) {
      console.error('Cannot send diagnosis notification: No diagnosis found in submission');
      return false;
    }
    
    // Extract key information from the diagnosis
    const strengths = submission.diagnosis.strengths?.join(', ') || 'None provided';
    const challenges = submission.diagnosis.challenges?.join(', ') || 'None provided';
    const recommendations = submission.diagnosis.recommendations?.join(', ') || 'None provided';
    
    // Extract enhanced diagnosis information if available
    let enhancedDiagnosisInfo = '';
    
    if (submission.diagnosis.situationAnalysis) {
      enhancedDiagnosisInfo += `
        <h4>Situation Analysis</h4>
        <p>${submission.diagnosis.situationAnalysis.fullText.substring(0, 200)}...</p>
      `;
    }
    
    if (submission.diagnosis.followupRecommendation) {
      enhancedDiagnosisInfo += `
        <h4>Follow-up Recommendation</h4>
        <p><strong>Worksheet:</strong> ${submission.diagnosis.followupRecommendation.title}</p>
        <p><strong>Reason:</strong> ${submission.diagnosis.followupRecommendation.reason}</p>
      `;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: coachingEmail,
      subject: `New Leadership Diagnosis: ${user.name || user.email}`,
      html: `
        <h2>New Leadership Diagnosis Generated</h2>
        <p><strong>User:</strong> ${user.name || 'Not provided'} (${user.email})</p>
        <p><strong>Diagnosis Generated At:</strong> ${new Date(submission.diagnosisGeneratedAt || submission.updatedAt).toLocaleString()}</p>
        
        <h3>Key Insights</h3>
        <p><strong>Strengths:</strong> ${strengths}</p>
        <p><strong>Challenges:</strong> ${challenges}</p>
        <p><strong>Recommendations:</strong> ${recommendations}</p>
        
        ${enhancedDiagnosisInfo}
      `,
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending diagnosis notification:', error);
      return false;
    }
  }
  
  /**
   * Send coaching session confirmation emails
   * @param user The user who scheduled the session
   * @param schedulingDetails The details of the scheduled coaching session
   * @param submissionId Optional submission ID related to this coaching session
   */
  async sendCoachingPrompt(user: IUser & Document, submissionId?: string, schedulingDetails?: { date: string; time: string; notes?: string }): Promise<boolean> {
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

  /**
   * Send a notification about a follow-up worksheet submission
   * @param user The user who submitted the follow-up
   * @param originalSubmission The original workbook submission
   * @param followupAssessment The follow-up assessment submission
   * @param needsHelp Whether the user has requested help from a coach
   * @param followupType The category type of follow-up ('pillar' or 'workbook')
   */
  async sendFollowupSubmissionNotification(
    user: IUser & Document,
    originalSubmission: IWorkbookSubmission & Document,
    followupAssessment: IFollowupAssessment & Document,
    needsHelp: boolean = false,
    followupType: FollowupCategoryType = 'pillar'
  ): Promise<boolean> {
    // Use help@jackiercoaching.com as the recipient
    const helpEmail = process.env.HELP_EMAIL || 'help@jackiercoaching.com';
    
    // Verify required environment variables
    if (!process.env.EMAIL_FROM) {
      console.error('Cannot send follow-up notification: EMAIL_FROM environment variable is missing');
      return false;
    }
    
    // Get the follow-up worksheet details
    let worksheetTitle = 'Follow-up Worksheet';
    let worksheetDescription = '';
    
    try {
      // Use the provided worksheetType and try to load the worksheet details
      const { worksheet } = await loadFollowupById(followupAssessment.followupId);
      
      if (worksheet) {
        worksheetTitle = worksheet.title;
        worksheetDescription = worksheet.description || '';
      }
    } catch (error) {
      console.error('Error loading worksheet information:', error);
    }
    
    // Extract key information from the follow-up answers
    let keyAnswers = '';
    try {
      // Get the self-assessment ratings if they exist
      const answers = followupAssessment.answers;
      const ratingKeys = Object.keys(answers).filter(key => key.includes('assessment'));
      
      if (ratingKeys.length > 0) {
        keyAnswers += '<h4>Self-Assessment Ratings</h4><ul>';
        ratingKeys.forEach(key => {
          keyAnswers += `<li><strong>${key}:</strong> ${answers[key]}/5</li>`;
        });
        keyAnswers += '</ul>';
      }
      
      // Get the reflection answers if they exist
      const reflectionKeys = Object.keys(answers).filter(key => key.includes('reflection'));
      
      if (reflectionKeys.length > 0) {
        keyAnswers += '<h4>Reflection Responses</h4>';
        reflectionKeys.forEach(key => {
          keyAnswers += `<p><strong>${key}:</strong> ${answers[key]}</p>`;
        });
      }
      
      // Check if the user requested help
      const helpRequestKeys = Object.keys(answers).filter(key => key.includes('next-steps') || key.includes('help'));
      if (helpRequestKeys.length > 0 && helpRequestKeys.some(key => answers[key])) {
        keyAnswers += '<h4>Help Request</h4>';
        helpRequestKeys.forEach(key => {
          if (answers[key]) {
            keyAnswers += `<p><strong>${key}:</strong> ${answers[key]}</p>`;
          }
        });
      }
    } catch (error) {
      console.error('Error extracting key answers:', error);
    }
    
    // Compare with original submission if available
    let progressComparison = '';
    let enhancedDiagnosis = '';
    if (originalSubmission.diagnosis) {
      // Basic progress comparison
      progressComparison = `
        <h3>Progress Comparison</h3>
        <p>Original diagnosis date: ${new Date(originalSubmission.diagnosisGeneratedAt || originalSubmission.createdAt).toLocaleDateString()}</p>
        <p>Follow-up submission date: ${new Date(followupAssessment.completedAt || followupAssessment.createdAt).toLocaleDateString()}</p>
        <p>Time elapsed: ${Math.round((followupAssessment.createdAt.getTime() - originalSubmission.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days</p>
      `;
      
      // Add enhanced AI diagnosis if available - format differently based on follow-up type
      if (followupType === 'pillar') {
        // Pillar-specific diagnosis format
        enhancedDiagnosis = `
          <h3>Enhanced Pillar-Specific AI Diagnosis</h3>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4>Progress Analysis</h4>
            <p>${originalSubmission.diagnosis.situationAnalysis || 'No progress analysis available'}</p>
            
            <h4>Implementation Effectiveness</h4>
            <p>${originalSubmission.diagnosis.strengthsAnalysis || 'No implementation analysis available'}</p>
            
            <h4>Adjusted Recommendations</h4>
            <p>${originalSubmission.diagnosis.growthAreasAnalysis || 'No adjusted recommendations available'}</p>
            
            <h4>Continued Growth Plan</h4>
            <p>${originalSubmission.diagnosis.actionableRecommendations || 'No growth plan available'}</p>
            
            <h4>Coaching Support Assessment</h4>
            <p>${originalSubmission.diagnosis.followupRecommendation || 'No coaching assessment available'}</p>
          </div>
        `;
      } else {
        // Workbook-specific diagnosis format
        enhancedDiagnosis = `
          <h3>Enhanced Workbook Implementation AI Diagnosis</h3>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4>Implementation Progress Analysis</h4>
            <p>${originalSubmission.diagnosis.situationAnalysis || 'No progress analysis available'}</p>
            
            <h4>Cross-Pillar Integration</h4>
            <p>${originalSubmission.diagnosis.strengthsAnalysis || 'No integration analysis available'}</p>
            
            <h4>Implementation Barriers</h4>
            <p>${originalSubmission.diagnosis.growthAreasAnalysis || 'No barriers analysis available'}</p>
            
            <h4>Comprehensive Adjustment Plan</h4>
            <p>${originalSubmission.diagnosis.actionableRecommendations || 'No adjustment plan available'}</p>
            
            <h4>Next Focus Areas</h4>
            <p>${originalSubmission.diagnosis.pillarRecommendations || 'No focus areas available'}</p>
            
            <h4>Coaching Support Assessment</h4>
            <p>${originalSubmission.diagnosis.followupRecommendation || 'No coaching assessment available'}</p>
          </div>
        `;
      }
    }
    
    // Create a priority flag if the user needs help
    const priorityFlag = needsHelp ? 
      '<div style="background-color: #ffebee; color: #c62828; padding: 10px; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 18px;">⚠️ PRIORITY: User has explicitly requested coaching help</div>' : 
      '';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: helpEmail,
      subject: `${needsHelp ? '[PRIORITY] ' : ''}${followupType === 'pillar' ? 'Pillar' : 'Workbook'} Follow-up: ${user.name || user.email} - ${worksheetTitle}`,
      html: `
        <h2>New Follow-up Worksheet Submission</h2>
        ${priorityFlag}
        
        <h3>User Information</h3>
        <p><strong>Name:</strong> ${user.name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Subscription:</strong> ${user.subscription?.planId || 'Unknown'}</p>
        
        <h3>Follow-up Details</h3>
        <p><strong>Worksheet:</strong> ${worksheetTitle} (${followupType})</p>
        <p><strong>Description:</strong> ${worksheetDescription}</p>
        <p><strong>Submitted:</strong> ${new Date(followupAssessment.completedAt || followupAssessment.createdAt).toLocaleString()}</p>
        <p><strong>Original Submission ID:</strong> ${originalSubmission._id}</p>
        <p><strong>Follow-up ID:</strong> ${followupAssessment._id}</p>
        
        <h3>Key Responses</h3>
        ${keyAnswers || '<p>No key responses extracted</p>'}
        
        ${progressComparison}
        
        ${enhancedDiagnosis}
        
        <h3>Next Steps</h3>
        <p>You can review the full submission details in the admin dashboard.</p>
        ${needsHelp ? '<p><strong>This user has explicitly requested coaching assistance. Please reach out to them as soon as possible.</strong></p>' : ''}
      `,
    };
    
    try {
      // Add verification step before sending
      await this.transporter.verify();
      console.log('SMTP connection verified successfully for follow-up notification');
      
      // Send notification email
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Follow-up notification email sent result:', result);
      
      // Check for rejected or pending emails
      const failed = [...(result.rejected || []), ...(result.pending || [])].filter(Boolean);
      
      if (failed.length) {
        console.error(`Follow-up notification email(s) (${failed.join(', ')}) could not be sent`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error sending follow-up notification email:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const emailService = new EmailService();
