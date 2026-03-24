import { ripemd160 as nobleRipemd160 } from '@noble/hashes/ripemd160';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';

import { CHAIN_INFO, NetworkType, ServerConfiguration } from '@/shared/constants';
import { Account, ChainInfo, CoinNames, TxHistoryItem, TxType, Utxo } from '@/shared/types';

import assetService from '../service/asset';
import { addressHexToString, bytesToHex, hexToBytes } from '../utils';
import Address from '../utils/address';
import { MsgT } from '../utils/msgTools';
import { buildTx, signTransaction } from '../utils/transactionTools';
import preferenceService from './preference';

export class OpenapiService {
  constructor() {}

  getEndpoint = () => {
    const chainInfo = preferenceService.getCurrentChainInfo();

    if (!chainInfo) {
      throw new Error('No current chain info');
    }

    if (!chainInfo.endpoints || chainInfo.endpoints.length === 0) {
      throw new Error(`No endpoints found for chain: ${chainInfo.label}`);
    }

    return chainInfo.endpoints[0];
  };

  getRespData = async <T = any>(res: Response): Promise<{ id: number; error: any; result: T }> => {
    let jsonRes: { id: number; error: any; result: T };

    if (!res) throw new Error('Network error, no response');
    if (res.status !== 200) throw new Error('Network error with status: ' + res.status);
    try {
      jsonRes = await res.json();
    } catch (e) {
      throw new Error('Network error, json parse error');
    }
    if (!jsonRes) throw new Error('Network error,no response data');
    return jsonRes;
  };

