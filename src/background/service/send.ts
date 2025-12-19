// import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';

// import { CHAIN_INFO, ServerConfiguration } from '@/shared/constants';
// import { Account, TxHistoryItem, TxType, Utxo, CoinNames } from '@/shared/types';

// import { addressHexToString, hexToBytes } from '../utils';
// import preferenceService from './preference';


// import bigInt from 'big-integer';
// import ecdsa, {
//   CurveFp,
//   FieldElementFp,
//   fromHex,
//   getSECCurveByName,
//   integerToBytes,
//   PointFp,
//   secNamedCurves,
//   X9Parameters,
// } from './ecdsa.js';
// import { getBigRandom } from './getBigRandom.js';
// import { hmac } from '@noble/hashes/hmac';
// import { sha256 as sha256 } from '@noble/hashes/sha2';
// import { concatBytes } from '@noble/hashes/utils';

// const hashes: any = (globalThis as any).hashes || {};
// hashes.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => 
//   hmac(sha256, key, concatBytes(...messages));
// (globalThis as any).hashes = hashes;




import preferenceService from '../service/preference';
import Address from '../utils/address';
import { bytesToHex, bytesToHex2 } from "../utils";
import openapiService from "../service/openapi";
import { MsgT } from "../utils/msgTools";
import { TinDef, ToutDef } from '../utils/defs';
import { getSECCurveByName } from '@/shared/ecdsa.js';
// import BigInteger from '@background/utils/biginteger';
import { BigInteger } from '../utils/biginteger';
import { getBigRandom } from '@/shared/getBigRandom.js';
import { serialize } from 'v8';
import bs58check from 'bs58check';
import { Packer } from '../utils/packer';
import SHA256 from 'crypto-js/sha256';
import CryptoJS, { mode } from 'crypto-js';
// export { ECKeyImpl };
import { ECKeyImpl, SimpleKeyring } from './keyring/simpleKeyring';
import { KEYRING_TYPE } from '@/shared/constants';
// import { keyringService } from '.';
import keyring from './keyring';
import { getPublicKey, utils as secpUtils, sign, Signature, etc, signAsync} from '@noble/secp256k1';
import {hexToBytes} from '@noble/hashes/utils';
import keyringService from '../service/keyring';

interface ConditionType {
      level: number;
      bytype: bigint;
      order: string;
      locked: number;
      skip: number;
      total: number;
      nocontract: boolean;
      min?: bigint;
      max?: bigint;
      sendAddress?: string;
    }
export class SendService {

