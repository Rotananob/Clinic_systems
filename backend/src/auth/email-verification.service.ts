import { BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface VerificationEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

export class EmailVerificationService {
  private readonly verificationCodes = new Map<string, VerificationEntry>();
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const user = process.env.GMAIL_USER || 'xflowstudio5@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'lmzagtdkmojpfsfu';
    const pass = rawPass.replace(/\s+/g, '');
    const port = Number(process.env.SMTP_PORT) || 587;
    const isSecure = String(process.env.SMTP_SECURE ?? 'false') === 'true';

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: isSecure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } catch {
      this.transporter = null;
    }
  }

  generateCode(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.verificationCodes.set(normalizedEmail, {
      code,
      expiresAt,
      attempts: 0,
    });

    return code;
  }

  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const code = this.generateCode(normalizedEmail);
    const user = process.env.GMAIL_USER || 'xflowstudio5@gmail.com';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f7f4ee; padding: 24px; color: #1c1917;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e7e1d4; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #115e59; margin: 0; font-size: 22px; font-weight: 700;">ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក</h2>
            <p style="color: #78716c; margin: 4px 0 0 0; font-size: 13px;">Clinical Patient Management System</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
            សូមអរគុណសម្រាប់ការចុះឈ្មោះបង្កើត Workspace គ្លីនិកថ្មី។ នេះជាលេខកូដបញ្ជាក់ ៦ ខ្ទង់របស់អ្នក៖
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 14px 28px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #166534; font-family: monospace;">${code}</span>
            </div>
          </div>
          <p style="font-size: 12px; color: #78716c; line-height: 1.5; margin-bottom: 8px;">
            លេខកូដនេះមានសុពលភាពត្រឹមតែ ១០ នាទីប៉ុណ្ណោះ។ សូមកុំចែករំលែកលេខកូដនេះទៅកាន់អ្នកដទៃ។
          </p>
          <p style="font-size: 11px; color: #a8a29e; line-height: 1.4; border-top: 1px solid #f5f5f4; padding-top: 16px; margin-top: 24px;">
            ប្រសិនបើលោកអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមមិនបាច់ចាប់អារម្មណ៍សារនេះ។
          </p>
        </div>
      </div>
    `;

    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      if (!this.transporter) {
        throw new Error('សេវាផ្ញើ Email មិនទាន់ដំណើរការ');
      }

      await this.transporter.sendMail({
        from: `"Rotana Clinic Platform" <${user}>`,
        to: normalizedEmail,
        subject: `[Clinic Platform] លេខកូដបញ្ជាក់ការចុះឈ្មោះគ្លីនិក - Verification Code: ${code}`,
        text: `លេខកូដបញ្ជាក់ការចុះឈ្មោះគ្លីនិករបស់អ្នកគឺ: ${code} - សុពលភាព ១០ នាទី`,
        html: htmlContent,
      });

      return {
        success: true,
        message: 'លេខកូដបញ្ជាក់ ៦ ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ Gmail របស់អ្នករួចរាល់ហើយ។ សូមពិនិត្យមើលប្រអប់សំបុត្រ Gmail របស់អ្នក។',
      };
    } catch (err: any) {
      console.error(`[EMAIL_VERIFICATION] Gmail SMTP delivery error:`, err.message);
      throw new BadRequestException('មិនអាចផ្ញើលេខកូដទៅកាន់ Gmail បានទេ។ សូមពិនិត្យមើលអាសយដ្ឋាន Gmail របស់អ្នកឡើងវិញ ឬព្យាយាមម្ដងទៀត។');
    }
  }

  verifyCode(email: string, code: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const entry = this.verificationCodes.get(normalizedEmail);

    if (!entry) {
      throw new BadRequestException('គ្មានសំណើសុំលេខកូដសម្រាប់ Email នេះ ឬលេខកូដបានផុតកំណត់។');
    }

    if (Date.now() > entry.expiresAt) {
      this.verificationCodes.delete(normalizedEmail);
      throw new BadRequestException('លេខកូដបញ្ជាក់បានផុតកំណត់សុពលភាព ១០ នាទី។ សូមស្នើសុំលេខកូដថ្មី។');
    }

    if (entry.attempts >= 5) {
      this.verificationCodes.delete(normalizedEmail);
      throw new BadRequestException('អ្នកបានបញ្ចូលលេខកូដខុសលើសពី ៥ ដង។ សូមស្នើសុំលេខកូដថ្មី។');
    }

    if (entry.code !== code.trim()) {
      entry.attempts++;
      throw new BadRequestException('លេខកូដបញ្ជាក់មិនត្រឹមត្រូវទេ។');
    }

    // Success: consume code
    this.verificationCodes.delete(normalizedEmail);
    return true;
  }
}
