import { MsgT } from '../utils/msgTools';
import { hexToBytes } from '../utils';
import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';
import { Account } from '@/shared/types';


export class OpenapiService {
  endpoint = 'http://omegasuite.org:8789';
  constructor() {}

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

  httpPost = async (url: string,method: string, data: any) => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Basic YWRtaW46RkZoNXJM');
    let res: Response;
    const requestParams ={
      jsonrpc: "1.0",
      id: "1",
      method: method,
      params: data
    }
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

  getAddressHistory = async (params: { account: Account; start: number; limit: number }) => {
    const res = await this.httpPost(this.endpoint,'schrt', [params.account.address,0,params.start,params.limit,0,true]);
    console.log('getAddressHistory res', res);
    if (res.result && Array.isArray(res.result)) {
      return await this.analyzeResult(params.account, res.result);
    }
    return [];
  };

  private async analyzeResult(account: Account, list: any[]) {
    // 初始化变量
    const spends: any[] = [];
    const adds: any[] = [];
    let hasitems = false;
    const summary: any[] = [];
    let restrict = 1;
    let rsum = 0;
    const btc = false; // 假设这是比特币网络

    // 初始化摘要数组
    for (let i = 0; i < list.length; i++) {
      summary.push({ TIn: [], TOut: [] });
    }

    console.log('list length', list.length);

    // 处理交易输出（UTXO添加）
    for (let i = 0; i < list.length; i++) {
      hasitems = true;

      // 限制处理数量以避免性能问题
      if (rsum >= 10000) {
        list.length = restrict;
        console.log('batch trim = ' + restrict);
        break;
      }
      restrict++;

      // 解析交易数据
      let msgtx;
      if (btc){
        // msgtx = this.parseTransaction(list[i].hex, btc);
      }else{
        msgtx = new MsgT();
        console.log('list[i].hex', list[i].hex);
        msgtx.rawDecode(list[i].hex);
      }
      rsum += msgtx?.tIn.length || 0;

      const txLen = msgtx?.tOut.length || 0;

      // 处理交易输出
      for (let j = 0; j < txLen; j++) {
        const output = msgtx?.tOut[j];
        
        // 跳过无效输出
        if (output.isSeparator()) continue;
        if ((!btc && ( output.tokenType & 1n) == 0n) && output.value == 0n) continue;
        if (btc && output.value == 0n) continue;

        // 提取地址
        const addrhex = btc ?"00" + output.pkScript.substr(6, 40): output.pkScript.substr(0, 42);

        console.log('addrhex---', addrhex, account.address, output.pkScript, btc);

        // 检查是否是我们的地址
        if (!this.isOurAddress(addrhex, account.addressHex, output.pkScript, btc)) {
          continue;
        }

        console.log('output', output);

        // 检查跨链交易
        if (!btc && this.isCrossChain(output.pkScript)) {
          continue;
        }

        const outpoint = { Hash: list[i].txid, Index: j };

        console.log('outpoint', outpoint);

        // 避免重复添加
        if (adds.findIndex(n => n.outpoint.Hash == outpoint.Hash && n.outpoint.Index == outpoint.Index) >= 0) {
          continue;
        }

        adds.push({
          outpoint: outpoint,
          utxo: btc ? { tokentype: 0n, pkScript: addrhex, value: output.value } : output,
          height: list[i].height
        });
        console.log('adds', adds);

        summary[i].tOut.push({
          tokentype: btc ? 0n : output.tokenType,
          value: output.value
        });
      }
    }

    // 处理交易输入（UTXO消费）
    for (let i = 0; i < list.length; i++) {
      let msgtx;
      if (btc){
        // msgtx = new MsgT();
        // msgtx.rawDecode(list[i].hex);
      }else{
        msgtx = new MsgT();
        msgtx.rawDecode(list[i].hex);
      }

      const txLen = msgtx?.tIn.length || 0;

      for (let j = 0; j < txLen; j++) {
        const input = msgtx?.tIn[j];
        
        if (input.isSeparator()) continue;
        if (input.previousOutPoint.hash == "0000000000000000000000000000000000000000000000000000000000000000") {
          continue;
        }

        // 检查UTXO是否已被消费
        const k = adds.findIndex((n) => 
          n.outpoint.hash == input.previousOutPoint.hash && 
          n.outpoint.index == input.previousOutPoint.index
        );

        // 处理输入摘要
        if (k >= 0) {
          const ton = btc ? 0n : this.tokentype2Big(adds[k].utxo.tokentype);
          summary[i].TIn.push({
            tokentype: btc ? 0n : ton,
            Value: adds[k].utxo.Value
          });
        }

        // 从添加列表中移除已消费的UTXO
        if (k >= 0) adds.splice(k, 1);
        spends.push(input.PreviousOutPoint);
        hasitems = true;
      }
    }

    // 如果没有相关交易，返回空数组
    if (!hasitems) {
      return [];
    }

    console.log(adds.length + ' additions ' + spends.length + ' spends');

    // 构建返回的交易历史数据
    const processedTransactions = list.map((tx, index) => {
      const txSummary = summary[index] || { TIn: [], TOut: [] };
      
      return {
        txid: tx.txid,
        confirmations: tx.confirmations || 0,
        height: tx.height,
        timestamp: tx.blocktime || tx.timestamp,
        size: tx.size || 0,
        feeRate: tx.feeRate || 0,
        fee: tx.fee || 0,
        outputValue: this.calculateOutputValue(txSummary.TOut),
        vin: this.buildVinList(txSummary.TIn),
        vout: this.buildVoutList(txSummary.TOut),
        types: this.determineTransactionTypes(txSummary),
        methods: this.determineTransactionMethods(txSummary)
      };
    });

    return processedTransactions;
  }