  send = async ( amount: bigint, tokenType: bigint, receivedAddress: string, password: string, senderAddress: string, crosschain: number, timeLimit: number) => {

    const messageHash = "your_message_hash_here"; // 替换为实际的消息哈希
    const privateKey = "your_private_key_here";   // 替换为实际的私钥
    
    // try {
    //     // 调用 sign 方法
        // const signature = ECDSA.sign(messageHash, privateKey);
    //     console.log("Signature:", signature);
        
    //     // 验证签名
    //     // const isValid = ECDSA.verify(messageHash, signature, publicKey); // 需要提供公钥
    //     // console.log("Signature is valid:", isValid);
        
    //     // 继续处理您的交易逻辑...
    //     var adb = Array.from(Address.decodeString(receivedAddress));
    //     // ... 其余代码 ...
    // } catch (error) {
    //     console.error("Signing error:", error);
    //     throw error;
    // }
    // const sign = ECDSA.sign(1,2);

    var adb = Array.from(Address.decodeString(receivedAddress));
    const op = adb[0] === 0 || adb[0] === 0x6f ? 0x41 : adb[0] === 0x78 ? 0x43 : 0x42;
    adb = adb.concat([op, 0, 0, 0]);
    const pks = bytesToHex(adb);
    const merge = (receivedAddress === senderAddress);

    let tx = await this.build(tokenType, amount, pks, senderAddress, false, false, merge, crosschain);

    if(timeLimit){
      const height = await openapiService.gbc();
      if(!height || height.error) tx.version = 0x11;
      else {
        tx.version = 0x41;
        tx.lockTime = height.result + timeLimit;
      }
    }

    const r = await this.signTransaction(tx, 1, password);
    const raw = r.encode(1)
    // const rawTx = bytesToHex2(raw)
    const rawTx = bytesToHex(raw)
    console.log('rawTx', rawTx);
    // const hextx = await openapiService.srt(r, 0);
    // console.log('hextx', hextx);

    // hextx.expire = tx.lockTime;

    return rawTx;
  }

  
  build = async (tokenType: bigint, amount: bigint, receivedPks: string, senderAddress: string, checkutxo: boolean, notxfee: boolean, merge: boolean, crosschain: number) => {
    
    var condition: ConditionType = {
      level: 0,
      bytype: tokenType,
      order: 'amount asc',
      locked: 0,
      skip: 0,
      total: 100,
      nocontract: true,
    };
    if(senderAddress) condition.sendAddress = senderAddress;
    // interface TxinType {
    //   previousOutPoint: {
    //     hash: string;
    //     index: number;
    //   };
    //   signatureIndex: number;
    //   sequence: number;
    //   model: any;
    // }
    // interface TxoutType {
    //   tokenType: number;
    //   value: number;
    //   rights?: any;
    //   pkScript: string;
    //   model: any;
    // }

    
    var tx = new MsgT();
    var fees = 1200 + (receivedPks?receivedPks.length : 0);
    const xch = {result: {Fees: []}};
    const rights = null;
    var txout: any[] = [];
    var txin: any[] = [];

    if(receivedPks) {
      if((tokenType & 2n) == 2n && rights) {
        txout.push({tokenType: tokenType, value: amount, pkScript: receivedPks, Righrts: rights});
      }else txout.push({tokenType: tokenType, value: amount, pkScript: receivedPks});
    }

    const r = await this.gatherCoins(condition, amount, fees, rights, notxfee, checkutxo, crosschain);
    // if(r === null) return false;
    const sum = r.sum;
    const inaddress = r.inaddress;
    const minTxfee = r.minTxfee;
    if(tokenType !== 0n) r.minTxfee = 0n;
    txin = txin.concat(r.txin);
    fees = r.fees;
    let adb: number[] = [];
    if (inaddress && inaddress.length > 0) {
      adb = Array.from(Address.decodeString(inaddress[0]));
      const op = adb[0] === 0 || adb[0] === 0x6f ? 0x41 : adb[0] === 0x78 ? 0x43 : 0x42;
      adb = adb.concat([op, 0, 0, 0]);
    }

    if(adb.length>0){
      if(amount != sum){
        if((tokenType & 2n) == 2n && rights) {
          txout.push({tokenType: tokenType, value: sum - amount - 5000n, pkScript: bytesToHex(adb), Rights: rights});
        }else {
          const ret = sum - amount - (tokenType == 0n && !notxfee?r.minTxfee:0n);
          if(ret !=0n && (tokenType != 0n || ret > 200n)) txout.push({tokenType: tokenType, value: ret, pkScript: bytesToHex(adb)});
        }
      }
    }

    let signatureIndex = 0;
    const addresses : any[] = [];

    for(let i = 0; i < txin.length; i++) {
      const indef = new TinDef();
      indef.previousOutPoint = txin[i].previousOutPoint;
      const sid = addresses.findIndex((a) => a === txin[i].address);
      if(sid >= 0) indef.signatureIndex = sid;
      else {
        indef.signatureIndex = signatureIndex;
        signatureIndex++;
        addresses.push(txin[i].address);
      }
      indef.sequence = -1;
      tx.tIn.push(indef);
    }
    
    for(let i = 0; i < txout.length; i++) {
      const outdef = new ToutDef();
      outdef.tokenType = txout[i].tokenType;
      outdef.value = txout[i].value;
      outdef.pkScript = txout[i].pkScript;
      // if((outdef.tokenType & 2n) != 0n){
      //   outdef.Rights = txout[i].Rights;
      // }
      tx.tOut.push(outdef);
    }
    
    return tx;
  }

  gatherCoins = async (condition: ConditionType, amount: bigint, fees: number, rights: any, notxfee: boolean, checkutxo: boolean, crosschain: number) => {
    let sum = 0n;
    const txin: any[] = [];
    const inaddress : string[] = [];
    let minTxfee = notxfee?0n : 1000n;
    const tokenType = condition.bytype;
    const inclfee = !notxfee && tokenType == 0n;
    let more = true;
    let skip = 0;
    const difff = false;
    let assets : any[] = [];

    const min = amount / 900n , max = 0n;
    condition.min = min;
    condition.max = 0n;

    // while (sum - minTxfee < amount && more){
      // if(assets != null && assets.length  == 0){
        
      // }
      condition.skip = skip;
      assets = await this.assets(condition);
      skip += assets.length;
      more = (assets.length > 0) || (min > 0n);

      for(let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        if(txin.findIndex((a) => a.previousOutPoint.hash === asset.txid && a.previousOutPoint.index === asset.opindex) >= 0) continue;
        txin.push({
          previousOutPoint: {
          hash: asset.txid,
          index: asset.index,
          },
          address: asset.address,
        });

        sum += BigInt(asset.value);
        fees += 356;
        
        if(inaddress.findIndex((a) => a === asset.address) < 0) {
          inaddress.push(asset.address);
          fees += 240
        }

        if(inclfee) minTxfee = BigInt(Math.max(fees, 1000));

        if(sum - minTxfee >= amount) break;
      }
    // }
    return {sum: sum, txin: txin, inaddress: inaddress, minTxfee: minTxfee, fees: inclfee ? 0 : fees};
  }

