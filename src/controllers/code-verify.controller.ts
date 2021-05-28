import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {get, getModelSchemaRef, HttpErrors, post, requestBody, response} from '@loopback/rest';
import {CodeVerify, NodeMailer} from '../models';
import {CodeVerifyRepository} from '../repositories';
import {EmailService} from '../services/email.service';

export class CodeVerifyController {
  constructor(
    @repository(CodeVerifyRepository)
    public codeVerifyRepository: CodeVerifyRepository,

    @inject('services.EmailService')
    public emailService: EmailService,
  ) { }


  @get('/code-verifies/test', {
    responses: {
      '200': {
        description: 'test SP executing query',
      },
    },
  })
  async test(): Promise<any> {
    return this.codeVerifyRepository.dataSource.execute('exec dbo.sp_help sp_codigo_verifica');
  }

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
            exclude: ['id'],
          }),
        },
      },
    })
    codeVerify: Omit<CodeVerify, 'id'>,
  ): Promise<CodeVerify> {
    // return this.codeVerifyRepository.create(codeVerify);

    let sp = "";
    let sendEmail = false;

    if (codeVerify.codigo) {
      sp = `exec dbo.sp_codigo_verifica "${codeVerify.correo}", "${codeVerify.codigo}" `;
    } else {
      sp = `exec dbo.sp_codigo_verifica "${codeVerify.correo}", null `;
      sendEmail = true;
    }

    console.log("Ejecuta XP: " + sp);
    const retVal = await this.codeVerifyRepository.dataSource.execute(sp);
    console.log("SP Retorna: " + retVal[0]);

    if (sendEmail && retVal[0].codigo) {
      console.log("Enviar al email " + codeVerify.correo + " el código: " + retVal[0].codigo);
      // Send an email to the user's email address

      codeVerify.correo = "luisvid@gmail.com";
      codeVerify.codigo = retVal[0].codigo;
      const nodeMailer: NodeMailer = await this.emailService.sendCodigoMail(codeVerify);

      // Nodemailer has accepted the request. All good
      if (nodeMailer.accepted.length) {
        console.log('An email with password reset instructions has been sent to the provided email');
      } else {
        // Nodemailer did not complete the request alert the user
        throw new HttpErrors.InternalServerError(
          'Error sending código email',
        );
      }
    }

    return codeVerify;
  }

  // @get('/code-verifies/count')
  // @response(200, {
  //   description: 'CodeVerify model count',
  //   content: {'application/json': {schema: CountSchema}},
  // })
  // async count(
  //   @param.where(CodeVerify) where?: Where<CodeVerify>,
  // ): Promise<Count> {
  //   return this.codeVerifyRepository.count(where);
  // }

  // @get('/code-verifies')
  // @response(200, {
  //   description: 'Array of CodeVerify model instances',
  //   content: {
  //     'application/json': {
  //       schema: {
  //         type: 'array',
  //         items: getModelSchemaRef(CodeVerify, {includeRelations: true}),
  //       },
  //     },
  //   },
  // })
  // async find(
  //   @param.filter(CodeVerify) filter?: Filter<CodeVerify>,
  // ): Promise<CodeVerify[]> {
  //   return this.codeVerifyRepository.find(filter);
  // }

  // @patch('/code-verifies')
  // @response(200, {
  //   description: 'CodeVerify PATCH success count',
  //   content: {'application/json': {schema: CountSchema}},
  // })
  // async updateAll(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(CodeVerify, {partial: true}),
  //       },
  //     },
  //   })
  //   codeVerify: CodeVerify,
  //   @param.where(CodeVerify) where?: Where<CodeVerify>,
  // ): Promise<Count> {
  //   return this.codeVerifyRepository.updateAll(codeVerify, where);
  // }

  // @get('/code-verifies/{id}')
  // @response(200, {
  //   description: 'CodeVerify model instance',
  //   content: {
  //     'application/json': {
  //       schema: getModelSchemaRef(CodeVerify, {includeRelations: true}),
  //     },
  //   },
  // })
  // async findById(
  //   @param.path.number('id') id: number,
  //   @param.filter(CodeVerify, {exclude: 'where'}) filter?: FilterExcludingWhere<CodeVerify>
  // ): Promise<CodeVerify> {
  //   return this.codeVerifyRepository.findById(id, filter);
  // }

  // @patch('/code-verifies/{id}')
  // @response(204, {
  //   description: 'CodeVerify PATCH success',
  // })
  // async updateById(
  //   @param.path.number('id') id: number,
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(CodeVerify, {partial: true}),
  //       },
  //     },
  //   })
  //   codeVerify: CodeVerify,
  // ): Promise<void> {
  //   await this.codeVerifyRepository.updateById(id, codeVerify);
  // }

  // @put('/code-verifies/{id}')
  // @response(204, {
  //   description: 'CodeVerify PUT success',
  // })
  // async replaceById(
  //   @param.path.number('id') id: number,
  //   @requestBody() codeVerify: CodeVerify,
  // ): Promise<void> {
  //   await this.codeVerifyRepository.replaceById(id, codeVerify);
  // }

  // @del('/code-verifies/{id}')
  // @response(204, {
  //   description: 'CodeVerify DELETE success',
  // })
  // async deleteById(@param.path.number('id') id: number): Promise<void> {
  //   await this.codeVerifyRepository.deleteById(id);
  // }



}
