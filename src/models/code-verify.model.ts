import {Model, model, property} from '@loopback/repository';

@model()
export class CodeVerify extends Model {
  @property({
    type: 'string',
  })
  correo?: string;

  @property({
    type: 'string',
  })
  codigo?: string;

  constructor(data?: Partial<CodeVerify>) {
    super(data);
  }
}

export interface CodeVerifyRelations {
  // describe navigational properties here
}

export type CodeVerifyWithRelations = CodeVerify & CodeVerifyRelations;
