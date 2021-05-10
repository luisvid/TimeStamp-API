import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'mssql',
  connector: 'mssql',
  url: '',
  host: '104.248.127.17',
  port: 21799,
  user: 'renzo_api',
  password: 'ro_2021!',
  database: '_colmed'
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MssqlDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'mssql';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mssql', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
