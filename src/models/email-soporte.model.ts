// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: loopback4-example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity, model, property} from '@loopback/repository';

@model()
export class EmailSoporte extends Entity {
  @property({
    type: 'string',
  })
  from: string;

  @property({
    type: 'string',
    required: true,
  })
  text: string;

  constructor(data?: Partial<EmailSoporte>) {
    super(data);
  }
}

export interface EmailSoporteRelations {
  // describe navigational properties here
}

export type EmailSoporteWithRelations = EmailSoporte &
  EmailSoporteRelations;
