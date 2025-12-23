import Address from './address';
import { bytesToHex, hexToBytes } from "./index";
import { TinDef, ToutDef } from "./defs";
import { keyringService } from "@background/service";
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';
import { signAsync } from "@noble/secp256k1";
import { getPublicKey } from "@noble/secp256k1";
import { Packer } from "./packer";
import { MsgT } from "./msgTools";

export interface ConditionType {
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

export function buildTx(tokenType: bigint, amount: bigint, receivedPks: string, senderAddress: string, checkutxo: boolean, notxfee: boolean, merge: boolean, crosschain: number) {
  var condition: ConditionType = {
    level: 0,
    bytype: tokenType,
    order: 'amount asc',
    locked: 0,
    skip: 0,
    total: 100,
    nocontract: true,
  };
  if (senderAddress) condition.sendAddress = senderAddress;
  var tx = new MsgT();
  var fees = 1200 + (receivedPks ? receivedPks.length : 0);
  const xch = { result: { Fees: [] } };
  const rights = null;
  var txout: any[] = [];
  var txin: any[] = [];

  if (receivedPks) {
    if ((tokenType & 2n) == 2n && rights) {
      txout.push({ tokenType: tokenType, value: amount, pkScript: receivedPks, Righrts: rights });
    } else txout.push({ tokenType: tokenType, value: amount, pkScript: receivedPks });
  }

  const r = gatherCoins(condition, amount, fees, rights, notxfee, checkutxo, crosschain);
  // if(r === null) return false;
  const sum = r.sum;
  const inaddress = r.inaddress;
  const minTxfee = r.minTxfee;
  if (tokenType !== 0n) r.minTxfee = 0n;
  txin = txin.concat(r.txin);
  fees = r.fees;
  let adb: number[] = [];
  if (inaddress && inaddress.length > 0) {
    adb = Array.from(Address.decodeString(inaddress[0]));
    const op = adb[0] === 0 || adb[0] === 0x6f ? 0x41 : adb[0] === 0x78 ? 0x43 : 0x42;
    adb = adb.concat([op, 0, 0, 0]);
  }

  if (adb.length > 0) {
    if (amount != sum) {
      if ((tokenType & 2n) == 2n && rights) {
        txout.push({ tokenType: tokenType, value: sum - amount - 5000n, pkScript: bytesToHex(adb), Rights: rights });
      } else {
        const ret = sum - amount - (tokenType == 0n && !notxfee ? r.minTxfee : 0n);
        if (ret != 0n && (tokenType != 0n || ret > 200n)) txout.push({ tokenType: tokenType, value: ret, pkScript: bytesToHex(adb) });
      }
    }
  }

  let signatureIndex = 0;
  const addresses: any[] = [];

  for (let i = 0; i < txin.length; i++) {
    const indef = new TinDef();
    indef.previousOutPoint = txin[i].previousOutPoint;
    const sid = addresses.findIndex((a) => a === txin[i].address);
    if (sid >= 0) indef.signatureIndex = sid;
    else {
      indef.signatureIndex = signatureIndex;
      signatureIndex++;
      addresses.push(txin[i].address);
    }
    indef.sequence = -1;
    tx.tIn.push(indef);
  }

  for (let i = 0; i < txout.length; i++) {
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


function gatherCoins(condition: ConditionType, amount: bigint, fees: number, rights: any, notxfee: boolean, checkutxo: boolean, crosschain: number) {
  let sum = 0n;
  const txin: any[] = [];
  const inaddress: string[] = [];
  let minTxfee = notxfee ? 0n : 1000n;
  const tokenType = condition.bytype;
  const inclfee = !notxfee && tokenType == 0n;
  let more = true;
  let skip = 0;
  const difff = false;
  let assets: any[] = [];

  const min = amount / 900n, max = 0n;
  condition.min = min;
  condition.max = 0n;

  // while (sum - minTxfee < amount && more){
  // if(assets != null && assets.length  == 0){

  // }
  condition.skip = skip;
  assets = keyringService.getUtxosByAddress(condition.sendAddress || '');
  skip += assets.length;
  more = (assets.length > 0) || (min > 0n);

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];

    if (txin.findIndex((a) => a.previousOutPoint.hash === asset.txid && a.previousOutPoint.index === asset.opindex) >= 0) continue;
    txin.push({
      previousOutPoint: {
        hash: asset.txid,
        index: asset.index,
      },
      address: asset.address,
    });

    sum += BigInt(asset.value);
    fees += 356;

    if (inaddress.findIndex((a) => a === asset.address) < 0) {
      inaddress.push(asset.address);
      fees += 240
    }

    if (inclfee) minTxfee = BigInt(Math.max(fees, 1000));

    if (sum - minTxfee >= amount) break;
  }
  return { sum: sum, txin: txin, inaddress: inaddress, minTxfee: minTxfee, fees: inclfee ? 0 : fees };
}


export async function signTransaction(tx: MsgT, mode: number, password: string) {

  const allUtxos = keyringService.getUtxos();
  for (let i = 0; i < tx.tIn.length; i++) {

    const utxo = allUtxos.find(u =>
      u.txid === tx.tIn[i].previousOutPoint.hash &&
      u.index === tx.tIn[i].previousOutPoint.index  // 或者可能是 u.index 或 u.n，取决于 UTXO 结构
    );
    if (!utxo) continue;
    const scriptPubKey = utxo.scriptPubKey;
    const address = utxo.address;

    const pks = scriptPubKey.substring(0, 42);



    const privateKey = keyringService.exportPrivateKeyHex(address);


    const msgh = hexToBytes(tx.tIn[i].previousOutPoint.hash);
    const msg = tx.encode(0);
    const h = nobleSha256(msg);

    const hash = genSigHash(tx, mode, i);


    const sig = await signAsync(hash, privateKey, { extraEntropy: true });

    const sigBytes = sig.toBytes();
    const sigBytesDER = rawToDer(sigBytes);
    const sighex = bytesToHex(sigBytesDER);

    const pubKey = getPublicKey(privateKey);
    const pubKeyHex = bytesToHex(pubKey);

    const sigIndex = tx.tIn[i].signatureIndex;

    tx.signatureScripts[sigIndex] = '56' + bytesToHex([(pubKeyHex.length >> 1) + 1, pubKeyHex.length >> 1]) + pubKeyHex + '56' + bytesToHex([sigBytesDER.length + 1, sigBytesDER.length]) + sighex + '4a' + bytesToHex([mode])
  }

  return tx;
}

function genSigHash(tx: any, mode: number, index: number) {
  const t = new MsgT();
  const hex = bytesToHex(Array.from(tx.encode(1)));
  t.rawDecode(hex);
  t.txDef = [];
  let text = t.encode(0);
  const w = new Packer();
  w.PackV(text.length);
  const bytes = new Uint8Array([...w.Bytes(), ...text]);
  return nobleSha256(nobleSha256(bytes));

}

function rawToDer(raw: any) {
  const r = raw.slice(0, 32);
  const s = raw.slice(32, 64);
  function trim(buf: any) {
    let i = 0;
    while (i < buf.length - 1 && buf[i] === 0) i++;
    let out = buf.slice(i);
    if (out[0] & 0x80) {
      return Uint8Array.from([0, ...out]);
    }
    return out;
  }
  const R = trim(r);
  const S = trim(s);
  const der = [];
  der.push(0x30);
  der.push(4 + R.length + S.length);
  der.push(0x02);
  der.push(R.length);
  der.push(...R);
  der.push(0x02);
  der.push(S.length);
  der.push(...S);
  return der;
}