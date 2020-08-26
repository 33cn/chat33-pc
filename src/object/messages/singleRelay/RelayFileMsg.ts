/**
 * 逐条转发的文件消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import FileMsg, {FileMsgConfig} from '@/object/messages/FileMsg';
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {
  RelayType,
  ChannelType
} from "@/config/const-enums";
import {UserLoggedInfo} from '@/scripts/object'

export interface RelayFileMsgConfig extends FileMsgConfig {
  singleRelayFromName: string;
  isRelayFromGroup: boolean;
  forwardType: RelayType;
  fromId: string;
  fromName: string;
  channelType: ChannelType;
  fileUrl: string;
  fileSize: string;
}

class RelayFileMsg extends FileMsg {
  public readonly singleRelayFromName: string;
  public readonly isRelayFromGroup: boolean;
  public readonly forwardType: RelayType;
  public readonly fromId: string;
  public readonly fromName: string;
  public readonly channelType: ChannelType;
  public fileUrl: string;
  public fileSize: string;
  
  constructor(config: RelayFileMsgConfig) {
    super(config);
    this.singleRelayFromName = config.singleRelayFromName;
    this.isRelayFromGroup = config.isRelayFromGroup;
    this.forwardType = config.forwardType;
    this.fromId = config.fromId;
    this.fromName = config.fromName;
    this.channelType = config.channelType;
    this.fileUrl = config.fileUrl;
    this.fileSize = config.fileSize;
  }
}

export default RelayFileMsg;