  signTransaction = async (tx: MsgT, mode: number, password: string) => {

    const allUtxos = await keyringService.getUtxos();
    for(let i=0; i<tx.tIn.length; i++){

      const utxo = allUtxos.find(u => 
            u.txid === tx.tIn[i].previousOutPoint.hash && 
            u.index === tx.tIn[i].previousOutPoint.index  // 或者可能是 u.index 或 u.n，取决于 UTXO 结构
      );
      if(!utxo) continue;
      const scriptPubKey = utxo.scriptPubKey;
      const address = utxo.address;

      const pks = scriptPubKey.substring(0,42);



    //   const accounts = await keyringService.getAccounts();
    //   const accountExists = accounts.some(acc => acc.address === address);
    //   if (!accountExists) {
    //     console.error('Address not found in keyring:', address);
    //     console.log('Available accounts:', accounts);
    //     throw new Error('Address not found in keyring');
    // }
      const privateKey = keyringService.exportPrivateKeyHex(address);
      console.log("-----",privateKey);

      // let msgh = await etc.hexToBytes(tx.tIn[i].previousOutPoint.hash);
      // msgh = new Uint8Array(msgh);

      const msgh = hexToBytes(tx.tIn[i].previousOutPoint.hash);
      // const p = hexToBytes(privateKey);

      // const p = keyringService.exportPrivateKey(address);
      // console.log("-----",p);
      // const h = nobleSha256(tx.tIn[i].previousOutPoint.hash)

      const sig = await signAsync(tx.tIn[i].previousOutPoint.hash, privateKey,{extraEntropy:true});
      
      const sigBytes = sig.toBytes();
      const sigBytesDER = this.rawToDer(sigBytes);
      const sighex = bytesToHex(sigBytesDER);
      console.log("-----",sighex);
      
      const pubKey = getPublicKey(privateKey);
      const pubKeyHex = bytesToHex(pubKey);
      console.log("-----",pubKeyHex);

      // const hex = eckey.toHex();
      // console.log("-----",hex);


      // const sigHash = await this.genSigHash(tx, 1, i);

      const sigIndex = tx.tIn[i].signatureIndex;

      tx.signatureScripts[sigIndex] = '56' + bytesToHex([(pubKeyHex.length >> 1) + 1, pubKeyHex.length >> 1 ]) + pubKeyHex + '56' + bytesToHex([sigBytesDER.length  + 1, sigBytesDER.length ]) + sighex + '4a' + bytesToHex([mode])
    }
    
    return tx;
  }

  assets = async (condition: ConditionType) => {
    const allUtxos = await keyringService.getUtxos();
    let assets = allUtxos.filter(utxo => utxo.address === condition.sendAddress);
    assets.sort((a, b) => {
      // 将值转换为BigInt进行比较
      const valueA = BigInt(a.value);
      const valueB = BigInt(b.value);
      
      // 按值降序排序（从大到小）
      if (valueA > valueB) return -1;
      if (valueA < valueB) return 1;
      return 0;
    });
    return assets;
  }

  // sign = async (hex: [], privateKey:[]) => {
  //   const d = privateKey;
  //   const secp256k1 = getSECCurveByName('secp256k1');
  //   const n = secp256k1.getN();
  //   const e = BigInteger.fromByteArrayUnsigned(hex);
  //   const k = getBigRandom(n);
  //   let r;
    
  //   do {
  //     const G = secp256k1.getG();
  //     const Q = G.multiply(k);
  //     r =  Q.getX().toBigInteger().mod(n);
  //   }while(r.compareTo(BigInteger.ZERO) <= 0);

  //   const s = k.modInv(n).multiply(e.add(d.multiply(r))).mod(n);

  //   const rBytes = (r as any).toByteArraySigned();
  //   const sBytes =  (s as any).toByteArraySigned();
  
  //   let sequence = [];
  //   sequence.push(0x02);
  //   sequence.push(rBytes.length);
  //   sequence = sequence.concat(rBytes);

