/**
 * 阅后即焚语音消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import AudioMsg, {AudioMsgConfig} from '@/object/messages/AudioMsg';
import {LabelEnum} from '@/config/config-enum';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import {post} from '@/plugins/axios-plugin';
import URLS from '@/config/urls';
import {NewChannelType} from '@/config/const-enums';

export interface SnapAudioMsgConfig extends AudioMsgConfig {
  temp: string;
}

class SnapAudioMsg extends AudioMsg {
  public isLocked: boolean = true;
  public isUnLockByLocal: boolean = false; // 是又本端主动解开
  public snapCount: number = 0;
  public snapTimer: any = null;

  constructor(config: SnapAudioMsgConfig) {
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
    this.snapCount = 10;
    post(URLS.READ_SNAP, {
      logId: this.id,
      type: target instanceof Group ? NewChannelType.Group : NewChannelType.Friend
    }).then((data: any) => {
      if (data) {
        this.isLocked = false;
      } else {
        this.isUnLockByLocal = false;
      }
    });
  }

  /**
   * 开始倒计焚毁消息
   */
  public startSnapCount(target: Group | Friend) {
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
   * 取消计时焚毁(用于重新播放语音)
   */
  public cancelSnapCount() {
    this.endSnapCount();
    this.snapCount = 10;
  }

  private endSnapCount() {
    if (this.snapTimer) {
      clearInterval(this.snapTimer);
    }
    this.snapTimer = '';
  }

}

export default SnapAudioMsg;
