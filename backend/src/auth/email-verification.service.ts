import { BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface VerificationEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const DUMMY_EMAILS = new Set([
  'test.user@gmail.com',
  'test@gmail.com',
  'testing@gmail.com',
  'test1@gmail.com',
  'admin@gmail.com',
  'user@gmail.com',
  'dummy@gmail.com',
  'sample@gmail.com',
  'example@gmail.com',
  'fake@gmail.com',
  'asdf@gmail.com',
  'foo@bar.com',
]);

const DUMMY_DOMAINS = ['example.com', 'test.com', 'dummy.com', 'fake.com', 'sample.com'];

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
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const isGmail = host.includes('gmail.com');
    // Port 465 with direct SSL/TLS ensures ultra-fast 2-3s delivery and avoids STARTTLS ISP handshake throttling
    const port = isGmail ? 465 : (Number(process.env.SMTP_PORT) || 587);
    const isSecure = isGmail ? true : (String(process.env.SMTP_SECURE ?? 'false') === 'true');

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
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

  setTransporter(transporter: nodemailer.Transporter | null) {
    this.transporter = transporter;
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

    // Guard against dummy or placeholder test emails that cause SMTP bounces
    const domain = normalizedEmail.split('@')[1];
    if (DUMMY_EMAILS.has(normalizedEmail) || (domain && DUMMY_DOMAINS.includes(domain))) {
      throw new BadRequestException(
        'សូមបញ្ចូលអាសយដ្ឋាន Email ពិតប្រាកដរបស់អ្នកដែលមានដំណើរការធម្មតា។ មិនអនុញ្ញាតឱ្យប្រើប្រាស់ Email សាកល្បងដូចជា test.user@gmail.com ឡើយ។'
      );
    }

    const code = this.generateCode(normalizedEmail);
    const user = process.env.GMAIL_USER || 'xflowstudio5@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'lmzagtdkmojpfsfu';
    const pass = rawPass.replace(/\s+/g, '');

    // Mock bypass when running in test mode without an active live transporter
    if ((process.env.NODE_ENV === 'test' || process.env.MOCK_EMAIL === 'true') && !this.transporter) {
      return {
        success: true,
        message: 'លេខកូដបញ្ជាក់ ៦ ខ្ទង់ត្រូវបានរៀបចំរួចរាល់សម្រាប់ Mock Test។',
      };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KruPet Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f4ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f4ee; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7e1d4; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
                <!-- Header Branding -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0d5f58 0%, #115e59 100%); padding: 28px 24px; text-align: center;">
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 12px; width: 44px; height: 44px; line-height: 44px; font-size: 24px; font-weight: 900; color: #ffffff; font-family: 'Arial Black', Impact, sans-serif; margin-bottom: 8px;">
                      K
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">KruPet</h1>
                    <p style="color: #ccfbf1; margin: 4px 0 0 0; font-size: 13px; font-weight: 500;">ប្រព័ន្ធគ្រប់គ្រងគ្លីនិកវេជ្ជសាស្ត្រឆ្លាតវៃ</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="font-size: 15px; line-height: 1.6; color: #292524; margin: 0 0 18px 0;">
                      សូមស្វាគមន៍មកកាន់ <strong>KruPet</strong>។ នេះជាលេខកូដបញ្ជាក់ ៦ ខ្ទង់របស់អ្នកដើម្បីបង្កើត និងផ្ទៀងផ្ទាត់គណនី Workspace គ្លីនិក៖
                    </p>

                    <!-- Code Box -->
                    <div style="text-align: center; margin: 24px 0;">
                      <div style="display: inline-block; background: #f0fdf4; border: 2px dashed #0d9488; border-radius: 12px; padding: 16px 32px;">
                        <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0d5f58; font-family: 'Consolas', 'Courier New', monospace;">${code}</span>
                      </div>
                    </div>

                    <div style="background-color: #fafaf9; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
                      <p style="font-size: 13px; color: #44403c; line-height: 1.5; margin: 0;">
                        <strong>សុពលភាព៖</strong> លេខកូដនេះមានសុពលភាពត្រឹមតែ <strong>១០ នាទី</strong> ប៉ុណ្ណោះ។ សូមកុំចែករំលែកលេខកូដនេះទៅកាន់អ្នកដទៃជាដាច់ខាត។
                      </p>
                    </div>

                    <p style="font-size: 12px; color: #78716c; line-height: 1.5; margin: 16px 0 0 0;">
                      ប្រសិនបើលោកអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមមិនបាច់ចាប់អារម្មណ៍សារនេះ។ គណនីរបស់អ្នកមានសុវត្ថិភាពខ្ពស់។
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #faf7f2; border-top: 1px solid #e7e1d4; padding: 16px 24px; text-align: center;">
                    <p style="font-size: 11px; color: #a8a29e; margin: 0;">
                      រក្សាសិទ្ធិគ្រប់យ៉ាងដោយ KruPet - Clinical Operating System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      if (!this.transporter) {
        this.initTransporter();
      }

      if (!this.transporter) {
        throw new Error('សេវាផ្ញើ Email មិនទាន់ដំណើរការ');
      }

      const mailOptions = {
        from: `"KruPet - Clinical OS" <${user}>`,
        to: normalizedEmail,
        subject: `[KruPet] លេខកូដបញ្ជាក់ការចុះឈ្មោះគ្លីនិក - Verification Code: ${code}`,
        text: `KruPet - លេខកូដបញ្ជាក់ការចុះឈ្មោះគ្លីនិករបស់អ្នកគឺ: ${code} - មានសុពលភាព ១០ នាទី។`,
        html: htmlContent,
      };

      try {
        await this.transporter.sendMail(mailOptions);
      } catch (poolErr: any) {
        console.warn(`[EMAIL_VERIFICATION] Pool send failed: ${poolErr.message}, falling back to direct connection...`);
        const fallbackTransport = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user,
            pass,
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 15000,
        });
        await fallbackTransport.sendMail(mailOptions);
      }

      return {
        success: true,
        message: 'លេខកូដបញ្ជាក់ ៦ ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ Gmail របស់អ្នករួចរាល់ហើយ។ សូមពិនិត្យមើលប្រអប់សំបុត្រ Gmail របស់អ្នក។',
      };
    } catch (err: any) {
      console.error(`[EMAIL_VERIFICATION] Gmail SMTP delivery error:`, err);
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
