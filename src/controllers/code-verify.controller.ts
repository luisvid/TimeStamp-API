import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {getModelSchemaRef, HttpErrors, post, requestBody, response} from '@loopback/rest';
import {CodeVerify, NodeMailer} from '../models';
import {UsuarioRepository} from '../repositories';
// import {CodeVerifyRepository} from '../repositories';
import {EmailService} from '../services/email.service';

export class CodeVerifyController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,

    @inject('services.EmailService')
    public emailService: EmailService,
  ) { }


  // @get('/code-verifies/test', {
  //   responses: {
  //     '200': {
  //       description: 'test SP executing query',
  //     },
  //   },
  // })
  // async test(): Promise<any> {
  //   return this.usuarioRepository.dataSource.execute('exec dbo.sp_help sp_codigo_verifica');
  // }

  @post('/code-verifies')
  @response(200, {
    description: 'CodeVerify model instance',
    content: {'application/json': {schema: getModelSchemaRef(CodeVerify)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CodeVerify, {
            title: 'NewCodeVerify',
          }),
        },
      },
    })
    codeVerify: CodeVerify,
  ): Promise<CodeVerify> {

    let sp = "";
    let sendEmail = false;

    // armo ejecución del SP dependiendo si el codigo es informado o no
    if (codeVerify.codigo) {
      sp = `exec dbo.sp_codigo_verifica "${codeVerify.correo}", "${codeVerify.codigo}" `;
    } else {
      sp = `exec dbo.sp_codigo_verifica "${codeVerify.correo}", null `;
      sendEmail = true;
    }

    //Ejecuto SP
    const spRetVal = await this.usuarioRepository.dataSource.execute(sp);

    // Si el código no es informado y se genera exitosamente envía email al solicitante
    if (sendEmail && spRetVal[0].codigo) {
      codeVerify.codigo = spRetVal[0].codigo;
      const nodeMailer: NodeMailer = await this.emailService.sendCodigoMail(codeVerify, spRetVal[0].nombre);

      // Nodemailer has accepted the request. All good
      if (nodeMailer.accepted.length) {
        const retmsg = "Se envió un email a " + codeVerify.correo + " con el código: " + codeVerify.codigo;
        codeVerify.codigo = retmsg;
      } else {
        // Nodemailer did not complete the request alert the user
        throw new HttpErrors.InternalServerError(
          'Error sending código email',
        );
      }
    } else {
      codeVerify.codigo = spRetVal[0].msg;
    }

    return codeVerify;
  }

}
