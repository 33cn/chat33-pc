/**
 * 阅后即焚图片消息
 * @author yuanzeyu
 * @date 2019-05-10
 * @desc
 */
import ImageMsg, {ImageMsgConfig} from '@/object/messages/ImageMsg.ts';
import {LabelEnum} from '@/config/config-enum';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import {post} from '@/plugins/axios-plugin';
import URLS from '@/config/urls';
import {NewChannelType} from '@/config/const-enums';

export interface SnapImageMsgConfig extends ImageMsgConfig {
  temp: string;
}

class SnapImageMsg extends ImageMsg {
  public static SNAP_COUNT = 30;
  public isLocked: boolean = true;
  public isUnLockByLocal: boolean = false; // 是又本端主动解开
  public snapCount: number = 0;
  public snapTimer: any = null;

  constructor(config: SnapImageMsgConfig) {
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
    this.snapCount = SnapImageMsg.SNAP_COUNT;
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
}

export default SnapImageMsg;
