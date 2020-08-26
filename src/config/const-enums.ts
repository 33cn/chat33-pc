// 与接口相关的枚举
export enum Encrypt {
  YES =1, //加密
  NO  //不加密
}

export enum RoomStatus { // 聊天室开启状态
  open = 1, // 开启
  closed, // 关闭
  All // 全部
}

export enum Muted { // 聊天室免打扰是否开启
  YES = 1, // 开启免打扰
  No // 无免打扰
}

export enum UserLevel { // 用户等级 暂无用
  Visitor,
  User,
  Manager
}

export enum VerifiedEnum {
  Yes = 1, // 已实名
  No // 未实名
}

export enum Usage { // 好友是否常用(接口入参)
  Normal = 1, // 普通
  Often, // 常用
  All // 全部
}

export enum TopStatus { // 是否置顶 todo 移除
  Yes = 1, // 不置顶
  No // 置顶
}

export enum MsgType {
  System = 0, // 群公告
  Text = 1, // 文字消息
  Audio = 2, // 语音消息
  Picture = 3, // 图片消息
  Packet = 4, // 红包消息
  Video = 5, // 视频消息
  Notify = 6, // 系统通知消息（灰字通知）
  RelayMsg = 8, // 转发消息
  File = 9, // 文件消息
  Pay = 10, // 转账
  Charge = 11, // 收款
  Invite =12  //邀请入群卡片
}

export enum EventType { // socket event_type 接口文档未完成
  ChatMsg = 0, // 聊天消息
  MultiChatMsg = 40, // 批量推送聊天消息
  CloseSocket = 9, // 关闭socket, 不再尝试重连
  BanUser = 10, // 封号通知
  BanGroup = 11, // 封群通知
  JoinGroup = 20, // 入群通知
  QuitGroup = 21, // 移除群（主动或被提出群）
  DeleteGroup = 22, // 解散群通知
  GroupApply = 23, // 入群申请或回复
  GroupOnlineCount = 24, // 群在线人数更新
  MutedGroup = 25, // 在群中被禁言/解禁
  ActiveChangeGroupKey = 26,//更新群会话秘钥 c -> s
  ActiveSyncGroupKey = 27,//主动同步群会话密钥 c -> s
  SyncGroupKey = 28,//同步群会话密钥  s -> c
  SyncGroupKeySuccess = 29,//同步群会话密钥成功 s -> c
  FriendApply = 31, // 添加好友申请或回复
  DeleteFriend = 32, // 删除了好友
  ChangePublic = 33, //更新用户公钥 C->S
  ReceChangePublic = 34, //更新用户公钥 S->C   
  MultiUnreadMsg = 41, // 未读消息批量推送
  StartSync  = 42, // 开始同步
  OnEndSync = 43, // 同步完成
  RelaySync = 44, // 批量推动转发
  ChangeMnemonic = 35,//更新助记词
}

export enum ChannelType { // 聊天消息所属的对象类型
  Group = 2, // 群
  Friend = 3 // 好友
}

export enum NewChannelType { // [REVOKE_MSG type]
  Group = 1,
  Friend
}

export enum ApplyStatus { // 申请状态
  Waiting = 1, // 等待验证
  Reject, // 已拒绝
  Pass // 已通过
}

export enum AgreeEnum { // 好友请求处理接口入参是否同意
  Pass = 1, // 同意
  Reject // 拒绝
}

export enum AddFriendEnable {
  Yes = 1, // 群内可以加好友
  No
}

export enum MemberType {
  Member = 1,
  Manager,
  Owner
}

export enum JoinGroupAuthority {
  NeedApproval = 1, // 无需审批直接进群
  Direct, // 需要审批
  Forbidden // 禁止加群
}

export enum MutedSet { // 群禁言设置
  NoMuted = 1, // 全员发言 （成员 mutedType 不采用）
  BlackList, // 黑名单
  WhiteList, // 白名单
  AllMuted // 全员禁言
}

export enum MemberMutedSet { // 群成员mutedType
  No = 1, // 不采用
  Black, // 黑名单
  White // 白名单
}

export enum ApiCode {
  Success
}

export enum QuitReasonType { // 退群通知socket type:退群原因
  ByMe = 1, // 主动
  ByOther // 被动
}

export const NO_NEXT_LOG = '-1'; // 聊天记录接口， '-1'表示无更多消息

//通知描述枚举
export enum MsgDetailType {
  Revoke = 1, // 撤回消息
  CreateGroup = 2, // 创建群聊
  ExitGroup = 3, // 退出群聊
  KickOutGroup = 4, // 移出群聊
  JoinGroup = 5, // 加入群聊
  DeleteGroup = 6, // 删除群聊
  AddFriendInGroup = 7, // 群内加好友
  DeleteFriend = 8, // 解除好友
  BecomeMaster = 9, // 成为群主
  BecomeManager = 10, // 成为管理员
  EditGroupName = 11, // 修改群名
  GetPacket = 12, // 领取红包
  AddFriend = 13, // 群外成为好友
  GroupMuted = 14, // 群禁言
  SnapRead = 15, // 阅后即焚消息对方已读
  CutScreen = 16, // 屏幕截了图
  InviteJoinGroup = 17, // 邀请加入群聊
  ReceivePay = 18, // 收款成功
  GroupKeyChanged = 19, //更新群密钥
  likeAndReward = 22 // 赞赏通知
}

export const FOREVER_TIME = 7258089600000; // 永久禁言时间

export enum IsSnap {
  yes = 1,
  no
}

export enum RelayType {
  Single = 1, // 逐条换发
  Multi // 合并转发
}

export enum RecordPermission { // api:GET_GROUP_INFO recordPermission
  All = 1,
  OnlyNew
}

export enum AddNeedReply { // api:SET_NEED_REPLAY tp 添加好友是否需要验证
  Yes = 1,
  No
}

export enum AddQuestionType {
  Edit, // 原本是需要，编辑问题/答案
  Open, // 设置需要
  Close // 设为不需要
}

export enum Bool { // 接口常用1是2否
  Yes = 1,
  No = 2
}

export enum SourceType { // api:ADD_FRIEND_APPLY sourceType 加好友来源类型
  NoSource = 5, // 无来源
  Search = 1, // 通过搜索
  Qr = 2, // 通过扫一扫
  Share = 3, // 通过分享
  Group = 4 // 通过群内
}

export enum AddFriendState { // api: ADD_FRIEND_APPLY data.state
  WrongAnswer = 1, // 回答问题错误
  Waiting = 2, // 发送成功等待对方回复
  DirectAdd = 3 // 直接添加成功
}

export enum CheckedMnc {
  ALLYES = 1,
  NOTLOCAL = 2,
  NOTREMOTE = 3,
  ALLNOT = 4
}