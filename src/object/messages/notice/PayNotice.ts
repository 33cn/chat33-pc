/**
 * 付款成功通知
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';

export interface PayNoticeConfig extends BaseMsgConfig {
  isPayByMe: boolean;
}

class PayNotice extends BaseMsg {
  public readonly isPayByMe: boolean; // 由我付款

  constructor(config: PayNoticeConfig) {
    super(config);
    this.isPayByMe = config.isPayByMe;
  }

  public getListLabel(): string {
    return this.isPayByMe ? LabelEnum.CHARGE_LABEL_MINE : LabelEnum.CHARGE_LABEL;
  }
}

export default PayNotice;
