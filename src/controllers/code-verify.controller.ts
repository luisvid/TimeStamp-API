import {
  repository
} from '@loopback/repository';
import {get, getModelSchemaRef, post, requestBody, response} from '@loopback/rest';
import {CodeVerify} from '../models';
import {CodeVerifyRepository} from '../repositories';

export class CodeVerifyController {
  constructor(
    @repository(CodeVerifyRepository)
    public codeVerifyRepository: CodeVerifyRepository,
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
    if (codeVerify.codigo) {
      sp = `exec dbo.sp_codigo_verifica "${codeVerify.correo}", "${codeVerify.codigo}" `;
    } else {
      sp = `exec dbo.sp_codigo_verifica "${codeVerify.correo}", null `;
    }

    console.log(sp);
    return this.codeVerifyRepository.dataSource.execute(sp);
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