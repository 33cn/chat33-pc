/**
 * 逐条转发的文本消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import TextMsg, {TextMsgConfig} from '@/object/messages/TextMsg';
import {
  RelayType,
  ChannelType
} from "@/config/const-enums";
import {UserLoggedInfo} from '@/scripts/object'

export interface RelayTextMsgConfig extends TextMsgConfig {
  singleRelayFromName?: string;
  isRelayFromGroup?: boolean;
  forwardType: RelayType;
  fromId: string;
  fromName: string;
  channelType: ChannelType;
}

class RelayTextMsg extends TextMsg {
  public readonly singleRelayFromName?: string;
  public readonly isRelayFromGroup?: boolean;
  public readonly forwardType: RelayType;
  public readonly fromId: string;
  public readonly fromName: string;
  public readonly channelType: ChannelType;

  constructor(config: RelayTextMsgConfig) {
    super(config);
    this.singleRelayFromName = config.singleRelayFromName;
    this.isRelayFromGroup = config.isRelayFromGroup;
    this.forwardType = config.forwardType;
    this.fromId = config.fromId;
    this.fromName = config.fromName;
    this.channelType = config.channelType;
  }
}

export default RelayTextMsg;
