import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';

/**
 * 通知-仅适用后端提供的文字（旧版）
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */

export interface LabelNoticeConfig extends BaseMsgConfig {
  content: string;
}

class LabelNotice extends BaseMsg {
  public readonly content: string; // 通知内容字符串
  constructor(config: LabelNoticeConfig) {
    super(config);
    this.content = config.content;
  }

  /**
   * @example [通知]通知内容
   */
  public getListLabel(): string {
    return this.content ? `${LabelEnum.NOTIFY_LABEL}${this.content}` : '';
  }
}

export default LabelNotice;