  //   sequence.push(0x02);
  //   sequence.push(sBytes.length);
  //   sequence = sequence.concat(sBytes);

  //   sequence.unshift(sequence.length);
  //   sequence.unshift(0x30);

  //   return sequence

  // }

  genSigHash = async (tx: any, mode: number, index: number) => {
    const t = new MsgT();
    // const hex = bytesToHex(t.encode(1));
    const hex = bytesToHex(Array.from(t.encode(1))); 
    t.rawDecode(hex);
    t.txDef = [];
    let text = t.encode(0);
    const w = new Packer();
    w.PackV(text.length);
    // text = new Uint8Array([...w.Bytes(), ...text]);
    const bytes = new Uint8Array([...w.Bytes(), ...text]);
    // 将 Uint8Array 转换为 WordArray
    const wordArray = CryptoJS.lib.WordArray.create(Array.from(bytes));
    // 第一次哈希
    const firstHash = CryptoJS.SHA256(wordArray, {asBytes: true});
    return CryptoJS.SHA256(firstHash, {asBytes: true});
  }

  toDER(r: bigint, s: bigint): Uint8Array {
    function toBytes(num: bigint): Uint8Array {
    let hex = num.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const arr = Uint8Array.from(hex);
    // 如果最高位 >= 0x80，需要补一个 0x00
    if (arr[0] & 0x80) {
      const padded = new Uint8Array(arr.length + 1);
      padded[0] = 0x00;
      padded.set(arr, 1);
      return padded;
    }
    return arr;
  }

  const rBytes = toBytes(r);
  const sBytes = toBytes(s);

  const totalLen = 2 + rBytes.length + 2 + sBytes.length;
  const der = new Uint8Array(2 + totalLen);

  der[0] = 0x30;          // sequence tag
  der[1] = totalLen;      // length
  der[2] = 0x02;          // integer tag
  der[3] = rBytes.length; // r length
  der.set(rBytes, 4);

  let offset = 4 + rBytes.length;
  der[offset] = 0x02;                  // integer tag
  der[offset + 1] = sBytes.length;     // s length
  der.set(sBytes, offset + 2);

  return der;
}

// toDER1(rawSig: any): any {
//   let r = rawSig.slice(0, 32);
//   let s = rawSig.slice(32,64);

//    r = this.stripLeadingZeros(r);
//    s = this.stripLeadingZeros(s);

//    if(r[0] & 0x80){
//     r = concat(new Uint8Array([0x00]), r);
//    }
//    if(s[0] & 0x80){
//     s = concat(new Uint8Array([0x00]), s);
//    }

//    der = concat(
//     new Uint8Array([0x30]),
//     new Uint8Array([2 + r.length + 2 + s.length]),
//     new Uint8Array([0x02],r.length),
//     r,
//     new Uint8Array([0x02],s.length),
//     s
//    );
//    return der;
// }

// stripLeadingZeros(arr: []): any {
//   let i = 0;
//   while(i < arr.length - 1 && arr[i] === 0) i++;
//   return arr.slice(i);
// }

// concat(...args: []): any {
//   const total = args.reduce((sum, a) => sum + a.length, 0);
//   const out = new Uint8Array(total);
//   let offset = 0;
//   for (const a of args) {
//     out.set(a, offset);
//     offset += a.length;
//   }
//   return out;
// }

rawToDer(raw: any) {  
  const r = raw.slice(0, 32);   
  const s = raw.slice(32, 64);    
  function trim(buf: any) {     
    let i = 0;     
    while (i < buf.length - 1 && buf[i] === 0) i++;     
    let out = buf.slice(i);     
    if (out[0] & 0x80) {       
      // prepend zero to avoid negative sign       
      return Uint8Array.from([0, ...out]); 
      // 
    }     
    return out;   
  }    
    const R = trim(r);   
    const S = trim(s);    
    // const der = new Uint8Array(6 + R.length + S.length);   
    const der = [];   
    der.push(0x30);
    der.push(4 + R.length + S.length);
    der.push(0x02);
    der.push(R.length);
    der.push(...R);
    der.push(0x02);
    der.push(S.length);
    der.push(...S);
    // let offset = 0;   
    //  der[offset++] = 0x30;   
    //  der[offset++] = 4 + R.length + S.length;   
    //  der[offset++] = 0x02;   
    //  der[offset++] = R.length;   
    //  der.set(R, offset);   
    //  offset += R.length;   
    //  der[offset++] = 0x02;   
    //  der[offset++] = S.length;   
    //  der.set(S, offset);    
     return der; 
  }
}
export default new SendService();
