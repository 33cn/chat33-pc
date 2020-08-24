
/**
 * 图片消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import BaseMsg, { BaseMsgConfig } from '@/object/messages/BaseMsg';
import { LabelEnum } from '@/config/config-enum';
import {UserLoggedInfo} from '@/scripts/object'

export interface ImageMsgConfig extends BaseMsgConfig {
  url: string;
  width: number;
  height: number;
  unenc?: string
}

class ImageMsg extends BaseMsg {
  public readonly url: string;
  public readonly width: number;
  public readonly height: number;
  public readonly unenc?: string;
  
  constructor(config: ImageMsgConfig) {
    super(config);
    this.url = config.url;
    this.width = config.width;
    this.height = config.height;
    this.unenc = config.unenc || undefined;
  }

  public getListLabel(isGroup: boolean): string {
    let result: string = LabelEnum.IMAGE_LABEL;
    if (isGroup) { // 群消息加发送者
      result = `${this.isSendByMe ? '我' : this.sender.name}：${result}`;
    }
    return result;
  }
}

export default ImageMsg;
