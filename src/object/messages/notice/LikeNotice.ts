import BaseMsg, {BaseMsgConfig} from '@/object/messages/BaseMsg';
import {LabelEnum} from '@/config/config-enum';


export interface LikeNoticeConfig extends BaseMsgConfig {
    // content: string;
  }


class LikeNotice extends BaseMsg {

  constructor(config: LikeNoticeConfig) {
    super(config);
  }
    public getListLabel(): string {
        return `${LabelEnum.NOTIFY_LABEL}点赞`;
      }
}

export default LikeNotice;
