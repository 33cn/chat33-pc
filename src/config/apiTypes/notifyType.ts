/**
 * @name 通知类消息（灰底文字）
 * @author yuanzeyu
 * @date 2019-04-11
 * @desc msgType6的消息msg
 */
export enum NotifyType { // todo 更新到所有通知不适用content
  RevokeMsg = 1, // 撤回消息
  CreateGroup = 2, // 创建群聊
  ExitGroup = 3, // 退出群聊
  Kickout = 4, // 移除群聊
  Join = 5, // 加入群聊
  Delete = 6, // 解散群聊
  AddFriendGroup = 7, // 群中添加好友
  DelFriend = 8, // 删除好友
  NewOwner = 9, // 成为群主
  NewManager = 10, // 设为管理员
  NewName = 11, // 更改群名
  GetPacket = 12, // 领取红包
  AddFriendPersonal = 13, // 群外添加好友
  GroupMouted = 14, // 群禁言
  MsgSnaped = 15, // 消息焚毁 [无需显示]
  ScreenCut = 16, // 对方截屏
  JoinGroup = 17, // 邀请加入群聊
  ReceivePay = 18, // 收款成功
  likeAndReward = 22 // 赞赏通知
}

/**
 * 收款成功通知的消息体（msg）
 */
export interface ReceivePay {
  type: NotifyType.ReceivePay;
  operator: string;
  logId: string;
  recordId: string;
}
