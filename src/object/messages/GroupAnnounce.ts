/**
 * 群公告消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';

export interface GroupAnnounceConfig extends BaseMsgConfig {
  content: string;
}

class GroupAnnounce extends BaseMsg {
  public readonly content: string; // 公告内容

  constructor(config: GroupAnnounceConfig) {
    super(config);
    this.content = config.content;
  }

  public getListLabel(): string {
    return this.content ? `${LabelEnum.SYSTEM_LABEL}${this.content}` : '';
  }
}

export default GroupAnnounce;
