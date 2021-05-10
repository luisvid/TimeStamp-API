import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MssqlDataSource} from '../datasources';
import {CodeVerify, CodeVerifyRelations} from '../models';

export class CodeVerifyRepository extends DefaultCrudRepository<
  CodeVerify,
  typeof CodeVerify.prototype.id,
  CodeVerifyRelations
> {
  constructor(
    @inject('datasources.mssql') dataSource: MssqlDataSource,
  ) {
    super(CodeVerify, dataSource);
  }
}
