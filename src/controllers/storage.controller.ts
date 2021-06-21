import {authenticate, AuthenticationBindings} from '@loopback/authentication'
import {inject} from '@loopback/core'
import {repository} from '@loopback/repository'
import {post, Request, requestBody, Response, RestBindings} from '@loopback/rest'
// import {UserProfile} from 'aws-sdk/clients/opsworks'
import {UserProfile} from '@loopback/security'
import AWS from 'aws-sdk'
import crypto from 'crypto'
import multer from 'multer'
import stream from 'stream'
import {UsuarioRepository} from '../repositories'

const {Duplex} = stream

function bufferToStream(buffer: any) {
  const duplexStream = new Duplex()
  duplexStream.push(buffer)
  duplexStream.push(null)
  return duplexStream
}

function getHashFromFile(file: any) {
  // https://emn178.github.io/online-tools/sha256_checksum.html
  const fileBuffer = file.buffer;
  const objectCrypto = crypto.createHash('sha256');
  objectCrypto.update(fileBuffer);
  return objectCrypto.digest('hex');
}

const config = {
  // region: process.env.S3_REGION,
  accessKeyId: process.env.S3_ACCESSKEYID,
  secretAccessKey: process.env.S3_SECRETACCESSKEY,
  endpoint: process.env.S3_ENDPOINT,
}
const bucketName = process.env.S3_BUCKET;

