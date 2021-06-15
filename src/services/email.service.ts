import {bind, BindingScope} from '@loopback/core';
import {createTransport} from 'nodemailer';
import {CodeVerify, EmailTemplate, NodeMailer, Usuario} from '../models';

@bind({scope: BindingScope.TRANSIENT})
export class EmailService {
  /**
   * If using gmail see https://nodemailer.com/usage/using-gmail/
   */
  private static async setupTransporter() {
    return createTransport({
      host: process.env.SMTP_SERVER,
      port: +process.env.SMTP_PORT!,
      secure: false, //false: upgrade later with STARTTLS - true: using ferozo
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
      },
      debug: true,
      logger: true
    });
  }

  async sendResetPasswordMail(user: Usuario): Promise<NodeMailer> {
    const transporter = await EmailService.setupTransporter();
    const emailTemplate = new EmailTemplate({
      to: user.email,
      subject: '[GreyKoda] Reset Password Request',
      html: `
      <div>
          <p>Hi there,</p>
          <p style="color: red;">We received a request to reset the password for your account</p>
          <p>To reset your password click on the link provided below</p>
          <a href="${process.env.APPLICATION_URL}/reset-password-finish.html?resetKey=${user.resetKey}">Reset your password link</a>
          <p>If you didn’t request to reset your password, please ignore this email or reset your password to protect your account.</p>
          <p>Thanks</p>
          <p>GreyKoda team</p>
      </div>
      `,
    });
    return transporter.sendMail(emailTemplate);
  }

  async sendCodigoMail(codeVerify: CodeVerify): Promise<NodeMailer> {
    const transporter = await EmailService.setupTransporter();
    const emailTemplate = new EmailTemplate({
      to: codeVerify.correo,
      subject: '[GreyKoda] Código requerido para registro',
      html: `
      <div>
          <p>Hola,</p>
          <p style="color: red;">Recibimos una solicitud de registro</p>
          <p>El código necesario para completar el registro es el siguiente</p>
          <p>${codeVerify.codigo}</p>
          <p>Si usted no solicitó este Código, por favor ignore este email.</p>
          <p>Gracias</p>
          <p>GreyKoda team</p>
      </div>
      `,
    });
    return transporter.sendMail(emailTemplate);
  }
}
