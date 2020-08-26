import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';
import {UserLoggedInfo} from '@/scripts/object'

/**
 * 视频消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */

export interface VideoMsgConfig extends BaseMsgConfig {
  url: string;
  width: number;
  height: number;
  duration: number;
}

class VideoMsg extends BaseMsg {
  public url: string;
  public readonly width: number;
  public readonly height: number;
  public readonly duration: number;
  public videoSize: number = 0; // 视频文件大小
  public loadedSize: number = 0; // 已下载大小
  public readonly content: string;

  constructor(config: VideoMsgConfig) {
    super(config);
    this.url = config.url;
    this.width = config.width;
    this.height = config.height;
    this.duration = config.duration;
    this.content = config.url ? '':LabelEnum.DECRYPTO_LABEL
  }

  public getListLabel(isGroup: boolean): string {
    let result: string = LabelEnum.VIDEO_LABEL;
    if (isGroup) { // 群消息加发送者
      result = `${this.isSendByMe ? '我' : this.sender.name}：${result}`;
    }
    return result;
  }
}

export default VideoMsg;
