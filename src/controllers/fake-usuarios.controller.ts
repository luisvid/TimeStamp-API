// // Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';
// import {get, param} from '@loopback/rest';
// import {UsersService} from '../services';


// export class FakeUsuariosController {
//   constructor(
//     @inject('services.UsersService')
//     protected userServices: UsersService,
//   ) { }

//   @get('/usuarios/{userId}')
//   async getUser(
//     @param.path.integer('userId') userId: number,
//   ): Promise<object> {
//     //Preconditions

//     // return this.peopleService.getCharacter(personId);
//     return this.userServices.getUser(userId);
//   }

//   @get('/wine/{wineId}')
//   async getWinw(
//     @param.path.integer('wineId') wineId: number,
//   ): Promise<object> {
//     //Preconditions

//     return this.userServices.getWine(wineId);
//   }

//   @get('/qrstatus/{qr_id}')
//   async getQrStatus(
//     @param.path.string('qr_id') qr_id: string,
//   ): Promise<object> {
//     //Preconditions

//     return this.userServices.getQrStatus(qr_id);
//   }

// }
