import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';


const dbDatabase = process.env.DB_DATABASE;
const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '')
const dbPortN = Number.isInteger(dbPort) ? dbPort : 21799
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;


// ** db config
const config = {
  name: 'mssql',
  connector: 'mssql',
  host: dbHost,
  port: dbPortN,
  user: dbUser,
  password: dbPassword,
  database: dbDatabase
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
