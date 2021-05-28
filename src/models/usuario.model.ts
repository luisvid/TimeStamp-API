import {Entity, model, property} from '@loopback/repository';

@model()
export class Usuario extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id_usuario?: number;

  @property({
    type: 'string',
  })
  n_usuario?: string;

  @property({
    type: 'string',
  })
  email: string;

  @property({
    type: 'string',
  })
  clave: string;

  @property({
    type: 'number',
  })
  id_referencia?: number;

  @property({
    type: 'string',
  })
  resetKey?: string;

  @property({
    type: 'string',
  })
  codigo?: string;

  [prop: string]: any;

  constructor(data?: Partial<Usuario>) {
    super(data);
  }
}

export interface UsuarioRelations {
  // describe navigational properties here
}

export type UsuarioWithRelations = Usuario & UsuarioRelations;
