import openapiService, { OpenapiService } from "../service/openapi";
import { MsgT } from "../utils/msgTools";
import Address from "../utils/address";
import { bytesToHex } from "../utils";

export interface SendParams {
  amount: string; // 数量
  fromAddress: string; // 转出地址
  password: string; // 密码
  toAddress: string; // 接收地址
  crossChainId: number | string; // 跨链chainid
  timeLimit: number; // 时间限制（单位由上层约定）
}

export async function createSendRequest(params: SendParams) {
  const {
    amount,
    fromAddress,
    password,
    toAddress,
    crossChainId,
    timeLimit,
  } = params;
 
  // --- Begin address and cross-chain preparation (adapted from provided snippet) ---
  const self = (undefined as unknown) as any; // placeholder if needed later
  let pks = '';
  let adb = Array.from(Address.decodeString(toAddress));

  const crosschain = parseInt(String(crossChainId));
  if (crosschain !== 0) {
    adb = adb.concat([
      0x66,
      crosschain & 0xff,
      (crosschain >> 8) & 0xff,
      (crosschain >> 16) & 0xff,
    ]);
  }

  const op = adb[0] === 0 || adb[0] === 0x6f ? 0x41 : adb[0] === 0x78 ? 0x43 : 0x42;
  adb = adb.concat([op, 0, 0, 0]);
  pks = bytesToHex(adb);

  let tokentype = 0n as bigint;
  let sendAmount: any = amount as any;
  if (typeof sendAmount === 'object' && sendAmount) {
    tokentype = BigInt(sendAmount.tokentype ?? 0);
    sendAmount = sendAmount.amount;
  }

  const merge = toAddress === fromAddress;
  // --- End snippet adaptation ---

  


  return {
    amount,
    fromAddress,
    toAddress,
    password,
    crossChainId,
    timeLimit,
  };
}

export default {
  createSendRequest,
};

