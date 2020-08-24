/**
 * 红包消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';

export interface PacketMsgConfig extends BaseMsgConfig {
  packetNote: string; // 红包备注
}

class PacketMsg extends BaseMsg {
  public packetNote: string;

  constructor(config: PacketMsgConfig) {
    super(config);
    this.packetNote = config.packetNote;
  }

  public getListLabel(isGroup: boolean): string {
    let result: string = this.packetNote ? `${LabelEnum.PACKET_LABEL}${this.packetNote}` : '';
    if (isGroup) { // 群消息加发送者
      result = `${this.isSendByMe ? '我' : this.sender.name}：${result}`;
    }
    return result;
  }
}

export default PacketMsg;
