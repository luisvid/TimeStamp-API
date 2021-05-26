import {HttpErrors} from '@loopback/rest';
import * as isEmail from 'isemail';
import {Credentials} from '../models';

export function validateCredentials(credentials: Credentials) {
  if (!isEmail.validate(credentials.email)) {
    throw new HttpErrors.UnprocessableEntity('invalid Email');
  }
  if (credentials.clave.length < 8) {
    throw new HttpErrors.UnprocessableEntity('password length should be greater than 8')
  }
}
