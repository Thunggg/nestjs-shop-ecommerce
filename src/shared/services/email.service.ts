import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';
import envConfig from '../config';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY);
  }

  async sendOTP(payload: { email: string; code: string }) {
    const otpTemplate = fs.readFileSync(
      path.resolve('src/shared/email-template/otp.html'),
      'utf-8',
    );

    console.log(otpTemplate);
    return await this.resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [`${payload.email}`],
      subject: 'Verify email',
      html: otpTemplate
        .replaceAll('{{code}}', payload.code)
        .replaceAll('{{to}}', payload.email),
    });
  }
}
