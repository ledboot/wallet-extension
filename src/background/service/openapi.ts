import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';

import { CHAIN_INFO, ServerConfigurationIndex } from '@/shared/constants';
import { Account, TxHistoryItem, TxType, utxoType, conamesType } from '@/shared/types';

import { addressHexToString, hexToBytes } from '../utils';
import { MsgT } from '../utils/msgTools';
import preferenceService from './preference';

export class OpenapiService {
  constructor() {}

  getEndpoint = () => {
    const chainType = preferenceService.getChainType();
    const chainInfo = CHAIN_INFO[chainType];
    return chainInfo.endpoints[0];
  };

  getRespData = async <T = any>(res: Response): Promise<{ id: number; error: any; result: T }> => {
    let jsonRes: { id: number; error: any; result: T };
    console.log('res', res);

    if (!res) throw new Error('Network error, no response');
    if (res.status !== 200)
      throw new Error('Network error with status: ' + res.status);
    try {
      // const clone = res.clone();
      jsonRes = await res.json();
      console.log('jsonRes', jsonRes);
    } catch (e) {
      console.log('getRespData JSON 解析失败: ', e, '响应内容可能不是合法 JSON');
      // 打印真实返回体（调试用）
      try {
        console.log('返回文本:', await res.clone().text());
      } catch (_) {}
      
      throw new Error('Network error, json parse error');
    }
    if (!jsonRes) throw new Error('Network error,no response data');
    return jsonRes;
  };

  httpPost = async <T = any>(url: string, method: string, data: any): Promise<{ id: number; error: any; result: T }> => {
    console.log('httpPost', url, method, data);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Basic YWRtaW46RkZoNXJM');
    // headers.append('Accept', 'application/json');
    let res: Response;
    const requestParams = {
      jsonrpc: '1.0',
      id: '1',
      method: method,
      params: data,
    };
    try {
      res = await fetch(
        new Request(url, {
          method: 'POST',
          cache: 'default',
          body: JSON.stringify(requestParams),
          headers,
        })
      );
      console.log('res', res);
      return await this.getRespData<T>(res);
    } catch (e) {
      console.error('httpPost 报错:', e);
      throw new Error('Network error, ' + e);
    }
  };

  httpGet = async <T = any>(url: string): Promise<{ id: number; error: any; result: T }> => {
    console.log('httpGet', url);
    const headers = new Headers();
    headers.append('Authorization', 'Basic YWRtaW46RkZoNXJM');
    let res: Response;
    try {
      res = await fetch(
        new Request(url, {
          method: 'GET',
          cache: 'default',
          headers,
        })
      );
      console.log('getres', res);
      return await this.getRespData<T>(res);
    } catch (e) {
      console.error('httpGet 报错:', e);
      throw new Error('Network error, ' + e);
    }
  };

  getAddressHistory = async (account: Account, start: number, limit: number) => {
    const res = await this.httpPost(this.getEndpoint(), 'schrt', [
      account.address,
      0,
      start,
      limit,
      0,
      true,
    ]);
    if (res.result && Array.isArray(res.result)) {
      console.log('res.result', res.result);
      const { txHistory, utxotype } = await this.analyzeResult(account, res.result);
      console.log('txHistory', txHistory);
      console.log('utxotype', utxotype);
      return { txHistory, utxotype };
    }
    return { txHistory: [], utxotype: [] };
  };

  update = async (account: Account, start: number, limit: number) => {
    console.log('update', account, start, limit);
    const { utxotype } = await this.getAddressHistory(account, start, limit);
    console.log('utxotype_update', utxotype);
    // const utxos = await this.insertutxo(account, analyzed);
    // console.log('utxos', utxos);
    // return utxos;
    return utxotype;
  };

  fetchTokentype = async (
    utxos: utxoType[] = [],
    chainId?: string,
    conames: conamesType[] = []
  ): Promise<{ conames: conamesType[] }> => {
    const tokenTypes = utxos.map(u => u.tokenType).filter(t => t !== undefined && t !== null && t !== '');
    console.log('tokenTypes', tokenTypes);
    const tokenTypesStr = [...new Set(tokenTypes)].join(',');
    console.log('tokenTypesStr', tokenTypesStr);
    let updated: number = 0;
    if (conames.length > 0) updated = Math.max(0, ...conames.map((c) => Number(c.updated || 0)));
    const { serverrequest, chainclass } = ServerConfigurationIndex;
    
    const url = `http://${serverrequest}/index.php?module=ncx&MOD_op=gettokendef&class=${chainclass}&tokentype=${tokenTypesStr}`+(chainId ? `&chainid=${chainId}` : '')+(updated ? `&updated=${updated}` : '');
    console.log('url', url);
    const res = await this.httpGet(url);
    console.log('gettokendefres', res);

    const newConames: conamesType[] = [];
    for (let i = 0; i < res.result.length; i++) {
      const item = res.result[i];
      const coname: conamesType = {
        name: String(item?.name ?? ''),
        chainId: item.chainId,
        tokenType: String(item?.tokenType ?? ''),
        html: String(item?.html ?? ''),
        decimalpoint: Number(item.decimalpoint),
        updated: Number(item?.updated ?? 0),
        currency: Number(item?.currency ?? 0),
      };
      newConames.push(coname);
    }

    console.log('newConames', newConames);
    
    // Save to preference store
    const updatedConames = preferenceService.updateConames(newConames);
    console.log('Updated conames in preference store', updatedConames);

    return { conames: updatedConames };
  };