  httpPost = async <T = any>(
    url: string,
    method: string,
    data: any
  ): Promise<{ id: number; error: any; result: T }> => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const rpcToken = import.meta.env.VITE_RPC_TOKEN;
    headers.append('Authorization', `Basic ${rpcToken}`);
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
      return await this.getRespData<T>(res);
    } catch (e) {
      console.error('httpPost 报错:', e);
      throw new Error('Network error, ' + e);
    }
  };

  httpGet = async <T = any>(url: string): Promise<{ id: number; error: any; result: T }> => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const rpcUser = import.meta.env.VITE_RPC_USER;
    const rpcPassword = import.meta.env.VITE_RPC_PASS;
    headers.append('Authorization', `Basic ${btoa(`${rpcUser}:${rpcPassword}`)}`);
    let res: Response;
    try {
      res = await fetch(
        new Request(url, {
          method: 'GET',
          cache: 'default',
          headers,
        })
      );
      return await this.getRespData<T>(res);
    } catch (e) {
      console.error('httpGet 报错:', e);
      throw new Error('Network error, ' + e);
    }
  };

  getAddressHistory = async (account: Account, start: number, limit: number, chainId: number) => {
    const res = await this.httpPost(this.getEndpoint(), 'schrt', [account.address, 0, start, limit, 0, false]);
    if (res.result && Array.isArray(res.result) && res.result.length > 0) {
      const { txHistory, utxoItems, latestHeight } = await this.analyzeResult(account, res.result, chainId);
      return { txHistory, utxoItems, hasHistory: true, latestHeight };
    }
    return { txHistory: [], utxoItems: [], hasHistory: false, latestHeight: -1 };
  };

  fetchTokentype = async (utxos: Utxo[] = [], chainId?: string): Promise<{ CoinNames: CoinNames[] }> => {
    const existingCoinNames = assetService.getCoinNames();
    const tokenTypes = utxos.map((u) => u.tokenType).filter((t) => t !== undefined && t !== null && t !== '');
    const tokenTypesStr = [...new Set(tokenTypes)].join(',');
    if (!tokenTypesStr) {
      return { CoinNames: existingCoinNames };
    }
    let updated: number = 0;
    if (existingCoinNames.length > 0) {
      updated = Math.max(0, ...existingCoinNames.map((c) => Number(c.updated || 0)));
    }
    const { serverEndpoint, chainclass } = ServerConfiguration;

    const url =
      `${serverEndpoint}/omega/index.php?module=ncx&MOD_op=gettokendef&class=${chainclass}&tokentype=${tokenTypesStr}` +
      (chainId ? `&chainid=${chainId}` : '') +
      (updated ? `&updated=${updated}` : '');
    const res = await this.httpGet(url);
    if (!res.result) return { CoinNames: existingCoinNames };

    const newConames: CoinNames[] = [];
    for (let i = 0; i < res.result.length; i++) {
      const item = res.result[i];
      const coname: CoinNames = {
        name: String(item?.name ?? ''),
        chainId: Number(item.chainid),
        tokenType: String(item?.tokentype ?? ''),
        iconHtml: String(item?.html ?? ''),
        decimalpoint: Number(item.decimalpoint),
        updated: Number(item?.updated ?? 0),
        currency: Number(item?.currency ?? 0),
      };
      newConames.push(coname);
    }

    const mergedCoinNameMap = new Map(existingCoinNames.map((coin) => [`${coin.chainId}:${coin.tokenType}`, coin]));
    for (const coin of newConames) {
      mergedCoinNameMap.set(`${coin.chainId}:${coin.tokenType}`, coin);
    }
    const mergedCoinNames = [...mergedCoinNameMap.values()];

    // Save to asset store
    assetService.addCoinName(mergedCoinNames);

    return { CoinNames: mergedCoinNames };
  };

  fetchBlockchains = async () => {
    const { serverEndpoint, chainclass } = ServerConfiguration;

    // 获取现有网络配置中的最大 id 和 updated
    const allChainInfo = {
      ...CHAIN_INFO,
      ...preferenceService.getAllchainInfo(),
    };
    const chainIds = Object.values(allChainInfo)
      .map((chain) => chain.id || 0)
      .filter((id) => id > 0);
    const updatedTimes = Object.values(allChainInfo)
      .map((chain) => chain.updated || 0)
      .filter((time) => time > 0);

    const maxchainid = chainIds.length > 0 ? Math.max(...chainIds) : 0;
    const updated = updatedTimes.length > 0 ? Math.max(...updatedTimes) : 0;

    console.log('fetchBlockchains - maxchainid:', maxchainid, 'updated:', updated);

    const url = `${serverEndpoint}/omega/index.php?module=ncx&MOD_op=getblockchains&class=${chainclass}&id=${maxchainid}&updated=${updated}`;
    const res = await this.httpGet(url);

    // 处理获取到的区块链网络信息
    if (Array.isArray(res) && res.length > 0) {
      console.log(`Processing ${res.length} remote networks...`);
      res.forEach((apiData) => {
        try {
          const meta = JSON.parse(apiData.meta);
          const resolvedRpcEndpoint = `http://${meta.dns}:${meta.rpcport}`;

          const networkConfig: ChainInfo = {
            label: apiData.name,
            iconLabel: apiData.name,
            chainId: parseInt(apiData.chainid, 16),
            endpoints: apiData.endpoints
              ? Array.isArray(apiData.endpoints)
                ? apiData.endpoints
                : ([apiData.endpoints] as string[])
              : [resolvedRpcEndpoint],
            icon: apiData.icon,
            unit: apiData.name,
            networkType: Number(apiData.testnet) ? NetworkType.TESTNET : NetworkType.MAINNET,
            updated: apiData.updated || 0,
            id: apiData.id,
          };

          const networkId = `${networkConfig.label.toUpperCase().replace(/\s+/g, '_')}_${networkConfig.networkType.toUpperCase()}`;
          console.log('Generated networkId:', networkId);

          preferenceService.addchainInfo(networkId, networkConfig);
        } catch (error) {
          console.error('Error adding network from API data:', error);
        }
      });
      console.log('Dynamic networks added successfully');
    }
  };

  decodeMsgHex = (hex: string) => {
    const msgtx = new MsgT();
    msgtx.rawDecode(hex);

    const chainInfo = preferenceService.getCurrentChainInfo();
    const currentChainId = chainInfo.chainId;
    const coinbaseHash = '0000000000000000000000000000000000000000000000000000000000000000';

    const btc = currentChainId == 0x400002; // 假设这是比特币网络
    const txOUtLen = msgtx?.tOut.length || 0;
    const tOut: any[] = [];
    const tIn: any[] = [];
    let isCoinbase = false;
    for (let j = 0; j < txOUtLen; j++) {
      const output = msgtx?.tOut[j];

      // 跳过无效输出
      if (output.isSeparator()) continue;
      if (!btc && (output.tokenType & 1n) == 0n && output.value == 0n) continue;
      if (btc && output.value == 0n) continue;

      // 提取地址
      const addressHex = btc ? '00' + output.pkScript.substr(6, 40) : output.pkScript.substr(2, 40);
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
      if (input.previousOutPoint.hash == coinbaseHash) {
        if (tIn.length === 0) {
          isCoinbase = true;
        }
        continue;
      }

      tIn.push({
        previousOutPointIndex: input.previousOutPoint.index,
        previousOutPointHash: input.previousOutPoint.hash,
        signatureIndex: input.signatureIndex,
        sequence: input.sequence,
      });
    }
    return { tIn, tOut, isCoinbase };
  };

  analyzeResult = async (account: Account, list: any[], chainId: number) => {
    // 初始化变量
    const txHistory: TxHistoryItem[] = [];
    let latestHeight = -1;
    const syncedUtxos = assetService.getUtxosMap(account.address, chainId);
    const utxoMap = new Map<string, Utxo>(syncedUtxos.map((utxo) => [`${utxo.txid}:${utxo.index}`, utxo]));
    const addsMap = new Map<string, Utxo>();
    const spendsSet = new Set<string>();
    const decodedCurrentBatchMap = new Map<string, ReturnType<OpenapiService['decodeMsgHex']>>();
    const decodedRawTxCache = new Map<string, ReturnType<OpenapiService['decodeMsgHex']>>();

    const parsedTxList = list.map((item) => {
      const decoded = this.decodeMsgHex(item.hex);
      if (item?.txid) {
        decodedCurrentBatchMap.set(item.txid, decoded);
      }
      const currentHeight = Number(item?.height);
      if (Number.isFinite(currentHeight)) {
        latestHeight = Math.max(latestHeight, currentHeight);
      }
      return { item, ...decoded };
    });

    const getDecodedTxById = async (txid: string) => {
      if (!txid) return null;
      if (decodedCurrentBatchMap.has(txid)) {
        return decodedCurrentBatchMap.get(txid)!;
      }
      if (decodedRawTxCache.has(txid)) {
        return decodedRawTxCache.get(txid)!;
      }
      const rawTx = await this.getRawTransaction(txid);
      if (!rawTx) return null;
      const decoded = this.decodeMsgHex(rawTx);
      decodedRawTxCache.set(txid, decoded);
      return decoded;
    };

    // 两阶段处理：先收集 adds / spends，再统一结算，避免顺序导致漏删
    for (let i = 0; i < parsedTxList.length; i++) {
      const { item, tIn, tOut, isCoinbase } = parsedTxList[i];
      let hasOwnedInput = false;

      for (let j = 0; j < tIn.length; j++) {
        const previousOutPointHash = tIn[j].previousOutPointHash;
        const previousOutPointIndex = tIn[j].previousOutPointIndex;
        spendsSet.add(`${previousOutPointHash}:${previousOutPointIndex}`);

        // 使用链上前序输出判定该输入是否来自当前账户
        const previousDecodedTx = await getDecodedTxById(previousOutPointHash);
        const previousOutput = previousDecodedTx?.tOut?.find((out) => out.outPointIndex === previousOutPointIndex);
        if (previousOutput && account.addressHex == previousOutput.addressHex) {
          hasOwnedInput = true;
        }
      }

      for (let j = 0; j < tOut.length; j++) {
        const output = tOut[j];
        const isOutputToSelf = account.addressHex == output.addressHex;
        if (isOutputToSelf) {
          let sender = isCoinbase ? 'Coinbase' : '';
          if (!isCoinbase && tIn.length > 0) {
            const previousDecodedTx = await getDecodedTxById(tIn[0].previousOutPointHash);
            if (previousDecodedTx?.tOut?.length) {
              sender = previousDecodedTx.tOut[0].address;
            }
          }
          const txItemHistory = {
            txid: item.txid,
            index: output.outPointIndex,
            address: sender,
            coinbase: isCoinbase,
            txType: TxType.RECEIVE,
            blockHeight: item.height,
            blockHash: item.blockhash,
            blockTime: item.blocktime,
            tokenType: output.tokenType.toString(),
            value: Number(output.value),
            rights: output.rights,
            confirmations: 10,
            pkScript: output.pkScript,
            myaddress: account.address,
          };
          const txItemUtxo: Utxo = {
            txid: item.txid,
            index: output.outPointIndex,
            address: account.address,
            scriptPubKey: output.pkScript,
            blockHeight: item.height,
            blockHash: item.blockhash,
            tokenType: output.tokenType.toString(),
            value: Number(output.value),
            rights: output.rights || [],
          };
          txHistory.push(txItemHistory);
          addsMap.set(`${txItemUtxo.txid}:${txItemUtxo.index}`, txItemUtxo);
        } else if (hasOwnedInput) {
          // 有本地址输入且当前输出不是找零，则记为发送记录。
          txHistory.push({
            txid: item.txid,
            index: output.outPointIndex,
            address: output.address,
            coinbase: false,
            txType: TxType.SEND,
            blockHeight: item.height,
            blockHash: item.blockhash,
            blockTime: item.blocktime,
            tokenType: output.tokenType.toString(),
            value: Number(output.value),
            rights: output.rights || [],
            confirmations: 10,
            pkScript: output.pkScript,
            myaddress: account.address,
          });
        }
      }
    }

    // phase-2: spent 从旧 UTXO 删除，并抵消同批次新增后又花费的输出
    for (const spendKey of spendsSet) {
      if (utxoMap.delete(spendKey)) {
        console.log(`Removing spent UTXO: ${spendKey}`);
      }
      if (addsMap.has(spendKey)) {
        addsMap.delete(spendKey);
      }
    }

    for (const [utxoKey, utxo] of addsMap.entries()) {
      utxoMap.set(utxoKey, utxo);
    }

    const utxoItems = Array.from(utxoMap.values());
    // 构建返回的交易历史数据
    return { txHistory, utxoItems, latestHeight };
  };

  private isOurAddress(addrhex: string, targetAddress: string, pkScript: string, btc: boolean): boolean {
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
    const res = await this.httpPost(this.getEndpoint(), 'getrawtransaction', [txid, 0, true, false]);
    if (res.result) {
      return res.result;
    }
    return null;
  };

  getTxOut = async (txid: string, vout: number) => {
    const res = await this.httpPost(this.getEndpoint(), 'gettxout', [txid, vout, false]);
    return res;
  };

  gto = async (txid: string, index: number, locked?: boolean) => {
    const res = await this.httpPost(this.getEndpoint(), 'gettxout', [txid, index, false, locked ? true : false]);
    return res;
  };

  getxchtxfee = async (target: number) => {
    const res = await this.httpPost(this.getEndpoint(), 'getxchtxfee', [target]);
    return res;
  };

  gbc = async () => {
    const res = await this.httpPost(this.getEndpoint(), 'gbc', []);
    return res;
  };

  sendRawTransaction = async (txhex: any, waitconfirmation: number) => {
    if (typeof txhex != 'string') txhex = bytesToHex(Array.from(txhex.encode(1)));
    const res = await this.httpPost(this.getEndpoint(), 'srt', [txhex, true, waitconfirmation]);
    return res;
  };

  tryContract = async (txhex: string) => {
    return this.httpPost(this.getEndpoint(), 'trycontract', [txhex]);
  };

  contractCall = async (contractAddress: string, params: string) => {
    return this.httpPost(this.getEndpoint(), 'contractcall', [contractAddress, params]);
  };

  transfer = async (
    amount: bigint,
    tokenType: bigint,
    receivedAddress: string,
    senderAddress: string,
    crosschain: number,
    timeLimit: number
  ) => {
    let adb = Array.from(Address.decodeString(receivedAddress));
    const op = adb[0] === 0 || adb[0] === 0x6f ? 0x41 : adb[0] === 0x78 ? 0x43 : 0x42;
    adb = adb.concat([op, 0, 0, 0]);
    const pks = bytesToHex(adb);
    const merge = receivedAddress === senderAddress;

    const tx = await buildTx(tokenType, amount, pks, senderAddress, false, merge, crosschain);

    if (timeLimit) {
      const height = await this.gbc();
      if (!height || height.error) tx.version = 0x11;
      else {
        tx.version = 0x41;
        tx.lockTime = height.result + timeLimit;
      }
    }

    const signTx = await signTransaction(tx, 1);

    const hextx = await this.sendRawTransaction(signTx, 0);

    return hextx;
  };

  computeTransactioFeesMax = async (tokenType: number, senderAddress: string) => {
    let fees = 0;
    const addrs: string[] = [];
    const assets = assetService.getUtxosByAddress(senderAddress || '');
    fees += assets.length * 356;
    for (let i = 0; i < assets.length; i++) {
      if (addrs.findIndex((e) => e == assets[i].address) < 0) {
        addrs.push(assets[i].address);
        fees += 240;
      }
    }
    if (tokenType === 0 || tokenType === 16) fees += 1400;
    return fees;
  };

  computeTransactioFees = async (tokenType: number, senderAddress: string, amount: number, receivedAddress: string) => {
    let adb = Array.from(Address.decodeString(receivedAddress));
    const op = adb[0] === 0 || adb[0] === 0x6f ? 0x41 : adb[0] === 0x78 ? 0x43 : 0x42;
    adb = adb.concat([op, 0, 0, 0]);
    const receivedPks = bytesToHex(adb);
    let fees = 1200 + (receivedPks ? receivedPks.length : 0);

    const inclfee = tokenType === 0;
    const assets = assetService.getUtxosByAddress(senderAddress || '');
    const addrs: string[] = [];
    let sum = 0;
    let minTxfee = 0;
    for (let i = 0; i < assets.length; i++) {
      sum += assets[i].value;
      fees += 356;
      if (addrs.findIndex((e) => e == assets[i].address) < 0) {
        addrs.push(assets[i].address);
        fees += 240;
      }
      if (inclfee) {
        minTxfee = Math.max(fees, 1000);
      }
      if (sum - minTxfee >= amount) break;
    }
    return minTxfee;
  };
}

export default new OpenapiService();
