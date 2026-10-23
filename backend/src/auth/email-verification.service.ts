import { BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

interface VerificationEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface RateLimitEntry {
  lastRequestedAt: number;
  count: number;
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
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private transporter: nodemailer.Transporter | null = null;
  private isCustomTransporter = false;
  public createTransportFn: (options: any) => nodemailer.Transporter = nodemailer.createTransport;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const user = process.env.GMAIL_USER || 'xflowstudio5@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'lmzagtdkmojpfsfu';
    const pass = rawPass.replace(/\s+/g, '');
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const isGmail = host.includes('gmail.com');
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
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
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
    this.isCustomTransporter = true;
  }

  private checkRateLimit(email: string) {
    const now = Date.now();
    const rate = this.rateLimits.get(email);
    if (rate) {
      // 60-second cooldown between consecutive requests
      if (now - rate.lastRequestedAt < 60 * 1000) {
        const remainingSeconds = Math.ceil((60 * 1000 - (now - rate.lastRequestedAt)) / 1000);
        throw new BadRequestException(
          `សូមរង់ចាំ ${remainingSeconds} វិនាទី មុននឹងស្នើសុំលេខកូដថ្មីម្តងទៀត។`
        );
      }
      // Maximum 5 requests per 10 minutes to stop spam scripts
      if (rate.count >= 5 && now - rate.lastRequestedAt < 10 * 60 * 1000) {
        throw new BadRequestException(
          'លោកអ្នកបានស្នើសុំលេខកូដលើសចំនួនកំណត់។ សូមរង់ចាំ ១០ នាទី មុននឹងព្យាយាមម្តងទៀត។'
        );
      }
      rate.count = rate.count + 1;
      rate.lastRequestedAt = now;
    } else {
      this.rateLimits.set(email, { lastRequestedAt: now, count: 1 });
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

  resolveLogoBuffer(): Buffer | null {
    const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    const logoCandidates = [
      path.join(baseDir, 'assets', 'krupet-logo.png'),
      path.join(baseDir, '..', 'src', 'assets', 'krupet-logo.png'),
      path.join(baseDir, 'src', 'assets', 'krupet-logo.png'),
      path.join(process.cwd(), 'src', 'assets', 'krupet-logo.png'),
      path.join(process.cwd(), 'dist', 'assets', 'krupet-logo.png'),
      path.join(process.cwd(), 'backend', 'src', 'assets', 'krupet-logo.png'),
      path.join(process.cwd(), 'backend', 'dist', 'assets', 'krupet-logo.png'),
      path.resolve(baseDir, '../../frontend/public/icons/icon-192.png'),
      path.resolve(process.cwd(), '../frontend/public/icons/icon-192.png'),
      path.resolve(process.cwd(), 'frontend/public/icons/icon-192.png'),
    ];

    for (const p of logoCandidates) {
      if (fs.existsSync(p)) {
        try {
          return fs.readFileSync(p);
        } catch {}
      }
    }
    return null;
  }

  private renderEmailHtml(params: {
    code: string;
    badgeText: string;
    description: string;
    logoBuffer: Buffer | null;
  }): string {
    const { code, badgeText, description, logoBuffer } = params;
    return `
      <!DOCTYPE html>
      <html lang="km">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KruPet Verification Code</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
        <style>
          body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background-color: #f7f4ee;
            font-family: 'Kantumruy Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Khmer OS Siemreap', 'Khmer OS Battambang', sans-serif;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f4ee; font-family: 'Kantumruy Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Khmer OS Siemreap', sans-serif; color: #1c1917;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f4ee; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e7dfd0; box-shadow: 0 10px 25px -5px rgba(2, 44, 39, 0.08), 0 8px 10px -6px rgba(2, 44, 39, 0.04); overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #022c27 0%, #043d35 35%, #064e3b 70%, #0d5f58 100%); padding: 36px 28px 30px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 14px;">
                      <tr>
                        <td align="center" style="width: 72px; height: 72px; background: rgba(255, 255, 255, 0.08); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);">
                          ${logoBuffer ? '<img src="cid:krupet-logo" alt="KruPet Official Logo" width="60" height="60" style="display: block; border-radius: 16px; margin: 0 auto;" />' : '<div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; font-size: 30px; font-weight: 900; color: #ffffff; font-family: \'Arial Black\', Impact, sans-serif;">K</div>'}
                        </td>
                      </tr>
                    </table>

                    <div style="margin: 0 0 6px 0;">
                      <span style="color: #ffffff; font-size: 26px; font-weight: 800; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; letter-spacing: -0.5px;">KruPet</span>
                      <span style="display: inline-block; background-color: rgba(94, 234, 212, 0.2); color: #5eead4; border: 1px solid rgba(94, 234, 212, 0.4); border-radius: 12px; font-size: 10px; font-weight: 700; font-family: 'Plus Jakarta Sans', monospace; padding: 2px 8px; margin-left: 6px; vertical-align: middle; text-transform: uppercase;">${badgeText}</span>
                    </div>

                    <p style="color: #ccfbf1; margin: 0; font-size: 13px; font-weight: 500; font-family: 'Kantumruy Pro', sans-serif; line-height: 1.5;">
                      ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក និងវេជ្ជសាស្ត្រឌីជីថលឆ្លាតវៃ
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 36px 32px 28px; background-color: #ffffff;">
                    <p style="font-size: 15px; line-height: 1.7; color: #292524; margin: 0 0 20px 0; font-family: 'Kantumruy Pro', sans-serif;">
                      ${description}
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0 28px;">
                      <tr>
                        <td align="center">
                          <div style="display: inline-block; background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #0d9488; border-radius: 16px; padding: 18px 36px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.12);">
                            <div style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #042f2e; font-family: 'JetBrains Mono', 'Consolas', 'Plus Jakarta Sans', monospace; line-height: 1; padding-left: 12px;">
                              ${code}
                            </div>
                          </div>
                          <div style="color: #0d9488; font-size: 11px; font-weight: 600; font-family: 'Kantumruy Pro', sans-serif; margin-top: 8px;">
                            លេខកូដសម្ងាត់សម្រាប់ផ្ទៀងផ្ទាត់
                          </div>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fafaf9; border-left: 4px solid #0d9488; border-radius: 8px; margin: 0 0 20px 0;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <p style="font-size: 13px; color: #44403c; line-height: 1.6; margin: 0; font-family: 'Kantumruy Pro', sans-serif;">
                            <strong style="color: #0f766e;">សុពលភាព៖</strong> លេខកូដនេះមានសុពលភាពត្រឹមតែ <strong>១០ នាទី</strong> ប៉ុណ្ណោះ។ សូមកុំចែករំលែកលេខកូដនេះទៅកាន់អ្នកដទៃជាដាច់ខាត ដើម្បីការពារសុវត្ថិភាពទិន្នន័យគ្លីនិករបស់អ្នក។
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 12px; color: #78716c; line-height: 1.6; margin: 0; font-family: 'Kantumruy Pro', sans-serif;">
                      ប្រសិនបើលោកអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមកុំមានការព្រួយបារម្ភ គណនីរបស់អ្នកនៅតែមានសុវត្ថិភាពពេញលេញជានិច្ច។
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #faf7f2; border-top: 1px solid #e7dfd0; padding: 22px 28px; text-align: center;">
                    <p style="font-size: 12px; font-weight: 700; color: #042f2e; margin: 0 0 4px 0; font-family: 'Plus Jakarta Sans', sans-serif;">
                      KruPet - Clinical Operating System
                    </p>
                    <p style="font-size: 11px; color: #78716c; margin: 0; font-family: 'Kantumruy Pro', sans-serif; line-height: 1.5;">
                      រក្សាសិទ្ធិគ្រប់យ៉ាងដោយ KruPet - ប្រព័ន្ធសុខាភិបាលឌីជីថល ព្រះរាជាណាចក្រកម្ពុជា
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
  }

  private async dispatchViaRelay(params: {
    to: string;
    subject: string;
    text: string;
    htmlContent: string;
    successMessage: string;
  }): Promise<{ success: boolean; message: string }> {
    const { to, subject, text, htmlContent, successMessage } = params;
    const candidates = [
      process.env.FRONTEND_URL,
      'https://clinic-systems.vercel.app',
      'http://localhost:3000',
    ].filter(Boolean) as string[];

    const secret = process.env.INTERNAL_MAILER_SECRET || 'krupet-mailer-secret-2026-production';

    for (const base of candidates) {
      const cleanBase = base.replace(/\/+$/, '');
      const relayEndpoint = `${cleanBase}/api-relay/send-email`;
      try {
        console.log(`[EMAIL_VERIFICATION] Attempting unblocked HTTPS relay dispatch via ${relayEndpoint}...`);
        const response = await fetch(relayEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            secret,
            to,
            subject,
            html: htmlContent,
            text,
            fromName: 'KruPet - Clinical OS',
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (response.ok) {
          const resData: any = await response.json();
          if (resData?.success) {
            console.log(`[EMAIL_VERIFICATION] Relay successfully delivered email via ${cleanBase}`);
            return {
              success: true,
              message: successMessage,
            };
          }
        } else {
          console.warn(`[EMAIL_VERIFICATION] Relay at ${cleanBase} responded with status ${response.status}`);
        }
      } catch (err: any) {
        console.warn(`[EMAIL_VERIFICATION] Relay attempt at ${cleanBase} failed: ${err.message}`);
      }
    }

    throw new Error('All relay endpoints failed or timed out');
  }

  private async dispatchEmail(params: {
    to: string;
    subject: string;
    text: string;
    htmlContent: string;
    logoBuffer: Buffer | null;
    successMessage: string;
  }): Promise<{ success: boolean; message: string }> {
    const { to, subject, text, htmlContent, logoBuffer, successMessage } = params;
    const user = process.env.GMAIL_USER || 'xflowstudio5@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'lmzagtdkmojpfsfu';
    const pass = rawPass.replace(/\s+/g, '');

    // 1. Mock bypass when running in test mode without an active live transporter
    if ((process.env.NODE_ENV === 'test' || process.env.MOCK_EMAIL === 'true') && !this.transporter) {
      return {
        success: true,
        message: successMessage,
      };
    }

    const mailOptions: any = {
      from: `"KruPet - Clinical OS" <${user}>`,
      to,
      subject,
      text,
      html: htmlContent,
    };

    if (logoBuffer) {
      mailOptions.attachments = [
        {
          filename: 'krupet-logo.png',
          content: logoBuffer,
          cid: 'krupet-logo',
        },
      ];
    }

    // 2. When running with custom injected transporter (e.g. Unit Tests), use that directly!
    if (this.isCustomTransporter && this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        return {
          success: true,
          message: successMessage,
        };
      } catch (customErr: any) {
        console.warn(`[EMAIL_VERIFICATION] Custom mock transporter error (${customErr.message}), trying fallback...`);
        try {
          const fallbackTransport = this.createTransportFn({});
          await fallbackTransport.sendMail(mailOptions);
          return { success: true, message: successMessage };
        } catch {
          throw new BadRequestException(
            'មិនអាចផ្ញើលេខកូដទៅកាន់ Gmail បានទេ។ សូមពិនិត្យមើលអាសយដ្ឋាន Gmail របស់អ្នកឡើងវិញ ឬព្យាយាមម្ដងទៀត។'
          );
        }
      }
    }

    // 3. When running in production on cloud (e.g. Render where SMTP ports 25, 465, 587 are blocked),
    // prioritize the HTTPS Vercel Mailer Relay (Port 443) which bypasses all port blocks cleanly!
    const isCloudHost = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production' || !!process.env.RENDER_SERVICE_ID;

    if (isCloudHost) {
      try {
        return await this.dispatchViaRelay({
          to,
          subject,
          text,
          htmlContent,
          successMessage,
        });
      } catch (relayErr: any) {
        console.warn(`[EMAIL_VERIFICATION] Cloud relay attempt failed (${relayErr.message}), trying direct SMTP...`);
      }
    }

    // Attempt 1: Fast direct send with active pool connection on Port 465 SSL
    try {
      if (!this.transporter) {
        this.initTransporter();
      }
      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
        return {
          success: true,
          message: successMessage,
        };
      }
    } catch (err1: any) {
      console.warn(`[EMAIL_VERIFICATION] Pool send error (${err1.message}), trying dedicated transport...`);
    }

    // Attempt 2: Dedicated transport on port 465 SSL
    try {
      const dedicatedTransport = this.createTransportFn({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
      });
      await dedicatedTransport.sendMail(mailOptions);
      return {
        success: true,
        message: successMessage,
      };
    } catch (err2: any) {
      console.warn(`[EMAIL_VERIFICATION] Dedicated transport error (${err2.message}), trying service gmail...`);
    }

    // Attempt 3: Well-known service 'gmail'
    try {
      const serviceTransport = this.createTransportFn({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 8000,
      });
      await serviceTransport.sendMail(mailOptions);
      return {
        success: true,
        message: successMessage,
      };
    } catch (err3: any) {
      console.warn(`[EMAIL_VERIFICATION] Service gmail error: ${err3.message}`);
    }

    // Attempt 4: If not already attempted, try Vercel HTTPS Relay
    if (!isCloudHost) {
      try {
        return await this.dispatchViaRelay({
          to,
          subject,
          text,
          htmlContent,
          successMessage,
        });
      } catch (relayErr2: any) {
        console.warn(`[EMAIL_VERIFICATION] Fallback relay failed: ${relayErr2.message}`);
      }
    }

    // Attempt 5: Resend HTTPS API (Port 443) if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'KruPet <onboarding@resend.dev>',
            to: [to],
            subject,
            html: htmlContent,
          }),
        });
        if (response.ok) {
          return {
            success: true,
            message: successMessage,
          };
        }
      } catch (err4: any) {
        console.warn(`[EMAIL_VERIFICATION] Resend API error: ${err4.message}`);
      }
    }

    // If all delivery transports fail, throw security-compliant error - NEVER expose code to client!
    console.error(`[EMAIL_VERIFICATION] All delivery attempts failed for recipient: ${to}`);
    throw new BadRequestException(
      'មិនអាចផ្ញើលេខកូដទៅកាន់ Gmail បានទេ។ សូមពិនិត្យមើលអាសយដ្ឋាន Gmail របស់អ្នកឡើងវិញ ឬព្យាយាមម្ដងទៀត។'
    );
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

    // Anti-Spam / Anti-Hacker rate limiting enforcement
    this.checkRateLimit(normalizedEmail);

    const code = this.generateCode(normalizedEmail);
    const logoBuffer = this.resolveLogoBuffer();
    const htmlContent = this.renderEmailHtml({
      code,
      badgeText: 'Clinical OS',
      description: 'សូមស្វាគមន៍មកកាន់ <strong style="color: #064e3b;">KruPet</strong>។ នេះជាលេខកូដបញ្ជាក់ ៦ ខ្ទង់របស់អ្នក ដើម្បីបង្កើត និងផ្ទៀងផ្ទាត់គណនី Workspace គ្លីនិក៖',
      logoBuffer,
    });

    return this.dispatchEmail({
      to: normalizedEmail,
      subject: `[KruPet] លេខកូដបញ្ជាក់ការចុះឈ្មោះគ្លីនិក - Verification Code: ${code}`,
      text: `KruPet - លេខកូដបញ្ជាក់ការចុះឈ្មោះគ្លីនិករបស់អ្នកគឺ: ${code} - មានសុពលភាព ១០ នាទី។`,
      htmlContent,
      logoBuffer,
      successMessage: 'លេខកូដបញ្ជាក់ ៦ ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ Gmail របស់អ្នករួចរាល់ហើយ។ សូមពិនិត្យមើលប្រអប់សំបុត្រ Gmail របស់អ្នក។',
    });
  }

  async sendPasswordResetCode(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const domain = normalizedEmail.split('@')[1];
    if (DUMMY_EMAILS.has(normalizedEmail) || (domain && DUMMY_DOMAINS.includes(domain))) {
      throw new BadRequestException(
        'សូមបញ្ចូលអាសយដ្ឋាន Email ពិតប្រាកដរបស់អ្នកដែលមានដំណើរការធម្មតា។'
      );
    }

    // Anti-Spam / Anti-Hacker rate limiting enforcement
    this.checkRateLimit(normalizedEmail);

    const code = this.generateCode(normalizedEmail);
    const logoBuffer = this.resolveLogoBuffer();
    const htmlContent = this.renderEmailHtml({
      code,
      badgeText: 'Security Notice',
      description: 'យើងបានទទួលសំណើសុំកំណត់ពាក្យសម្ងាត់គណនី KruPet របស់អ្នកឡើងវិញ។ នេះជាលេខកូដសម្ងាត់ ៦ ខ្ទង់សម្រាប់ផ្ទៀងផ្ទាត់៖',
      logoBuffer,
    });

    return this.dispatchEmail({
      to: normalizedEmail,
      subject: `[KruPet] លេខកូដកំណត់ពាក្យសម្ងាត់ឡើងវិញ - Reset Code: ${code}`,
      text: `KruPet - លេខកូដកំណត់ពាក្យសម្ងាត់គណនីឡើងវិញរបស់អ្នកគឺ: ${code} - មានសុពលភាព ១០ នាទី។`,
      htmlContent,
      logoBuffer,
      successMessage: 'លេខកូដបញ្ជាក់ ៦ ខ្ទង់សម្រាប់កំណត់ពាក្យសម្ងាត់ឡើងវិញ ត្រូវបានផ្ញើទៅកាន់ Gmail របស់អ្នករួចរាល់ហើយ។',
    });
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
