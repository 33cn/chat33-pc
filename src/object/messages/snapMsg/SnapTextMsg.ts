/**
 * 阅后即焚文字消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import TextMsg, {TextMsgConfig} from '@/object/messages/TextMsg';
import {LabelEnum} from '@/config/config-enum';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import {post} from '@/plugins/axios-plugin';
import URLS from '@/config/urls';
import {NewChannelType} from '@/config/const-enums';

export interface SnapTextMsgConfig extends TextMsgConfig {
  temp: string;
}

class SnapTextMsg extends TextMsg {
  public isLocked: boolean = true;
  public isUnLockByLocal: boolean = false; // 是由本端主动解开
  public snapCount: number = 0;
  public snapTimer: any = null;

  constructor(config: SnapTextMsgConfig) {
    super(config);
  }

  public getListLabel(isGroup: boolean): string {
    let result: string = LabelEnum.SNAP_LABEL;
    if (isGroup) { // 群消息加发送者
      result = `${this.isSendByMe ? '我' : this.sender.name}：${result}`;
    }
    return result;
  }

  /**
   * 点击解除阅后即焚锁定
   */
  public unlockSnap(target: Group | Friend): void {
    this.isUnLockByLocal = true;
    this.snapCount = this.getSnapCount();
    post(URLS.READ_SNAP, {
      logId: this.id,
      type: target instanceof Group ? NewChannelType.Group : NewChannelType.Friend
    }).then((data: any) => {
      if (data) {
        this.isLocked = false;
        this.startSnapCount(target);
      } else {
        this.isUnLockByLocal = false;
      }
    });
  }

  /**
   * 开始倒计焚毁消息
   */
  private startSnapCount(target: Group | Friend) {
    this.snapTimer = setInterval(() => {
      this.snapCount -= 1;
      if (this.snapCount === 0) { // 到0：结束计时、删除消息
        clearInterval(this.snapTimer);
        this.snapTimer = '';
        target.deleteLocalMessage(this.id,target instanceof Group);
      }
    }, 1000);
  }

  /**
   * 根据字数获取倒计时时长
   */
  private getSnapCount() {
    const len = this.content.length;
    return len < 20 ? 10 : len % 50 === 0 ? Math.ceil(len + 1 / 50) * 30 : Math.ceil(len / 50) * 30;
  }

}

export default SnapTextMsg;
