import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {StampApiDataSource} from '../datasources';

export interface UsersService {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.
  getUser(userId: number): Promise<object>;
  getWine(wineId: number): Promise<object>;
  getQrStatus(qr_id: string): Promise<object>;
}

export class UsersServiceProvider implements Provider<UsersService> {
  constructor(
    // stamp_api must match the name property in the datasource json file
    @inject('datasources.stamp_api')
    protected dataSource: StampApiDataSource = new StampApiDataSource(),
  ) { }

  value(): Promise<UsersService> {
    return getService(this.dataSource);
  }
}
