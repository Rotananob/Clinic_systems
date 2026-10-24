import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const RELAY_SECRET = process.env.INTERNAL_MAILER_SECRET || 'krupet-mailer-secret-2026-production';

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    relay: 'Vercel SMTPS Unblocked Mailer Relay',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, to, subject, html, text, fromName, headers, replyTo, attachments } = body;

    if (!secret || secret !== RELAY_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized mailer relay access' },
        { status: 401 }
      );
    }

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, message: 'Missing required recipient or content parameters' },
        { status: 400 }
      );
    }

    const user = process.env.GMAIL_USER || 'xflowstudio5@gmail.com';
    const rawPass = process.env.GMAIL_APP_PASSWORD || 'lmzagtdkmojpfsfu';
    const pass = rawPass.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 12000,
      greetingTimeout: 12000,
    });

    const senderName = fromName || 'KruPet';
    const mailOptions: any = {
      from: `"${senderName}" <${user}>`,
      to,
      replyTo: replyTo || user,
      subject,
      text: text || '',
      html: html || '',
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
        'X-Priority': '1',
        'Importance': 'high',
        'Priority': 'urgent',
        ...(headers || {}),
      },
    };

    if (attachments && Array.isArray(attachments)) {
      mailOptions.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content ? Buffer.from(att.content, att.encoding || 'base64') : undefined,
        cid: att.cid,
        contentType: att.contentType,
      }));
    }

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Email dispatched successfully via Vercel unblocked relay',
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('[API_RELAY] Error sending email via Vercel:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to dispatch email via relay',
      },
      { status: 500 }
    );
  }
}
