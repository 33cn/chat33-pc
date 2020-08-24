import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {RelayMsg} from '@/config/apiTypings';
import {LabelEnum} from '@/config/config-enum';

/**
 * 合并转发消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */

export interface MultiRelayMsgConfig extends BaseMsgConfig {
  relayContent: RelayMsg;
}

class MultiRelayMsg extends BaseMsg {
  public readonly relayContent: RelayMsg;
  public readonly content: string;

  constructor(config: MultiRelayMsgConfig) {
    super(config);
    this.relayContent = config.relayContent;
    this.content = (typeof(config.relayContent) === 'string') ? LabelEnum.DECRYPTO_LABEL:''
  }

  public getListLabel(isGroup: boolean): string {
    let result: string = LabelEnum.RELAY_LABEL;
    if (isGroup) { // 群消息加发送者
      result = `${this.isSendByMe ? '我' : this.sender.name}：${result}`;
    }
    return result;
  }


}

export default MultiRelayMsg;
