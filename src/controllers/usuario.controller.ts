import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getJsonSchemaRef, HttpErrors, post, put, requestBody} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import * as _ from 'lodash';
import {v4 as uuidv4} from 'uuid';
import {PasswordHasherBindings, TokenServiceBindings, UserServiceBindings} from '../keys';
import {Credentials, KeyAndPassword, NodeMailer, ResetPasswordInit, Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
import {validateCredentials} from '../services';
import {EmailService} from '../services/email.service';
import {BcryptHasher} from '../services/hash.password';
import {JWTService} from '../services/jwt-service';
import {MyUserService} from '../services/user-service';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,

    // @inject('service.hasher')
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher,

    // @inject('service.user.service')
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,

    // @inject('service.jwt.service')
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: JWTService,

    // @inject(SecurityBindings.USER, {optional: true})
    // public user: UserProfile,

    @inject('services.EmailService')
    public emailService: EmailService,

  ) { }

  @post('/signup', {
    responses: {
      '200': {
        description: 'Usuario',
        content: {
          schema: getJsonSchemaRef(Usuario)
        }
      }
    }
  })
  async signup(@requestBody() userData: Usuario) {
    const cred = new Credentials(_.pick(userData, ['email', 'clave']));
    validateCredentials(cred);

    // Ejecutar SP con email y clave, si está OK obtener id referencia
    const sp = `exec dbo.sp_codigo_verifica "${userData.email}", "${userData.codigo}" `;
    const retVal = await this.usuarioRepository.dataSource.execute(sp);

    if (retVal[0].referencia) {
      userData.id_referencia = retVal[0].referencia;
      userData.codigo = undefined;
    } else {
      return 'Error grabando usuario: ' + retVal[0].msg;
    }

    userData.clave = await this.hasher.hashPassword(userData.clave!)
    const savedUser = await this.usuarioRepository.create(userData);

    return _.omit(savedUser, ['id_usuario', 'clave']);
  }

  @post('/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  })
  async login(
    @requestBody() credentials: Credentials,
  ): Promise<{token: string}> {
    // make sure user exist,password should be valid
    const user = await this.userService.verifyCredentials(credentials);
    console.log(user);

    const userProfile = await this.userService.convertToUserProfile(user);
    console.log(userProfile);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    return Promise.resolve({token: token})
  }


  @authenticate("jwt")
  @get('/users/me', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: getJsonSchemaRef(Usuario),
          },
        },
      },
    },
  })
  async me(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<UserProfile> {
    return Promise.resolve(currentUser);
  }


  // We will add our password reset here
  @post('/reset-password/init')
  async resetPasswordInit(
    @requestBody() resetPasswordInit: ResetPasswordInit,
  ): Promise<string> {
    // checks whether email is valid as per regex pattern provided
    const email = await this.validateEmail(resetPasswordInit.email);

    // At this point we are dealing with valid email.
    // Lets check whether there is an associated account
    const foundUser = await this.usuarioRepository.findOne({
      where: {email},
    });

    // No account found
    if (!foundUser) {
      throw new HttpErrors.NotFound(
        'No account associated with the provided email address.',
      );
    }

    // We generate unique reset key to associate with reset request
    foundUser.resetKey = uuidv4();

    try {
      // Updates the user to store their reset key with error handling
      console.log("Updates the user to store their reset key with error handling");
      await this.usuarioRepository.updateById(foundUser.id_usuario, foundUser);

    } catch (e) {
      console.log("error: " + e);
      return e;
    }

    // Send an email to the user's email address
    console.log("Send an email to the user's email address");
    const nodeMailer: NodeMailer = await this.emailService.sendResetPasswordMail(
      foundUser,
    );

    // Nodemailer has accepted the request. All good
    if (nodeMailer.accepted.length) {
      return 'An email with password reset instructions has been sent to the provided email';
    }

    // Nodemailer did not complete the request alert the user
    throw new HttpErrors.InternalServerError(
      'Error sending reset password email',
    );
  }



  @put('/reset-password/finish')
  async resetPasswordFinish(
    @requestBody() keyAndPassword: KeyAndPassword,
  ): Promise<string> {
    // Checks whether password and reset key meet minimum security requirements
    const {resetKey, password} = await this.validateKeyPassword(keyAndPassword);

    // Search for a user using reset key
    const foundUser = await this.usuarioRepository.findOne({
      where: {resetKey: resetKey},
    });

    // No user account found
    if (!foundUser) {
      throw new HttpErrors.NotFound(
        'No associated account for the provided reset key',
      );
    }

    // Encrypt password to avoid storing it as plain text
    const passwordHash = await this.hasher.hashPassword(password);

    try {
      // Update user password with the newly provided password
      // await this.userRepository
      //   .userCredentials(foundUser.id)
      //   .patch({password: passwordHash});

      foundUser.clave = passwordHash;
      // Remove reset key from database its no longer valid
      foundUser.resetKey = '';

      // Update the user removing the reset key
      await this.usuarioRepository.updateById(foundUser.id_usuario, foundUser);
    } catch (e) {
      return e;
    }

    return 'Password reset request completed successfully';
  }

  async validateKeyPassword(keyAndPassword: KeyAndPassword): Promise<KeyAndPassword> {
    if (!keyAndPassword.password || keyAndPassword.password.length < 8) {
      throw new HttpErrors.UnprocessableEntity(
        'Password must be minimum of 8 characters',
      );
    }

    if (keyAndPassword.password !== keyAndPassword.confirmPassword) {
      throw new HttpErrors.UnprocessableEntity(
        'Password and confirmation password do not match',
      );
    }

    if (
      _.isEmpty(keyAndPassword.resetKey) ||
      keyAndPassword.resetKey.length === 0 ||
      keyAndPassword.resetKey.trim() === ''
    ) {
      throw new HttpErrors.UnprocessableEntity('Reset key is mandatory');
    }

    return keyAndPassword;
  }

  async validateEmail(email: string): Promise<string> {
    const emailRegPattern = /\S+@\S+\.\S+/;
    if (!emailRegPattern.test(email)) {
      throw new HttpErrors.UnprocessableEntity('Invalid email address');
    }
    return email;
  }
}
