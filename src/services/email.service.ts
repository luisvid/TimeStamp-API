import {bind, BindingScope} from '@loopback/core';
import {createTransport} from 'nodemailer';
import {CodeVerify, EmailSoporte, EmailTemplate, NodeMailer, Usuario} from '../models';

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
      // from: 'soporte@colmedmobile.com',
      from: 'sistemas@colmed5.org.ar',
      to: user.email,
      subject: 'SOLICITUD DE CAMBIO DE CLAVE - Colmed Mobile',
      html: `
      <div>
        <h2>Estimado/a</h2>
        <h2>${user.n_usuario}</h2>
        <p>Ud. ha solicitado cambio de clave como usuario de Colmed Mobile.</p>
        <p>Para modificar debe ingresar en
        <a href=https://colmedmobile.com/reset-password-finish?${user.resetKey}>Cambiar contraseña</a>
        <p>Y a continuación, deberá ingresar los datos que pide la página.</p>
        <p>Saludos cordiales</p>
        <p><strong>Cualquier inconveniente puede escribir a este correo.</strong></p>
        <img src="https://documentos.greykoda.com/greykoda/logo-nombre.png" alt="GreyKoda Logo">
      </div>
      `,
    });
    return transporter.sendMail(emailTemplate);
  }

  async sendCodigoMail(codeVerify: CodeVerify, nombre: string): Promise<NodeMailer> {
    const transporter = await EmailService.setupTransporter();
    const emailTemplate = new EmailTemplate({
      to: codeVerify.correo,
      // from: 'no-reply@colmedmobile.com',
      from: 'sistemas@colmed5.org.ar',
      subject: 'SOLICITUD DE CÓDIGO - Colmed Mobile',
      html: `
      <div>
        <h2>Estimado/a</h2>
        <h2>${nombre}</h2>
        <p>Ud. ha solicitado código para registrarse como usuario de Colmed Mobile.</p>
        <p><b>Su código es : ${codeVerify.codigo}</b></p>
        <p>Para continuar el registro deberá ingresar en
        <a href="https://colmedmobile.com/" target="_blank">https://colmedmobile.com</a> </p>
        <p>Y a continuación, deberá ingresar los datos que pide la página.</p>
        <p>Esperamos que la aplicación sea de su agrado y lo ayude en su actividad profesional.</p>
        <p>Saludos cordiales</p>
        <p><strong>No debe responder este correo.</strong></p>
        <img src="https://documentos.greykoda.com/greykoda/logo-nombre.png" alt="GreyKoda Logo">
      </div>
      `,
    });
    return transporter.sendMail(emailTemplate);
  }

  async sendSoporteMail(soporte: EmailSoporte, user: Usuario): Promise<NodeMailer> {
    const transporter = await EmailService.setupTransporter();
    const emailTemplate = new EmailTemplate({
      from: 'sistemas@colmed5.org.ar',
      to: 'sistemas@colmed5.org.ar',
      subject: 'SOLICITUD DE SOPORTE - Colmed Mobile',
      html: `
      <div>
        <h2>Para: Soporte</h2>
        <h2>De: ${user.n_usuario}</h2>
        <h2>Email: ${soporte.from}</h2>
        <p>${soporte.text}</p>
        <img src="https://documentos.greykoda.com/greykoda/logo-nombre.png" alt="GreyKoda Logo">
      </div>
      `,
    });
    return transporter.sendMail(emailTemplate);
  }
}
