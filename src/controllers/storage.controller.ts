import {inject} from '@loopback/core'
import {post, Request, requestBody, Response, RestBindings} from '@loopback/rest'
import AWS from 'aws-sdk'
import multer from 'multer'
import stream from 'stream'

const {Duplex} = stream

function bufferToStream(buffer: any) {
  const duplexStream = new Duplex()
  duplexStream.push(buffer)
  duplexStream.push(null)
  return duplexStream
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

  constructor() {
  }

  // file upload to S3
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
  ): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      const storage = multer.memoryStorage()
      const upload = multer({storage})

      upload.any()(request, response, async (err: any) => {
        if (err) reject(err)
        else {
          let res = new Array()
          for (const file of (request as any).files) {
            const params = {
              Bucket: bucketName!,
              ACL: 'public-read',
              Key: file.originalname, // File name you want to save as in S3
              Body: bufferToStream(file.buffer)
            }
            try {
              const stored = await s3.upload(params).promise()
              console.log(stored);
              res.push(stored)

            } catch (err) {
              reject(err)
            }
          }
          resolve(res)
        }
      })
    })

  }

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
