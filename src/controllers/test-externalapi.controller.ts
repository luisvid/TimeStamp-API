// Uncomment these imports to begin using these cool features!

import {inject} from '@loopback/core';
import {get, param} from '@loopback/rest';
import {MyLoginInterface, MyStampHashes, StampApi} from '../services';

export class TestExternalApiController {
  constructor(
    @inject('services.StampApi')
    protected stampApiService: StampApi,
  ) { }


  @get('/qrstatus/{qr_id}')
  async getQrStatus(
    @param.path.string('qr_id') qr_id: string,
  ): Promise<object> {
    //Preconditions
    let hashesx: Array<string> = [];
    hashesx.push("42199ef61fa2c9c550a93b896e7af84b0c67ff6168c33ac1088e7c379e721f7e");
    hashesx.push("7d5a862de1db597473e591a6c7f1819cee2a22a1445364f670376f5f7b401fa6");
    // {"hashes": ["c70da7f172964056f1cc70e454d0bd624ecd9e25f49bb0d0169bec3e76d4e156","c70da7f172964056f1cc70e454d0bd624ecd9e25f49bb0d0169bec3e76d4e156"]}

    let logstr: MyLoginInterface = {
      email: "pedro@mail.com",
      password: "pedro1234"
    }

    let stampHashes: MyStampHashes = {
      hashes: hashesx
    }

    console.log(logstr);
    console.log(stampHashes);

    const retval = await this.stampApiService.loginx(logstr);
    console.log(retval);

    const retval2 = await this.stampApiService.postStamp(stampHashes);
    console.log(retval2);

    console.log(retval2.status == 'ok');

    for (let k = 0; k < retval2.txHash.length; k++) {
      console.log(retval2.txHash[k].status);

    }

    // for (let i = 0; i < hashesx.length; i++) {

    //   let comph = "0x" + hashesx[i];
    //   console.log(retval2.txHash.find((e: {hash: string;}) => e.hash === comph));
    //   // console.log(retval2.txHash.includes(comph));

    // }

    return this.stampApiService.getQrStatus(qr_id);
  }

}