  // 由 analyzeResult 的输出（交易历史项）生成 UTXO 列表
  // insertutxo = async (account: Account, list: TxHistoryItem[]) => {
  //   const utxotype: utxoType[] = [];

  //   for (let i = 0; i < list.length; i++) {
  //     const item = list[i] as any;

  //     // 如果该 txid 已在 utxotype 中存在，先删除旧的，避免重复
  //     const existingIndex = utxotype.findIndex((u) => u.txid === item.txid);
  //     if (existingIndex >= 0) {
  //       utxotype.splice(existingIndex, 1);
  //     }

  //     // const txItem: utxoType = {
  //     //   txid: item.txid,
  //     //   address: item.myaddress,
  //     //   scriptPubKey: item.pkScript,
  //     //   blockHeight: item.blockHeight,
  //     //   blockHash: item.blockHash,
  //     //   tokenType: String(item.tokenType),
  //     //   value: item.value.toString(),
  //     //   rights: item.rights || [],
  //     // };
  //     // utxotype.push(txItem);
  //   }

  //   console.log('utxotype(from analyzed)', utxotype);
  //   return utxotype;
  // };

  decodeMsgHex = (hex: string) => {
    const msgtx = new MsgT();
    msgtx.rawDecode(hex);
    const btc =
      CHAIN_INFO[preferenceService.getChainType()].chainId == 0x400002; // 假设这是比特币网络
    const txOUtLen = msgtx?.tOut.length || 0;
    const tOut: any[] = [];
    const tIn: any[] = [];
    for (let j = 0; j < txOUtLen; j++) {
      const output = msgtx?.tOut[j];
      console.log('output', output);

      // 跳过无效输出
      if (output.isSeparator()) continue;
      if (!btc && (output.tokenType & 1n) == 0n && output.value == 0n) continue;
      if (btc && output.value == 0n) continue;

      // 提取地址
      const addressHex = btc
        ? '00' + output.pkScript.substr(6, 40)
        : output.pkScript.substr(2, 40);
      const version = parseInt(output.pkScript.substr(0, 2), 16);

      // 检查跨链交易
      if (!btc && this.isCrossChain(output.pkScript)) {
        continue;
      }

      const address = addressHexToString(hexToBytes(addressHex), version);

      tOut.push({
        addressHex: addressHex,
        address: address,
        rights: output.rights,
        outPointIndex: j,
        tokenType: output.tokenType,
        value: output.value,
        pkScript: output.pkScript,
      });
    }

    const txInLen = msgtx?.tIn.length || 0;

    for (let j = 0; j < txInLen; j++) {
      const input = msgtx?.tIn[j];

      if (input.isSeparator()) continue;
      if (
        input.previousOutPoint.hash ==
        '0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        continue;
      }

      tIn.push({
        previousOutPointIndex: input.previousOutPoint.index,
        previousOutPointHash: input.previousOutPoint.hash,
        signatureIndex: input.signatureIndex,
        sequence: input.sequence,
      });
    }
    return { tIn, tOut };
  };

  analyzeResult = async (account: Account, list: any[]) => {
    // 初始化变量
    const txHistory: TxHistoryItem[] = [];
    const utxotype: utxoType[] = [];
    // 处理交易输出（UTXO添加）
    for (let i = 0; i < list.length; i++) {
      const { tIn, tOut } = this.decodeMsgHex(list[i].hex);
      console.log('tIn', tIn, 'tOut', tOut);

      for(let j = 0; j < tIn.length; j++) {
        const previousOutPointHash = tIn[j].previousOutPointHash;
        const previousOutPointIndex = tIn[j].previousOutPointIndex;
        // 从utxotype中查找并删除已消费的UTXO
        const utxoIndex = utxotype.findIndex(utxo => 
          utxo.txid === previousOutPointHash && utxo.index === previousOutPointIndex
        );
        if (utxoIndex !== -1) {
          console.log(`Removing spent UTXO: ${previousOutPointHash}:${previousOutPointIndex}`);
          utxotype.splice(utxoIndex, 1);
        }
      }
      for (let j = 0; j < tOut.length; j++) {
        const output = tOut[j];
        if (account.addressHex == output.addressHex) {
          const previousTx = await this.getRawTransaction(
            tIn[0].previousOutPointHash
          );
          const { tOut: previousTxOut } = this.decodeMsgHex(previousTx);
          console.log('previousTxOut', previousTxOut);
          const sender = previousTxOut[0].address;
          console.log('sender', sender);
          const txItemHistory = {
            txid: list[i].txid,
            index: j,
            address: sender,
            txType: TxType.RECEIVE,
            blockHeight: list[i].height,
            blockHash: list[i].blockhash,
            blockTime: list[i].blocktime,
            tokenType: output.tokenType.toString(),
            value: output.value.toString(),
            rights: output.rights,
            confirmations: 10,
            pkScript: output.pkScript,
            myaddress: account.address,
          };
          const txItemUtxo: utxoType = {
            txid: list[i].txid,
            index: j,
            address: account.address,
            scriptPubKey: output.pkScript,
            blockHeight: list[i].blockHeight,
            blockHash: list[i].blockHash,
            tokenType: output.tokenType.toString(),
            value: output.value.toString(),
            rights: output.rights || [],
          };
          txHistory.push(txItemHistory);
          utxotype.push(txItemUtxo);
        }
      }
    }
    // 构建返回的交易历史数据
    return {txHistory, utxotype};
  };

