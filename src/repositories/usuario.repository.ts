import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MssqlDataSource} from '../datasources';
import {Usuario, UsuarioRelations} from '../models';

export class UsuarioRepository extends DefaultCrudRepository<
  Usuario,
  typeof Usuario.prototype.id_usuario,
  UsuarioRelations
> {
  constructor(
    @inject('datasources.mssql') dataSource: MssqlDataSource,
  ) {
    super(Usuario, dataSource);
  }
}
