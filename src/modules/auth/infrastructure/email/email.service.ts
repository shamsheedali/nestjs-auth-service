import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailConfig } from '../../../../config/email.config';
import { EmailTemplateService } from './email-template.service';

/**
 * Email service using nodemailer for sending transactional emails.
 * Supports email verification and password reset flows.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly emailConfig: EmailConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.emailConfig = this.configService.get<EmailConfig>('email')!;
    this.createTransporter();
  }

  /**
   * Create nodemailer transporter
   */
  private createTransporter(): void {
    const transporterOptions: any = {
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
    };

    if (this.emailConfig.auth.user && this.emailConfig.auth.pass) {
      transporterOptions.auth = {
        user: this.emailConfig.auth.user,
        pass: this.emailConfig.auth.pass,
      };
    }

    this.transporter = nodemailer.createTransport(transporterOptions);
  }

  /**
   * Send email verification email
   * @param email Recipient email
   * @param token Verification token
   * @param username User's username
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    username?: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('app.appUrl');
    const verificationUrl = `${appUrl}/api/v1/auth/verify-email?token=${token}`;

    const html = this.emailTemplateService.getVerificationEmailTemplate(
      verificationUrl,
      username,
    );

    try {
      await this.transporter.sendMail({
        from: this.emailConfig.from,
        to: email,
        subject: 'Verify Your Email Address',
        html,
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email Recipient email
   * @param token Password reset token
   * @param username User's username
   */
  async sendPasswordResetEmail(
    email: string,
    token: string,
    username?: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('app.appUrl');
    const resetUrl = `${appUrl}/api/v1/auth/reset-password?token=${token}`;

    const html = this.emailTemplateService.getPasswordResetEmailTemplate(resetUrl, username);

    try {
      await this.transporter.sendMail({
        from: this.emailConfig.from,
        to: email,
        subject: 'Reset Your Password',
        html,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error.stack,
      );
      throw error;
    }
  }
}
