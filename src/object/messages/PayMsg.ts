import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';

/**
 * 转账/收款消息(可以拆分未两个object)
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */

export interface PayMsgConfig extends BaseMsgConfig {
  coinName: string;
  amount: number;
  recordId: string;
  isCharge: boolean; // 是收款
}

class PayMsg extends BaseMsg {
  public readonly coinName: string;
  public readonly amount: number;
  public readonly recordId: string;
  public readonly isCharge: boolean;

  constructor(config: PayMsgConfig) {
    super(config);
    this.coinName = config.coinName;
    this.amount = config.amount;
    this.recordId = config.recordId;
    this.isCharge = config.isCharge;
  }

  public getListLabel(): string {
    if (this.isCharge) { // 收款
      return this.isSendByMe ? LabelEnum.CHARGE_LABEL_MINE : LabelEnum.CHARGE_LABEL;
    }
    return this.isSendByMe ? LabelEnum.PAY_LABEL_MINE : LabelEnum.PAY_LABEL; // 转账

  }
}

export default PayMsg;
