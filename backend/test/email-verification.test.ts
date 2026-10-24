import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EmailVerificationService } from '../src/auth/email-verification.service.ts';

describe('EmailVerificationService Test Suite', () => {
  const service = new EmailVerificationService();

  it('should generate a 6-digit verification code', () => {
    const code = service.generateCode('test@gmail.com');
    assert.ok(code);
    assert.equal(code.length, 6);
    assert.match(code, /^\d{6}$/);
  });

  it('should verify code successfully when matching', () => {
    const code = service.generateCode('doctor@clinic.com');
    const result = service.verifyCode('doctor@clinic.com', code);
    assert.equal(result, true);
  });

  it('should reject incorrect code', () => {
    service.generateCode('doctor@clinic.com');
    assert.throws(
      () => {
        service.verifyCode('doctor@clinic.com', '999999');
      },
      {
        message: 'លេខកូដបញ្ជាក់មិនត្រឹមត្រូវទេ។',
      }
    );
  });

  it('should throw for unknown email', () => {
    assert.throws(
      () => {
        service.verifyCode('unknown@clinic.com', '123456');
      },
      {
        message: 'គ្មានសំណើសុំលេខកូដសម្រាប់ Email នេះ ឬលេខកូដបានផុតកំណត់។',
      }
    );
  });

  it('should lock out after 5 incorrect attempts', () => {
    service.generateCode('lockout@test.com');
    for (let i = 0; i < 4; i++) {
      try {
        service.verifyCode('lockout@test.com', '000000');
      } catch {
        // expected
      }
    }
    // 5th failed attempt should trigger max attempts lockout
    assert.throws(() => {
      service.verifyCode('lockout@test.com', '000000');
    });
  });

  it('should reject dummy or placeholder test emails', async () => {
    await assert.rejects(
      async () => {
        await service.sendVerificationCode('test.user@gmail.com');
      },
      {
        message: 'សូមបញ្ចូលអាសយដ្ឋាន Email ពិតប្រាកដរបស់អ្នកដែលមានដំណើរការធម្មតា។ មិនអនុញ្ញាតឱ្យប្រើប្រាស់ Email សាកល្បងដូចជា test.user@gmail.com ឡើយ។',
      }
    );
  });

  it('should dispatch sendVerificationCode safely with mock transporter without real network bounce', async () => {
    let capturedMail: any = null;
    service.setTransporter({
      sendMail: async (options: any) => {
        capturedMail = options;
        return { messageId: 'mock-verified-id' };
      },
    } as any);

    const res = await service.sendVerificationCode('doctor.cheasok@krupet.health');
    assert.equal(res.success, true);
    assert.ok(res.message);
    assert.ok(capturedMail);
    assert.equal(capturedMail.to, 'doctor.cheasok@krupet.health');
    assert.match(capturedMail.subject, /KruPet/);
    assert.match(capturedMail.html, /KruPet/);
    assert.equal(capturedMail.headers['Auto-Submitted'], 'auto-generated');
  });

  it('should dispatch sendPasswordResetCode safely with reset subject and template', async () => {
    let capturedMail: any = null;
    service.setTransporter({
      sendMail: async (options: any) => {
        capturedMail = options;
        return { messageId: 'mock-reset-id' };
      },
    } as any);

    const res = await service.sendPasswordResetCode('doctor.reset@krupet.health');
    assert.equal(res.success, true);
    assert.ok(res.message);
    assert.ok(capturedMail);
    assert.equal(capturedMail.to, 'doctor.reset@krupet.health');
    assert.match(capturedMail.subject, /កំណត់ពាក្យសម្ងាត់/);
    assert.match(capturedMail.html, /Security Notice/);
  });

  it('should throw BadRequestException and never leak verification code when all SMTP transports fail', async () => {
    service.setTransporter({
      sendMail: async () => {
        throw new Error('connect ETIMEDOUT 142.250.150.108:465');
      },
    } as any);

    service.createTransportFn = () =>
      ({
        sendMail: async () => {
          throw new Error('connect ETIMEDOUT 142.250.150.108:587');
        },
      }) as any;

    await assert.rejects(
      async () => {
        await service.sendVerificationCode('unreachable.host@krupet.health');
      },
      {
        message: 'មិនអាចផ្ញើលេខកូដទៅកាន់ Gmail បានទេ។ សូមពិនិត្យមើលអាសយដ្ឋាន Gmail របស់អ្នកឡើងវិញ ឬព្យាយាមម្ដងទៀត។',
      }
    );
  });

  it('should enforce 60-second rate limit to prevent spam scripts', async () => {
    service.setTransporter({
      sendMail: async () => ({ messageId: 'mock-id' }),
    } as any);

    await service.sendVerificationCode('ratelimit.test@krupet.health');

    // Immediate second attempt must be blocked by rate limit
    await assert.rejects(
      async () => {
        await service.sendVerificationCode('ratelimit.test@krupet.health');
      },
      (err: any) => {
        return err.message && err.message.includes('សូមរង់ចាំ');
      }
    );
  });
});