  // insertutxo = async (account: Account, list: any[]) => {
  //   // 初始化变量
  //   const utxotype: utxoType[] = [];
  //   // 处理交易输出（UTXO添加）
  //   for (let i = 0; i < list.length; i++) {
  //     const { tIn, tOut } = this.decodeMsgHex(list[i].hex);
  //     const txid = list[i].txid;
  //     console.log('insertutxo：tIn', tIn, 'tOut', tOut);
      
  //     // 先移除已存在的相同txid的UTXO
  //     const existingIndex = utxotype.findIndex(utxo => utxo.txid === txid);
  //     if (existingIndex >= 0) {
  //       utxotype.splice(existingIndex, 1);
  //     }

  //     for (let j = 0; j < tOut.length; j++) {
  //       const output = tOut[j];
  //       if (account.addressHex == output.addressHex) {
  //         const txItem: utxoType = {
  //           txid: txid,
  //           address: output.address,
  //           scriptPubKey: output.pkScript,
  //           chainId: list[i].chainId,
  //           blockHeight: list[i].height,
  //           blockHash: list[i].blockhash,
  //           tokenType: output.tokenType.toString(),
  //           value: output.value.toString(),
  //           rights: output.rights || [],
  //         };
  //         utxotype.push(txItem);
  //       }
  //     }
  //   }

  //   console.log('utxotype', utxotype);
  //   return utxotype;
  // };

  private isOurAddress(
    addrhex: string,
    targetAddress: string,
    pkScript: string,
    btc: boolean
  ): boolean {
    // 检查地址是否匹配
    if (addrhex === targetAddress) return true;

    // 处理P2PKH地址
    if (
      btc &&
      pkScript.substr(0, 4) == '5121' &&
      (pkScript.substr(4, 2) == '02' || pkScript.substr(4, 2) == '03') &&
      pkScript.substr(-4) == '52ae'
    ) {
      // 这里需要实现公钥到地址的转换
      const pk = pkScript.substr(4, 66);
      addrhex = '00' + nobleRipemd160(nobleSha256(hexToBytes(pk)));
      return addrhex === targetAddress;
    }

    return false;
  }

  private isCrossChain(pkScript: string): boolean {
    // 检查是否是跨链交易
    return (
      (pkScript.substr(0, 2) != '88' && pkScript.substr(42, 2) == '66') ||
      (pkScript.substr(0, 2) != '88' && pkScript.substr(42, 2) == '45')
    );
  }

  public static tokentype2Big(tokentype: any): bigint {
    // 转换token类型为BigInt
    if (typeof tokentype === 'string') {
      return BigInt('0x' + tokentype);
    }
    return BigInt(tokentype || 0);
  }

  getRawTransaction = async (txid: string) => {
    const res = await this.httpPost(this.getEndpoint(), 'getrawtransaction', [
      txid,
      0,
      true,
      false,
    ]);
    if (res.result) {
      return res.result;
    }
    return null;
  };

  getTxOut = async (txid: string, vout: number) => {
    const res = await this.httpPost(this.getEndpoint(), 'gettxout', [
      txid,
      vout,
      false,
    ]);
    return res;
  };

  gto = async (txid: string, index: number, locked?: boolean) => {
    const res = await this.httpPost(this.getEndpoint(), 'gettxout', [
      txid,
      index,
      false,
      locked ? true : false,
    ]);
    return res;
  };

  getxchtxfee = async (target: number) => {
    const res = await this.httpPost(this.getEndpoint(), 'getxchtxfee', [
      target,
    ]);
    return res;
  };

  gbc = async () => {
    const res = await this.httpPost(this.getEndpoint(), 'gbc', []);
    return res;
  };
}

export default new OpenapiService();
