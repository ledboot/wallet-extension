import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';

import { CHAIN_INFO } from '@/shared/constants';
import { Account, TxHistoryItem, TxType } from '@/shared/types';

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

  getRespData = async (res: any) => {
    let jsonRes: { id: number; error: any; result: any };

    if (!res) throw new Error('Network error, no response');
    if (res.status !== 200)
      throw new Error('Network error with status: ' + res.status);
    try {
      jsonRes = await res.json();
    } catch (e) {
      throw new Error('Network error, json parse error');
    }
    if (!jsonRes) throw new Error('Network error,no response data');
    return jsonRes;
  };

  httpPost = async (url: string, method: string, data: any) => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Basic YWRtaW46RkZoNXJM');
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
      return this.getRespData(res);
    } catch (e) {
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
      const analyzed = await this.analyzeResult(account, res.result);
      console.log('analyzed', analyzed);
      return analyzed;
    }
    return [];
  };

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
    // 处理交易输出（UTXO添加）
    for (let i = 0; i < list.length; i++) {
      const { tIn, tOut } = this.decodeMsgHex(list[i].hex);
      console.log('tIn', tIn, 'tOut', tOut);
      for (let j = 0; j < tOut.length; j++) {
        const output = tOut[j];
        if (account.addressHex == output.addressHex) {
          const previousTx = await this.getRawTransaction(
            tIn[0].previousOutPointHash
          );
          const { tOut: previousTxOut } = this.decodeMsgHex(previousTx);
          const sender = previousTxOut[0].address;
          console.log('sender', sender);
          const txItem = {
            txid: list[i].txid,
            address: sender,
            txType: TxType.RECEIVE,
            blockHeight: list[i].height,
            blockHash: list[i].blockhash,
            blockTime: list[i].blocktime,
            tokenType: output.tokenType.toString(),
            value: output.value.toString(),
            rights: output.rights,
            confirmations: 10,
          };
          txHistory.push(txItem);
        }
      }
    }

    console.log('txHistory', txHistory);

    // 构建返回的交易历史数据
    return txHistory;
  };

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

  private tokentype2Big(tokentype: any): bigint {
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
}

export default new OpenapiService();