const s3 = new AWS.S3(config)
export class StorageController {

  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,

  ) { }


  @authenticate("jwt")
  @post('/filesx', {
    responses: {
      200: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
        description: 'Files and fields',
      },
    },
  })
  async fileUploadX(
    @requestBody.file()
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
  ): Promise<UserProfile> {


    console.log(currentUser.name);
    console.log(currentUser.id);


    return currentUser;
  }


  // file upload to S3
  // params: name & desc
  // http://localhost:3000/files/?name=unNombre&desc=UnaDescripcion
  @authenticate("jwt")
  @post('/files', {
    responses: {
      200: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
        description: 'Files and fields',
      },
    },
  })
  async fileUpload(
    @requestBody.file()
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
  ): Promise<string> {

    let sp = "";
    let fileHash = "";
    let fileName = "";  //request.query.name ?? "";
    let fileDescription = request.query.desc ?? " ";
    let fileLocation = "";
    let allHashes: Array<string> = [];


    console.log(currentUser);
    console.log("Nombre Archivo: " + fileName);
    console.log("Descripción Archivo: " + fileDescription);


    // TODO
    // 1- Obtener HASH
    // 2- Upload a S3
    // 3- SP insert DB
    // 4- Call endpoints nodo sellador
    // 5- SP Update DB


    // 2- Upload a S3
    await new Promise<object>((resolve, reject) => {
      const storage = multer.memoryStorage()
      const upload = multer({storage})

      upload.any()(request, response, async (err: any) => {
        if (err) reject(err)
        else {
          let res = new Array()
          for (const file of (request as any).files) {
            // 1 - Get HASH FILE
            fileHash = getHashFromFile(file);
            allHashes.push(fileHash)
            fileName = request.query.name ?? file.originalname;

            const params = {
              Bucket: bucketName!,
              ACL: 'public-read',
              Key: fileHash,
              Body: bufferToStream(file.buffer)
            }

            try {
              const stored = await s3.upload(params).promise()
              console.log(stored);
              res.push(stored)
              fileLocation = stored.Location;
            } catch (err) {
              reject(err)
            }

          }
          resolve(res)
        }
      })
    })
    console.log('fin upload S3');

    // 3- SP insert DB

    // sp = `exec dbo.sp_codigo_verifica "${codeVerify.correo}", "${codeVerify.codigo}" `;
    let today = new Date();

    sp = `exec dbo.sp_bfa_documento_insert
            @p_bfa_hash = "${fileHash}",
            @p_n_documento = "${fileName}",
            @p_n_adjunto = "${fileLocation.slice(-127)}",
            @p_fecha = "${today.toISOString().split('T')[0]}",
            @p_id_usuario = "${currentUser.id}",
            @p_descripcion = "${fileDescription}"`;

    console.log(sp);
    const spRetVal = await this.usuarioRepository.dataSource.execute(sp);
    console.log(spRetVal);





    // // 4 - Call endpoints nodo sellador
    // // ¿ Luis tenes algún ejemplo de como invocar una API desde Loopback 4 ?
    // // Dejo este ejemplo de cómo lo haría desde Sails JS con AXIOS
    // let txResponse = [];
    // const arpiurl = "aca_va_la_IP_de_la_api";
    // const stampUrl = `${apiurl}/stamp`

    // // *** Puede que demore ***
    // // Resolver mediante peticiones asíncronas
    // axios.post(stampUrl, {
    //   hashes: allHashes
    //   // A futuro se puede enviar un API KEY
    // }).then(function (response) {
    //   if (response.data.status == 'ok') {
    //     //Itero por los archivos que me retorno el metodo stamp de la api rest
    //     for (let k = 0; k < response.data.txHash.length; k++) {

    //       let hash = hashFile;
    //       if (!hash.startsWith('0x')) {
    //         hash = '0x' + hash; // Para iniciar el hash en formato 0x
    //       }

    //       // Parseo info obtenida
    //       if (hash == response.data.txHash[k].hash) {
    //         txResponse.block = response.data.txHash[k].block_number;
    //         txResponse.status = response.data.txHash[k].status;
    //         txResponse.timestamp = response.data.txHash[k].timestamp;

    //         // 5- SP Update DB
    //         let updatedData = {
    //           p_bfa_block_number: txResponse.block,
    //           p_bfa_block_timestamp: txResponse.timestamp,
    //           p_bfa_who_stamped: txResponse.who_stamped,
    //         }

    //         // ejecuta SP Update
    //         await this.storageRepository.updateById(savedDocument.id, updatedData);


    //       }
    //     }

    //   }
    // }

    // Retorno parcial al fron-ent ->
    // DOCUMENTO UPLOAD OK,
    // DOC SAVE DB OK,
    // DOC STAMPED PENDING

    return Promise.resolve(fileHash);
  }



  // endpoint de búsqueda por archivo
  // todos los docs del usuario usuarioID (obtenido de TOKEN)
  // A futuro permitir filtros, límites, fechas
  // LA SP hace internamente el like
  /*ALTER Procedure [dbo].[sp_bfa_documento_select](
    @p_bfa_block_number varchar(100) = 0, // Si mandamos 0, es xq queremos los que estan sin estampar, sin importar usuario
    @p_id_documento int = Null,
    @p_n_documento varchar(200) = Null,
    @p_id_usuario int = NUll, // Tomar desde el token
    @p_descripcion varchar(400) = Null
    )*/

  // @get('/buckets', {
  //   responses: {
  //     '200': {
  //       description: 'List of buckets',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //             properties: {
  //               Name: {type: 'string'},
  //               CreationDate: {type: 'string'},
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // async list(): Promise<object> {
  //   try {
  //     const buckets = await s3.listBuckets().promise()
  //     return buckets
  //   } catch (err) {
  //     throw (err)
  //   }
  // }

  // @post('/buckets', {
  //   responses: {
  //     '200': {
  //       description: 'Bucket creation response',
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //             properties: {
  //               Location: {type: 'string'},
  //               headers: {
  //                 type: 'object',
  //                 properties: {
  //                   'Content-Type': {type: 'string'},
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  // async create(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: {
  //           type: 'object',
  //           properties: {
  //             Name: {type: 'string'},
  //           },
  //         },
  //       },
  //     },
  //   })
  //   bucket: {Name: string},
  // ): Promise<object> {
  //   if (bucket.Name == undefined) {
  //     var err = new HttpErrors.BadRequest('Name not found')
  //     throw (err)
  //   }
  //   var params = {
  //     Bucket: bucket.Name
  //   }
  //   try {
  //     const bucket = await s3.createBucket(params).promise()
  //     return bucket
  //   } catch (err) {
  //     throw err
  //   }
  // }

  // @del('/buckets/{bucketName}', {
  //   responses: {
  //     '204': {
  //       description: 'Bucket DELETE success',
  //     },
  //   },
  // })
  // async deleteById(@param.path.string('bucketName') bucket: string): Promise<void> {
  //   var params = {
  //     Bucket: bucket
  //   }
  //   try {
  //     await s3.deleteBucket(params).promise()
  //     return
  //   } catch (err) {
  //     throw err
  //   }
  // }

  // @post('/buckets/{bucketName}/upload', {
  //   responses: {
  //     200: {
  //       content: {
  //         'application/json': {
  //           schema: {
  //             type: 'object',
  //           },
  //         },
  //       },
  //       description: '',
  //     },
  //   },
  // })
  // async upload(@param.path.string('bucketName') bucketName: string,
  //   @requestBody({
  //     description: 'multipart/form-data value.',
  //     required: true,
  //     content: {
  //       'multipart/form-data': {
  //         // Skip body parsing
  //         'x-parser': 'stream',
  //         schema: {type: 'object'},
  //       },
  //     },
  //   })
  //   request: Request,
  //   @inject(RestBindings.Http.RESPONSE) response: Response,
  // ): Promise<object> {
  //   return new Promise<object>((resolve, reject) => {
  //     const storage = multer.memoryStorage()
  //     const upload = multer({storage})
  //     upload.any()(request, response, async (err: any) => {
  //       if (err) reject(err)
  //       else {
  //         let res = new Array()
  //         for (const file of (request as any).files) {
  //           const params = {
  //             Bucket: bucketName,
  //             Key: file.originalname, // File name you want to save as in S3
  //             Body: bufferToStream(file.buffer)
  //           }
  //           try {
  //             const stored = await s3.upload(params).promise()
  //             res.push(stored)
  //           } catch (err) {
  //             reject(err)
  //           }
  //         }
  //         resolve(res)
  //       }
  //     })
  //   })
  // }


}
