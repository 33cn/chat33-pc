/**
 * 逐条转发的基础消息
 * @author zhoudi
 * @date 2019-11-29
 * @desc
 */

export interface BaseRelayMsgConfig  {
  singleRelayFromName: string;
  isRelayFromGroup: boolean;
}

abstract class BaseRelayMsg {
    public readonly singleRelayFromName: string;
  public readonly isRelayFromGroup: boolean;

  constructor(config: BaseRelayMsgConfig) {
    this.singleRelayFromName = config.singleRelayFromName;
    this.isRelayFromGroup = config.isRelayFromGroup;
  }
}

export default BaseRelayMsg;