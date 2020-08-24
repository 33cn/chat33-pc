export enum TableName {
  GroupChatLog = 'groupChat',
  FriendChatLog = 'friendChat',
  Account = 'Account',
  GroupKey = 'GroupKey',
  ChatSyncRecord = 'ChatSyncRecord'
}

export enum ErrorMsg {
  LOAD_CHECK = '验证码加载失败',
  LOGIN_WRONG = '账号或密码错误',
  UNKNOWN_ERR = '未知异常',
  SOCKET_TIMEOUT = '发送消息超时', // 发送消息
  CONNECT_ERROR = '网络异常', // 请求网络错误提示语
  GET_CHECK_FAIL = '获取验证码失败，请重试',
  CREATE_SCRIPT_FAIL = '验证码创建失败，请重试',
  OSS_UPLOAD_FAIL = '文件上传失败，请重试',
  OVER_IMAGE_LIMIT = '一次只能发送9张图片',
  OVER_FILE_LIMIT = '一次只能发送9个文件',
  OVER_VIDEO_LIMIT = '一次只能发送9个视频',
  OVER_SELECT_LIMIT = '最多选择50条消息',
  ADD_ANSWER_WRONG = '答案不正确', // 添加好友回答问题错误
  CHART_PASSWORD_WRONG = '密聊密码不正确',
  CHART_OLD_PASSWORD_WRONG = '旧密码不正确',
  CHECK_OLD_PASSWORD_WRONG = '请输入8位-16位数字、字母或符号组合',
  CHECK_NEW_PASSWORD_WRONG = '请输入8位-16位数字、字母或符号组合的新密码',
  GET_GROUPKEY_FAIL = '获取群密钥失败',
  LOST_GROUPKEY = '群密钥丢失',
  PASSWORD_INCONSISTENT = '密聊密码不一致',
  MNUMONIC_WORD_ERROE = '助记词长度错误',
  ERROR_DECRYPTO = '无法解密的消息',
  ERROR_PASSWORD_STRUCTURE = '密码是字母和数字的组合'
}

// 交互成功提示语
export enum SuccessMsg {
  CREATE_GROUP = '创建群聊成功', // 建群
  ADD_FRIEND = '已发送添加好友申请，等待对方同意', // 发送加好友请求
  ADD_FRIEND_DIRECT = '添加成功', // 直接添加成功，对方无需验证
  JOIN_GROUP = '已成功提交入群申请，等待管理员审核', // 发送加群请求
  JOIN_GROUP_FORBIDDEN = '该群禁止加入', // 禁止加群
  DELETE_MEMBER = '移出群成员成功', // 管理员移出群成员
  ADD_MEMBER = '添加群成员成功', // 管理员添加群成员
  UPDATE_CHART_PASSWORD = '修改密聊密码成功' //修改密聊密码成功
}

export enum LabelEnum {
  AUDIO_LABEL = '[语音]',
  IMAGE_LABEL = '[图片]',
  VIDEO_LABEL = '[视频]',
  FILE_LABEL = '[文件]',
  PACKET_LABEL = '[红包]',
  NOTIFY_LABEL = '[通知]',
  SYSTEM_LABEL = '[公告]',
  SNAP_LABEL = '[阅后即焚]',
  RELAY_LABEL = '[聊天记录]',
  CUT_SCREEN = '对方在聊天中截图了',
  CUT_SCREEN_ME = '你在聊天中截图了',
  NOT_SUPPORT = '[暂不支持该消息类型]',
  PAY_LABEL = '[转账]转账给你',
  PAY_LABEL_MINE = '[转账]转账给对方',
  CHARGE_LABEL = '[收款]向你收款',
  CHARGE_LABEL_MINE = '[收款]向对方收款',
  DECRYPTO_LABEL = '无法解密的消息',
}

export enum ImageMaxSize {
  HEIGHT = 258,
  WIDTH = 258
}

export enum TimeConfig {
  SOCKET_RECONNECT = 2000,
  SOCKET_LOW_RECONNECT = 60000,
  SOCKET_RESEND_TIME = 3000,
  SOCKET_TIMEOUT_WAIT = 10000, // 发送消息超过此时间未收到回调触发失败
  NOTIFY_POP_TIME = 4000, // 通知小弹窗的持续时间
  // MEMBER_COUNT_LOAD = 20000, // 群或聊天室人数重载间隔
  GROUP_NOTIFY_POP = 2 * 60 * 1000 // 群公告顶部通知持续时间
}

export enum NotifyEnum { // todo 改为const?
  PACKET_MSG = '[你收到了一个红包，请在手机上查看]',
  PAY_MSG = '[你收到了一笔转账，请在手机上查看]',
  PAY_MSG_MINE = '[你转账给对方，请在手机上查看]',
  CHARGE_MSG = '[你收到了一笔收款，请在手机上查看]',
  CHARGE_MSG_MINE = '[你向对方收款，请在手机上查看]'
}

export enum MessageStatus { // todo 应用内枚举提出文件
  Sending,
  Success,
  Fail
}

export enum SocketEvent {
  ChatMsg,
  MultiMsg, // 批量推送消息（离线或同步）
  JoinNewGroup, // 入群通知 自己创建了群/被拉入群/入群申请同意
  RemoveGroup, // 主动退群了/被踢出群了
  DeleteGroup, // 群解散了
  GroupOnlineCount, // 更新群在线人数
  AddApply, // 添加好友或群申请或回复
  DeleteFriend, // 删除好友
  LogOff, // 在其他端登录
  MutedGroup, // 禁言、解除禁言通知
  BanUser, // 封号
  BanGroup, // 封群
  OnSyncGroupKey, //同步群秘钥
  ChangePublicKey, //更新用户公钥
  SyncGroupKeySuccess //同步群密钥成功
}

export enum TargetEnum { // 用于数据库key
  Friend = 'friend',
  Group = 'group'
}

export const defaultImage = {
  Group: require('../assets/room_header.svg'),
  Friend: require('../assets/user_header.svg')
};

export enum FormLimit {
  Msg = 6000,
  SnapMsg = 500,
  Name = 20,
  GroupNotify = 50,
  SelectMsgCount = 50, // 最多转发多少消息
  NotePicture = 3, // 图片备注限制
  NoteDesc = 400, // 描述备注字数限制
  NoteTel = 5 // 备注手机号数量
}

export const GET_LOG_COUNT = 20; // 一次加载多少条聊天记录

export const DELETE_REMAIN_COUNT = 20; // 清除缓存时每个用户保留多少条消息

export const REVOKE_TIME_LIMIT = 10 * 60 * 1000; // 撤回消息时间限制

export const GET_NOTIFY_COUNT = 20; // 一次加载多少条群公告

export const IMAGE_SEND_LIMIT = 9; // 最多一次发送多少张图片
export const FILE_SEND_LIMIT = 9; // 最多一次发送多少个文件
export const VIDEO_SEND_LIMIT = 9; // 最多一次发送多少个视频

export const FILE_SIZE_LIMIT = 100 * 1024 * 1024; // 文件大小限制100m

export enum LocalStorageUsage { // localStorage 键名
  LatestMsgTime = 'latestMsgTime', // 收到消息更新该数据
  LogTelList = 'logTelList', // 新登录手机号下拉列表
  LatestGroupKeyTime = 'latestGroupKeyTime', // 收到群密钥更新该数据
}

// 上传图片类型限制
export const ImageTypeLimit = ['image/png', 'image/jpeg', 'image/jpg'];
