import {authenticate, AuthenticationBindings} from '@loopback/authentication'
import {inject} from '@loopback/core'
import {repository} from '@loopback/repository'
import {get, param, post, Request, requestBody, Response, RestBindings} from '@loopback/rest'
// import {UserProfile} from 'aws-sdk/clients/opsworks'
import {UserProfile} from '@loopback/security'
import AWS from 'aws-sdk'
import crypto from 'crypto'
import multer from 'multer'
import stream from 'stream'
import {UsuarioRepository} from '../repositories'
import {MyStampHashes, StampApi} from '../services'

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
const baseURL = process.env.S3_BASEURL;

const s3 = new AWS.S3(config)
export class StorageController {

  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,

    @inject('services.StampApi')
    protected stampApiService: StampApi,

  ) { }

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
  ): Promise<Array<string>> {

    let sp = "";
    let fileHash = "";
    let fileName = "";  //request.query.name ?? "";
    let fileDescription = request.query.desc ?? " ";
    let fileLocation = "";
    let allHashes: Array<string> = [];
    let arrLocations: Array<string> = [];
    let hashesID: {key: string, value: string}[] = [];
    let today = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // TODO
    // 1- Obtener HASH
    // 2- Upload a S3
    // 3- SP insert DB
    // 4- Call endpoints nodo sellador
    // 5- Call endpoints nodo verificador
    // 6- SP Update DB


    // 2- Upload a S3
    await new Promise<object>((resolve, reject) => {
      const storage = multer.memoryStorage()
      const upload = multer({storage})

      upload.any()(request, response, async (err: any) => {
        if (err) reject(err)
        else {
          let res = new Array();
          let cant = (request as any).files.length;
          let cont = 1;
          for (const file of (request as any).files) {
            // 1 - Get HASH FILE
            fileHash = getHashFromFile(file);
            allHashes.push(fileHash)
            fileName = request.query.name ?? file.originalname;
            fileName = fileName + ((cant > 1) ? ' - ' + cont : '');
            cont++;

            const params = {
              Bucket: bucketName!,
              ACL: 'public-read',
              Key: fileHash + file.originalname.slice(-4),
              Body: bufferToStream(file.buffer)
            }

            try {
              const stored = await s3.upload(params).promise()
              res.push(stored)
              fileLocation = stored.Location;
              arrLocations.push(fileLocation);
            } catch (err) {
              reject(err)
            }

            // 3- SP insert DB
            sp = `exec dbo.sp_bfa_documento_insert
                  @p_bfa_hash = "${fileHash}",
                  @p_n_documento = "${fileName}",
                  @p_n_adjunto = "${fileLocation.slice(-69)}",
                  @p_fecha = "${today}",
                  @p_id_usuario = "${currentUser.id}",
                  @p_descripcion = "${fileDescription}"`;
            try {
              const spInsertRetVal = await this.usuarioRepository.dataSource.execute(sp);
              hashesID.push({key: fileHash, value: spInsertRetVal[0].id});
            } catch (err) {
              reject(err)
            }

          }
          resolve(res)
        }
      })
    })

    // 4 - Call endpoints nodo sellador
    let stampHashes: MyStampHashes = {
      hashes: allHashes
    }

    const txRetVal = await this.stampApiService.postStamp(stampHashes);
    console.log('hashes stampados');
    console.log(txRetVal);

    console.log('Upload S3, DB Insert & Stamp OK');

    // Retorno parcial al fron-ent ->
    const strRet = 'DOCUMENTO UPLOAD OK, DOC SAVE DB OK, DOC STAMPED OK'
    arrLocations.push(strRet);

    return Promise.resolve(arrLocations);

  }

  @authenticate("jwt")
  @get('/files/{fileName}', {
    responses: {
      200: {
        content: {
          'application/json': {
            schema: {
              string: 'fileName',
            },
          },
        },
        description: 'Search files',
      },
    },
  })
  async searchFile(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
    @param.path.string('fileName') fileName: string,
  ): Promise<any[]> {

    let arrDocuments: any[];

    // ejecución de SP
    let sp = `exec dbo.sp_bfa_documento_select
      @p_n_documento = "${fileName}",
      @p_id_usuario = "${currentUser.id}"`;

    arrDocuments = await this.usuarioRepository.dataSource.execute(sp);

    // recorre array de documentos
    for (var i = 0; i < arrDocuments.length; i++) {
      // armo url completa del documento en S3
      arrDocuments[i].n_adjunto = baseURL + arrDocuments[i].n_adjunto.slice(-69);

      // si no fue verificado en la bfa
      if (arrDocuments[i].bfa_block_number == "") {
        //Verificar doc sin blocknumer
        console.log("verifica hash: " + arrDocuments[i].bfa_hash)
        // invoca http://nodocolmed.greykoda.com:3000/verify/HASH
        const txVerify = await this.stampApiService.getVerify(arrDocuments[i].bfa_hash);

        // si se verificó correctamente
        if (txVerify.stamped) {
          arrDocuments[i].bfa_block_number = txVerify.stamps[0].blocknumber;
          // 5- SP Update DB
          sp = `exec dbo.sp_bfa_documento_update
            @p_id_documento = "${arrDocuments[i].id_documento}",
            @p_bfa_block_number = "${txVerify.stamps[0].blocknumber}",
            @p_bfa_block_timestamp = "${txVerify.stamps[0].blocktimestamp}",
            @p_bfa_who_stamped = "${txVerify.stamps[0].whostamped}"`;

          const spUpdateRetVal = await this.usuarioRepository.dataSource.execute(sp);
        }
      }
    }

    console.log('SEARCH DOCS, VERYFY & DB UPDATE OK');
    return Promise.resolve(arrDocuments);
  }

}


