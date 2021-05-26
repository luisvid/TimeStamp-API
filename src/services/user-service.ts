import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {PasswordHasherBindings} from '../keys';
import {Credentials, Usuario} from '../models';
import {UsuarioRepository} from '../repositories/usuario.repository';
import {BcryptHasher} from './hash.password';

export class MyUserService implements UserService<Usuario, Credentials>{
  constructor(
    @repository(UsuarioRepository)
    public userRepository: UsuarioRepository,

    // @inject('service.hasher')
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher

  ) { }
  async verifyCredentials(credentials: Credentials): Promise<Usuario> {
    // implement this method
    const foundUser = await this.userRepository.findOne({
      where: {
        email: credentials.email
      }
    });
    if (!foundUser) {
      throw new HttpErrors.NotFound('user not found');
    }
    const passwordMatched = await this.hasher.comparePassword(credentials.clave, foundUser.clave)
    if (!passwordMatched)
      throw new HttpErrors.Unauthorized('password is not valid');
    return foundUser;
  }

  convertToUserProfile(user: Usuario): UserProfile {
    let userName = '';

    if (user.n_usuario) {
      userName = user.n_usuario;
    }
    // if (user.firstName)
    //   userName = user.firstName;
    // if (user.lastName) {
    //   userName = user.firstName ? `${user.firstName} ${user.lastName}` : user.lastName;
    // }

    return {
      [securityId]: user.id_usuario!.toString(),
      name: userName,
      id: user.id_usuario,
      email: user.email
    };
    // throw new Error('Method not implemented.');
  }

}