  private isOurAddress(addrhex: string, targetAddress: string, pkScript: string, btc: boolean): boolean {
    // 检查地址是否匹配
    console.log('isOurAddress', addrhex, targetAddress);
    if (addrhex === targetAddress) return true;
    
    // 处理P2PKH地址
    if (btc && pkScript.substr(0, 4) == "5121" && 
        (pkScript.substr(4, 2) == "02" || pkScript.substr(4, 2) == "03") && 
        pkScript.substr(-4) == "52ae") {
      // 这里需要实现公钥到地址的转换
      const pk = pkScript.substr(4, 66);
      addrhex = "00" + nobleRipemd160(nobleSha256(hexToBytes(pk)));
      return addrhex === targetAddress;
    }
    
    return false;
  }

  private isCrossChain(pkScript: string): boolean {
    // 检查是否是跨链交易
    return (pkScript.substr(0, 2) != "88" && pkScript.substr(42, 2) == "66") ||
           (pkScript.substr(0, 2) != "88" && pkScript.substr(42, 2) == "45");
  }

  private tokentype2Big(tokentype: any): bigint {
    // 转换token类型为BigInt
    if (typeof tokentype === 'string') {
      return BigInt('0x' + tokentype);
    }
    return BigInt(tokentype || 0);
  }

  private calculateOutputValue(tOut: any[]): number {
    return tOut.reduce((sum, output) => sum + Number(output.Value || 0), 0);
  }

  private buildVinList(tIn: any[]): any[] {
    return tIn.map(input => ({
      address: '', // 需要从UTXO中获取
      value: Number(input.Value || 0)
    }));
  }

  private buildVoutList(tOut: any[]): any[] {
    return tOut.map(output => ({
      address: '', // 需要从PkScript中解析
      value: Number(output.Value || 0)
    }));
  }

  private determineTransactionTypes(summary: any): string[] {
    const types = [];
    if (summary.TIn.length > 0) types.push('transfer');
    if (summary.TOut.length > 0) types.push('receive');
    return types;
  }

  private determineTransactionMethods(summary: any): string[] {
    const methods = [];
    if (summary.TIn.length > 0) methods.push('send');
    if (summary.TOut.length > 0) methods.push('receive');
    return methods;
  }
}

export default new OpenapiService();