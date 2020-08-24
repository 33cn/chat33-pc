/**
 * 逐条转发的图片消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */

import ImageMsg, {ImageMsgConfig} from '@/object/messages/ImageMsg';
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {
  RelayType,
  ChannelType
} from "@/config/const-enums";
import {UserLoggedInfo} from '@/scripts/object';

export interface RelayImageMsgConfig extends ImageMsgConfig {
  singleRelayFromName: string;
  isRelayFromGroup: boolean;
  forwardType: RelayType;
  fromId: string;
  fromName: string;
  channelType: ChannelType;
  imageUrl:string;
}

class RelayImageMsg extends ImageMsg {
  public readonly singleRelayFromName: string;
  public readonly isRelayFromGroup: boolean;
  public readonly forwardType: RelayType;
  public readonly fromId: string;
  public readonly fromName: string;
  public readonly channelType: ChannelType;
  public imageUrl:string;

  constructor(config: RelayImageMsgConfig) {
    super(config);
    this.singleRelayFromName = config.singleRelayFromName;
    this.isRelayFromGroup = config.isRelayFromGroup;
    this.forwardType = config.forwardType;
    this.fromId = config.fromId;
    this.fromName = config.fromName;
    this.channelType = config.channelType;
    this.imageUrl =  config.imageUrl;

  }
}

export default RelayImageMsg;
