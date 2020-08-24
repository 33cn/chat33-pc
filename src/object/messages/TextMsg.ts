/**
 * 纯文本聊天消息
 * @author yuanzeyu
 * @date 2019-05-09
 * @desc
 */
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {UserLoggedInfo} from '@/scripts/object'
// import Group from '@/object/targets/Group'
export interface TextMsgConfig extends BaseMsgConfig {
  content: string;
}

class TextMsg extends BaseMsg {
  public readonly content: string; // 消息内容

  constructor(config: TextMsgConfig) {
    super(config);
    this.content = config.content;
  }

  public getListLabel(isGroup: boolean): string {
    let result: string = this.content || '';
    if (isGroup) { // 群消息加发送者
      result = `${this.isSendByMe ? '我' : this.sender.name}：${result}`;
    }
    return result;
  }
}

export default TextMsg;
