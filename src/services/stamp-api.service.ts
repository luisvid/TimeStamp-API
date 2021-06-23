import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {StampApiDataSource} from '../datasources';

export interface StampApi {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.
  getQrStatus(qr_id: string): Promise<object>;
  loginx(arg: MyLoginInterface): Promise<any>;
  postStamp(arg: MyStampHashes): Promise<any>;
}

export interface MyStampHashes {
  hashes: Array<string>;
}

export interface MyLoginInterface {
  email: string;
  password: string;
}


export class StampApiProvider implements Provider<StampApi> {
  constructor(
    // stamp_api must match the name property in the datasource json file
    @inject('datasources.stamp_api')
    protected dataSource: StampApiDataSource = new StampApiDataSource(),
  ) { }

  value(): Promise<StampApi> {
    return getService(this.dataSource);
  }
}
