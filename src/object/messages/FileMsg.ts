import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';
import {UserLoggedInfo} from '@/scripts/object'

/**
 * 文件消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */

export interface FileMsgConfig extends BaseMsgConfig {
  url: string;
  size: number;
  md5: string;
  fileName: string;
}

class FileMsg extends BaseMsg {
  public url: string;
  public readonly size: number;
  public md5: string;
  public readonly fileName: string;
  public loadedSize: number = 0; // 已上传或下载的大小byte
  public content: string;

  constructor(config: FileMsgConfig) {
    super(config);
    this.url = config.url;
    this.size = config.size;
    this.md5 = config.md5;
    this.fileName = config.fileName;
    this.content = config.url ? '':LabelEnum.DECRYPTO_LABEL
  }

  public getListLabel(isGroup: boolean): string {
    let result: string = LabelEnum.FILE_LABEL;
    if (isGroup) { // 群消息加发送者
      result = `${this.isSendByMe ? '我' : this.sender.name}：${result}`;
    }
    return result;
  }
}

export default FileMsg;
