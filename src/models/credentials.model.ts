import {Model, model, property} from '@loopback/repository';

@model()
export class Credentials extends Model {
  @property({
    type: 'string',
  })
  email: string;

  @property({
    type: 'string',
  })
  clave: string;


  constructor(data?: Partial<Credentials>) {
    super(data);
  }
}

export interface CredentialsRelations {
  // describe navigational properties here
}

export type CredentialsWithRelations = Credentials & CredentialsRelations;
