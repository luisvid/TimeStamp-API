import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'stamp_api',
  connector: 'rest',
  baseURL: 'http://165.232.157.193:3000/', //'http://nodocolmed.greykoda.com:3000/',
  crud: false,
  options: {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  },
  operations: [
    {
      template: {
        method: 'GET',
        url: 'http://165.232.157.193:3000/qrstatus/{qr_id}',
      },
      functions: {
        getQrStatus: ['qr_id'],
      },
    },
    {
      template: {
        method: "POST",
        url: "http://165.232.157.193:3000/login",
        body: '{arg}',
      },
      functions: {
        loginx: ['arg']
      },
    },
    {
      template: {
        method: 'POST',
        url: 'http://nodocolmed.greykoda.com:3000/stamp',
        body: '{arg}',
      },
      functions: {
        postStamp: ['arg'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'http://nodocolmed.greykoda.com:3000/verify/{hash}',
      },
      functions: {
        getVerify: ['hash'],
      },
    },
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class StampApiDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'stamp_api';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.stamp_api', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
