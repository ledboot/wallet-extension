import Address from '../utils/address';
import { bytesToHex } from '../utils';
import { MsgT } from '../utils/msgTools';
import { TinDef, ToutDef } from '../utils/defs';
import openapiService, { OpenapiService } from './openapi';
import keyringService from './keyring';
declare const omegaDB: any;

export interface BuildTxOut {
  tokentype: bigint;
  Value: bigint;
  PkScript: string;
  Rights?: any;
}

export interface BuildTxIn {
  PreviousOutPoint?: any;
  addrid?: any;
}

export interface BuildResult {
  tx: any;
  txout: BuildTxOut[];
  txin: BuildTxIn[];
  fees: number | bigint;
  meta: Record<string, any>;
}

export class Model {
  chainid: number;

  constructor(chainid: number) {
    this.chainid = chainid;
  }

  public getWIF(address: string): string {
    return keyringService.exportAccount(address);
  }

  public async gatherCoins(
    condition: any,
    amount: bigint,
    fees: number | bigint,
    right: any,
    notxfee: any,
    checkutxo: any,
    crosschain: any
  ): Promise<{ sum: bigint; txin: any[]; inaddress: string[]; minTxFee: bigint; fees: number | bigint } | null> {
    let min: bigint | null = amount / 900n;
    let max: bigint | null = null;
    condition.min = min;
    condition.max = null;

    let sum = 0n;
    const txin: any[] = [];
    let minTxFee: bigint = notxfee ? 0n : 1000n;
    let more = true;
    let skip = 0;
    let diff = false as boolean;
    const inaddress: string[] = [];

    let assets: any[] | null = null;
    const btc = this.chainid == 0x400002;
    if (btc) fees = 1000;
    if (crosschain == 0x400002) {
      fees = 5000;
      amount += BigInt(fees);
    }

    const tokentype = BigInt(condition.bytype);
    const inclfee = !notxfee && tokentype == 0n;

    const fetchAssets = async (): Promise<any[]> => {
      return await this.assets(condition);
    };

    while (sum - minTxFee < amount && more) {
      if (assets != null && assets.length == 0) {
        condition.max = max = min as bigint;
        if (parseInt(String(condition.level ?? 0)) == 0) {
          if (min == null) {
            return { sum, txin, inaddress, minTxFee, fees: inclfee ? 0 : fees };
          }
          min = (min as bigint) / 100n;
        } else {
          min = (min as bigint) / 2n;
        }
        condition.min = min;
        condition.skip = 0;
        if ((max as bigint) == 0n) {
          more = false;
          break;
        }
        skip = 0;
      }

      condition.skip = skip;
      assets = await fetchAssets();
      skip += assets.length;
      more = (assets.length > 0) || ((min as bigint) > 0n);

      for (let i = 0; i < assets.length && sum - minTxFee < amount; i++) {
        const a = assets[i];
        if ((tokentype & 2n) == 2n && right && right != a.right) continue;

        let coinbase = false;
        if (a.coinbase && !(checkutxo || a.pending)) {
          coinbase = (a.blockheight ?? 0) + (this as any).coinbasemature > (this as any).bestHeight;
        }
        if (checkutxo || a.pending || coinbase) {
          const utxo = await openapiService.gto(a.txid, a.opindex, false);
          if (!utxo || utxo.error || !utxo.result) { diff = true; continue; }
          if (utxo.result.coinbase && utxo.result.confirmations < (this as any).coinbasemature) {
            continue;
          }
        }

        if (txin.findIndex(e => e.PreviousOutPoint?.Hash == a.txid && e.PreviousOutPoint?.Index == a.opindex) >= 0) continue;

        txin.push({ PreviousOutPoint: { Hash: a.txid, Index: a.opindex }, addrid: a.addrid });
        if ((tokentype & 2n) == 2n && !right) right = a.right;

        sum += BigInt(a.amount);
        fees = Number(fees) + 356;

        if (inaddress.findIndex(n => n == a.address) < 0) {
          inaddress.push(a.address);
          fees = Number(fees) + 240;
        }
        if (inclfee) minTxFee = BigInt(Math.max(Number(fees), 1000));

        if (txin.length >= 1000)
          return { sum, txin, inaddress, minTxFee, fees: inclfee ? 0 : fees };
      }
    }

    return { sum, txin, inaddress, minTxFee, fees: inclfee ? 0 : fees };
  }
  private async exec(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve) => {
      try {
        (omegaDB as any).transaction(function (tx: any) {
          tx.executeSql(
            sql,
            params,
            function (_tx: any, res: any) {
              const rows = res && (res.rows || res).rows;
              const out: any[] = [];
              if (rows) {
                if (typeof rows.item === 'function') {
                  for (let i = 0; i < rows.length; i++) out.push(rows.item(i));
                } else {
                  for (let i = 0; i < rows.length; i++) out.push(rows[i]);
                }
              }
              resolve(out);
            },
            function () {
              resolve([]);
            }
          );
        });
      } catch (e) {
        resolve([]);
      }
    });
  }

  public async assets(conditionIn: any, moduleName = ''): Promise<any[]> {
    const condition: any = { ...conditionIn };
    const normalizeRows = (rows: any[]) => {
      const d: any[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (d.findIndex((e) => e.txid == r.txid && e.opindex == r.opindex) >= 0) continue;
        try {
          if (r && r.tokentype != null) {
            r.tokentype = OpenapiService.tokentype2Big(r.tokentype);
          }
        } catch {}
        d.push(r);
      }
      return d;
    };
    const tables = [
      `${moduleName}ut_table as a JOIN conames_table as b`,
      `${moduleName}ut_table as a`,
    ];
    let sqlJoin: (string | null)[] = ["a.tokentype=b.tokentype", null];
    let where = "";
    let wglue = "";
    let glue = " AND ";
    let grouping = "";
    let items = "*, a.tokentype as tokentype";
    let listing = "";

    if (condition.bytype !== undefined && condition.bytype !== null) {
      const bt = BigInt(condition.bytype);
      const low40 = bt & ((1n << 40n) - 1n);
      const hi = bt >> 40n;
      const useChain = hi === 0n ? BigInt(this.chainid) : hi;
      sqlJoin[0] = `(b.tokentype=${low40.toString()} AND b.chainid=${useChain.toString()})`;
    }

    switch (parseInt(String(condition.level ?? 0))) {
      case 2:
        items = "SUM(amount) as amount, html, name";
        grouping = " GROUP BY a.tokentype";
        break;
      case 1:
        items = "SUM(amount) as amount, address, html, name";
        grouping = " GROUP BY a.tokentype,address";
        condition.withaddress = true;
        break;
      case 0:
      default: {
        if (condition.since || condition.before) {
          tables[0] = tables[0] + " JOIN txs_table as t";
          tables[1] = tables[1] + " JOIN txs_table as t";
          sqlJoin[0] = (sqlJoin[0] ? sqlJoin[0] + glue : "") + " a.txid=t.txid";
          if (sqlJoin[1]) sqlJoin[1] = sqlJoin[1] + glue + " a.txid=t.txid";
          else {
            where = " a.txid=t.txid";
            wglue = " AND ";
          }
          glue = " AND ";
        }
        if (condition.since) {
          where += wglue + ` t.blocktime>=${Number(condition.since).toString()}`;
          wglue = " AND ";
        }
        if (condition.before) {
          where += wglue + ` t.blocktime<=${Number(condition.before).toString()}`;
          wglue = " AND ";
        }
        if (condition.txid) {
          where += wglue + ` a.txid='${String(condition.txid).replace(/'/g, "''")}'`;
          wglue = " AND ";
          if (condition.txo !== undefined) {
            where += ` AND a.opindex=${Number(condition.txo).toString()}`;
          }
        }
        if (condition.min) {
          where += wglue + ` amount>=${condition.min}`;
          wglue = " AND ";
        }
        if (condition.max) {
          where += wglue + ` amount<${condition.max}`;
          wglue = " AND ";
        }
        condition.withaddress = true;
        break;
      }
    }

    if (condition.bytype != null && Number(condition.bytype) >= 0) {
      const bytypeHex = BigInt(condition.bytype).toString(16);
      const clause = ` (a.tokentype='0x${bytypeHex}' OR (a.tokentype<140737488355327 AND a.tokentype=${Number(
        condition.bytype
      ).toString()})) `;
      sqlJoin[0] = (sqlJoin[0] ? sqlJoin[0] + glue : "") + clause;
      if (sqlJoin[1]) sqlJoin[1] = sqlJoin[1] + glue + clause;
      else {
        where += wglue + clause;
        wglue = " AND ";
      }
      glue = " AND ";
    }

    tables[0] += " ON " + (sqlJoin[0] || "");
    if (sqlJoin[1]) tables[1] += " ON " + sqlJoin[1];

    let sql = "";
    glue = "";

    if (condition.nocontract) {
      condition.withaddress = true;
      sql += glue + " hex not like '88%'";
      glue = " AND ";
    }
    if (condition.byaddress || condition.withaddress) {
      tables[0] += " JOIN address_table as d";
      tables[1] += " JOIN address_table as d";
      items += ", hex";
      sql += glue + " d.id=a.addrid";
      glue = " AND ";
      if (condition.byaddress) {
        const addr = String(condition.byaddress).replace(/'/g, "''");
        where += wglue + `(d.address='${addr}' OR d.hex='${addr}')`;
        wglue = " AND ";
      }
    }

    if (condition.total !== undefined) condition.total = parseInt(String(condition.total));
    if (condition.skip !== undefined) {
      condition.skip = parseInt(String(condition.skip));
      if (condition.total === undefined) condition.total = 1000;
    }
    if (condition.recent !== undefined) condition.recent = parseInt(String(condition.recent));

    if (
      condition.skip !== undefined ||
      condition.total !== undefined ||
      condition.recent !== undefined ||
      condition.order ||
      condition.largefirst
    ) {
      listing = " ORDER BY ";
      let lglue = "";
      if (condition.order) {
        listing += condition.order;
        lglue = ",";
      } else {
        const level = parseInt(String(condition.level ?? 0));
        if (level === 0) {
          listing += lglue + "blockheight";
          lglue = ",";
          if (condition.recent) listing += " DESC";
        } else if (condition.largefirst) {
          listing += lglue + "amount DESC";
          lglue = ",";
        } else {
          listing += lglue + "tokentype";
        }
        if (level !== 2) listing += ",a.id";
      }
      if (condition.skip !== undefined || condition.total !== undefined) {
        const skip = condition.skip ?? 0;
        const total = condition.total ?? 1000;
        listing += ` LIMIT ${skip},${total}`;
      }
    }

    if (condition.locked !== undefined) {
      where += wglue + ` locked=${Number(condition.locked)}`;
      wglue = " AND ";
    }
    if (condition.userdef !== undefined) {
      where += wglue + String(condition.userdef);
      wglue = " AND ";
    }

    const sql0 = `select ${items} from ${tables[0]} ON ${sql}${where ? " WHERE " + where : ""}${grouping}${listing}`;
    const sql1 = `select ${items} from ${tables[1]} ON ${sql}${where ? " WHERE " + where : ""}${grouping}${listing}`;

    if (condition.sql !== undefined) {
      const rows = await this.exec(String(condition.sql));
      return normalizeRows(rows);
    }

    if (condition.bytype !== undefined && condition.bytype !== null) {
      const bt = BigInt(condition.bytype);
      const params = [
        ((bt & ((1n << 40n) - 1n))).toString(),
        (bt >> 40n) == 0n ? this.chainid : Number(bt >> 40n),
      ];
      const check = await this.exec(`SELECT * from conames_table WHERE tokentype=? AND chainid=?`, params);
      const pick = (check && check.length === 0) ? sql1 : sql0;
      const rows = await this.exec(pick, []);
      return normalizeRows(rows);
    }

    const rows = await this.exec(sql0, []);
    return normalizeRows(rows);
  }

  public async build(
    tokentype: bigint | number | string,
    amount: any,
    address: string,
    src: string | null,
    checkutxo: any,
    notxfee: any,
    merge: any,
    crosschain: any
  ): Promise<MsgT | false> {
    tokentype = BigInt(tokentype as any);

    let hextx: string | undefined;
    let right: any = null;
    let outtokentype = tokentype as bigint;

    if (typeof amount === 'object') {
      right = amount.right;
      amount = amount.amount;
    }

    amount = BigInt(Math.round(Number(amount)));
    crosschain = Number(crosschain) + 0;

    // cross-chain handling and outtokentype adjustments
    if (crosschain !== 0) {
      const rc = (outtokentype >> 40n) & 0x3fffffn;
      if (rc !== 0n && rc !== BigInt(this.chainid)) {
        // allow transfer only back to its origin chain in the patch
        if (parseInt((outtokentype >> 40n).toString()) !== crosschain) {
          throw new Error('Cannot transfer to other chains!');
        }
      } else if (rc === 0n) {
        outtokentype = (outtokentype & 0xFFFFFFFFFFn) | (BigInt(this.chainid) << 40n);
      }
    }

    // gather condition and base fees
    const condition: any = {
      level: 0,
      bytype: tokentype,
      order: 'amount asc',
      locked: 0,
      skip: 0,
      total: 100,
      nocontract: true,
    };
    if (src && src !== 'null') condition.byaddress = src;

    let fees: number = 1200 + (address ? address.length : 0);
    let xch: any = { result: { Fees: [] as number[] } };
    let btcfee: number = 0;

    if (crosschain !== 0 && crosschain !== this.chainid) {
      xch = await openapiService.getxchtxfee(crosschain);
      if (!xch || xch.error != null || !xch.result || !xch.result.Fees) {
        return false;
      }
      for (let i = 0; i < xch.result.Fees.length; i++) btcfee += xch.result.Fees[i];
      if (this.chainid == 1) {
        // combine btc fee with regular fee in testing phase
        fees += btcfee;
        btcfee = 0;
      }
      fees += 100 * xch.result.Fees.length;
    }

    // initialize tx
    const tx = new MsgT();

    const txout: BuildTxOut[] = [];
    const txin: BuildTxIn[] = [];

    if (address) {
      if ((tokentype & 2n) === 2n && right) {
        txout.push({ tokentype: outtokentype, Value: BigInt(amount), PkScript: address, Rights: right });
      } else {
        txout.push({ tokentype: outtokentype, Value: BigInt(amount), PkScript: address });
      }
    }
    // btc fees that needs to gather
    let btcfeeBI: bigint = 0n;
    if (crosschain === 0x400002) btcfeeBI = 5000n;

    let sbtcfee = 0n;
    btcfeeBI = BigInt(btcfeeBI);
    if (tokentype === (1n << 40n)) {
      sbtcfee = btcfeeBI;
      amount = BigInt(amount) + btcfeeBI;
      btcfeeBI = 0n;
      if (txout.length > 0) txout[0].Value = BigInt(amount);
    }

    if (btcfeeBI > 0n) {
      const bamount = btcfeeBI;
      let sumBI = 0n;
      fees = 0;
      let condition2: any = { level: 0, bytype: 1n << 40n, order: 'amount asc', locked: 0, skip: 0, total: 100 };
      if (src && src !== 'null') condition2.byaddress = src;
      const rbtc = await this.gatherCoins(condition2, bamount, 0, null, false, checkutxo, 0);
      if (!rbtc || rbtc.sum < bamount) return false;
      (txin as any[]).push(...rbtc.txin);
      fees = rbtc.fees as number;
      sumBI = rbtc.sum;
      if (sumBI - bamount > 0n) {
        let adb = Array.from(Address.decodeString(rbtc.inaddress[0]));
        const op = adb[0] == 0 || adb[0] == 0x6f ? 0x41 : adb[0] == 0x78 ? 0x43 : 0x42;
        adb = adb.concat([op, 0, 0, 0]);
        txout.push({ tokentype: this.chainid == 1 ? 0n : 1n << 40n, Value: sumBI - bamount, PkScript: bytesToHex(adb) });
      }
    }

    const rmain = await this.gatherCoins(condition, BigInt(amount), fees, right, notxfee, checkutxo, crosschain);
    if (rmain == null) return false;

    let sum = rmain.sum;
    const inaddress = rmain.inaddress;
    let minTxFee = rmain.minTxFee;
    if (tokentype != 0n) rmain.minTxFee = 0n;
    (txin as any[]).push(...rmain.txin);
    fees = rmain.fees as number;

    if (tokentype === (1n << 40n)) {
      amount = BigInt(amount) - sbtcfee;
      btcfeeBI = sbtcfee;
      if (txout.length > 0) txout[0].Value = BigInt(amount);
    } else {
      btcfeeBI = 0n;
    }

    if (BigInt(amount) > 0n && (txin as any[]).length == 0 && !notxfee) return false;
    if (BigInt(amount) + rmain.minTxFee > sum) return false;

    const rev = (hex: string) => (hex.match(/../g)?.reverse().join('') ?? '');
    const mychain = rev(this.chainid.toString(16).padStart(8, '0')).substr(0, 6);
    if (xch && xch.result && Array.isArray(xch.result.Fees) && Array.isArray(xch.result.Path)) {
      for (let i = 0; i < xch.result.Fees.length; i++) {
        const pks: string = xch.result.Path[i];
        if (pks.substr(44, 6) == mychain)
          txout.push({ tokentype: this.chainid == 1 ? 0n : 1n << 40n, Value: BigInt(xch.result.Fees[i]), PkScript: pks.substr(0, 44) + '000000' });
        else txout.push({ tokentype: 1n << 40n, Value: BigInt(xch.result.Fees[i]), PkScript: pks });
      }
    }

    let adb: number[] = [];
    if (inaddress && inaddress.length) {
      adb = Array.from(Address.decodeString(inaddress[0]));
      const op = adb[0] == 0 || adb[0] == 0x6f ? 0x41 : adb[0] == 0x78 ? 0x43 : 0x42;
      adb = adb.concat([op, 0, 0, 0]);
    }

    let checktxfee = true;
    const btc = this.chainid == 0x400002;
    if (this.chainid == 2 && crosschain == 0x400002 && adb.length > 0) {
      checktxfee = false;
      if (sum - BigInt(amount) - 5000n > 200n)
        txout.push({ tokentype: tokentype as bigint, Value: sum - BigInt(amount) - 5000n, PkScript: bytesToHex(adb) });
    } else if (adb.length > 0) {
      if (BigInt(amount) != sum) {
        if ((tokentype & 2n) == 2n && right)
          txout.push({ tokentype: tokentype as bigint, Value: sum - BigInt(amount), PkScript: bytesToHex(adb), Rights: right });
        else
          txout.push({ tokentype: tokentype as bigint, Value: sum - BigInt(amount) - btcfeeBI - (tokentype == 0n && !notxfee ? rmain.minTxFee : 0n), PkScript: bytesToHex(adb) });
      }
    }

    if (!notxfee && checktxfee && fees != 0) {
      amount = BigInt(fees);
      sum = 0n;
      fees = 0;
      let condition2: any = { level: 0, bytype: 0n, order: 'amount asc', locked: 0, skip: 0, total: 100 };
      if (src && src != 'null') condition2.byaddress = src;
      const rfee = await this.gatherCoins(condition2, BigInt(amount), fees, null, false, checkutxo, 0);
      if (!rfee || rfee.sum < BigInt(amount)) return false;
      (txin as any[]).push(...rfee.txin);
      if (rfee.sum - BigInt(amount) - minTxFee > 200n) {
        adb = Array.from(Address.decodeString(inaddress[0]));
        const op = adb[0] == 0 || adb[0] == 0x6f ? 0x41 : adb[0] == 0x78 ? 0x43 : 0x42;
        adb = adb.concat([op, 0, 0, 0]);
        txout.push({ tokentype: 0n, Value: rfee.sum - BigInt(amount) - minTxFee, PkScript: bytesToHex(adb) });
      }
    }
    if (btc) {
    //   for (let i = 0; i < txout.length; i++) {
    //     if (txout[i].tokentype == 0 || btc)
    //       txout[i].Value = parseFloat(txout[i].Value) / 1e8;
    //   }
    //   var pk = txout[0].PkScript;
    //   txout[0].tokentype = tokentype;
    //   var a = 0;
    //   if (btc && crosschain == 2) a = 1;
    //   if (btc && crosschain == 0) a = 2;
    //   var thx = this.crt(txin, [], txout, a);
    //   console.log(thx)
    //   if (!thx || thx.error) {
    //     return false;
    //   }
    //   hextx = thx.result.toLowerCase();
    //   tx.prototype.RawDecode(hextx);
    //   tx.TOut[0].tokentype = outtokentype;

    //   if(!btc) tx.TOut[0].PkScript = pk;
    }else{
      var SignatureIndex = 0;
      var addresses: any[] = [];

      for (var i = 0; i < txin.length; i++) {
        var indef = new TinDef();
        indef.previousOutPoint = {
          hash: txin[i].PreviousOutPoint.Hash,
          index: txin[i].PreviousOutPoint.Index,
        };
        var sid = addresses.findIndex(n=>n == txin[i].addrid);
        if (sid >= 0) indef.signatureIndex = sid;
        else {
          indef.signatureIndex = SignatureIndex;
          SignatureIndex++;
          addresses.push(txin[i].addrid);
        }
        indef.sequence = -1;
        tx.tIn.push(indef);
      }
      for (var i = 0; i < txout.length; i++) {
        var outdef = new ToutDef();
        outdef.tokenType = BigInt(txout[i].tokentype);
        outdef.value = BigInt(txout[i].Value);
        outdef.pkScript = txout[i].PkScript;
        if ((outdef.tokenType & 2n) != 0n && txout[i].Rights)
          outdef.rights = [txout[i].Rights];
        tx.tOut.push(outdef);
      }
    }




    return tx;
  }
}

export default Model;
