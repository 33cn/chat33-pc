/**
 * 逐条转发的视频消息
 * @author zhoudi
 * @date 2019-11-29
 * @desc
 */
import VideoMsg, {VideoMsgConfig} from '@/object/messages/VideoMsg';
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {
  RelayType,
  ChannelType
} from "@/config/const-enums";
import {UserLoggedInfo} from '@/scripts/object'

export interface RelayVideoMsgConfig extends VideoMsgConfig {
  singleRelayFromName: string;
  isRelayFromGroup: boolean;
  forwardType: RelayType;
  fromId: string;
  fromName: string;
  channelType: ChannelType;
  time: string;
  mediaUrl: string
}

class RelayVideoMsg extends VideoMsg {
  public readonly singleRelayFromName: string;
  public readonly isRelayFromGroup: boolean;
  public readonly forwardType: RelayType;
  public readonly fromId: string;
  public readonly fromName: string;
  public readonly channelType: ChannelType;
  public time: string;//转发的时间
  public mediaUrl: string

  constructor(config: RelayVideoMsgConfig) {
    super(config);
    this.singleRelayFromName = config.singleRelayFromName;
    this.isRelayFromGroup = config.isRelayFromGroup;
    this.forwardType = config.forwardType;
    this.fromId = config.fromId;
    this.fromName = config.fromName;
    this.channelType = config.channelType;
    this.time = config.time,
    this.mediaUrl = config.mediaUrl
  }
}

export default RelayVideoMsg;
