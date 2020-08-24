/**
 * 语音消息
 * @author yuanzeyu
 * @date 2019-05-09
 * @desc
 */
import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';

export interface AudioMsgConfig extends BaseMsgConfig {
  url: string;
  duration: number;
}

class AudioMsg extends BaseMsg {
  public readonly url: string; // 语音url
  public readonly duration: number; // 语音时长
  public isUnPlayed: boolean = false; // 是未播放过的语音
  public content: string;

  constructor(config: AudioMsgConfig) {
    super(config);
    this.url = config.url;
    this.duration = config.duration;
    this.content = config.url ? '':LabelEnum.DECRYPTO_LABEL
  }

  public getListLabel(isGroup: boolean): string {
    let result: string = LabelEnum.AUDIO_LABEL;
    if (isGroup) { // 群消息加发送者
      result = `${this.isSendByMe ? '我' : this.sender.name}：${result}`;
    }
    return result;
  }
}

export default AudioMsg;
