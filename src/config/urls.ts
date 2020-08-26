/**
 * @Author: yuanzeyu
 * @Date: 2018/10/9
 * @Desc: api url 配置
 */
const BASE_URL = process.env.VUE_APP_API as string; // 当前聊天服务根地址
const TG_BASE_URL = process.env.VUE_APP_USERAPI as string; // 托管地址

const URLS: any = {
  // 用户相关
  TOKEN_LOGIN: '/user/tokenLogin', // 用户登录
  EDIT_USER_HEADER: '/user/editAvatar', // 用户编辑头像
  EDIT_USER_NAME: '/user/editNickname', // 用户修改昵称
  GET_APPLY_LIST: '/chat33/applyList', // 获取群/好友申请记录
  SEARCH_FRIEND_GROUP: '/chat33/search', // 精确搜索用户/群
  GET_USER_INFO: '/user/userInfo', // 获取用户信息
  GET_APPLY_COUNT: '/chat33/unreadApplyNumber', // 获取未处理申请总数
  REVOKE_MSG: '/chat33/RevokeMessage', // 撤回消息
  READ_SNAP: '/chat33/readSnapMsg', // 阅读了阅后即焚的消息
  RELAY_MSG: '/chat33/forward', // 转发聊天记录
  RELAY_ENC_MSG: '/chat33/encryptForward', //加密消息转发
  SET_NEED_REPLAY: '/friend/confirm', // 设置加好友是否需要验证
  SET_ADD_QUESTION: '/friend/question', // 加好友回答问题设置
  UPLOAD_SECRET_KEY: '/chat33/uploadSecretKey',//上传加密的助记词
  // 群相关
  GET_GROUP_LIST: '/room/list', // 获取群列表
  GET_GROUP_INFO: '/room/info', // 获取群信息
  GET_GROUP_MEMBER: '/room/userList', // 获取群成员列表
  CREATE_GROUP: '/room/create', // 创建群
  DELETE_GROUP: '/room/delete', // 删除群
  QUIT_GROUP: '/room/loginOut', // 退出群
  APPLY_JOIN_GROUP: '/room/joinRoomApply', // 申请加入群
  MANAGE_GROUP: '/room/setPermission', // 管理员设置群
  SET_MUTED_LIST: '/room/setMutedList', // 群设置禁言列表
  SET_SINGLE_MUTED: '/room/setMutedSingle', // 单个成员禁言设置
  SET_GROUP_LEVEL: '/room/setLevel', // 群内用户身份设置 no
  SET_GROUP_MUTED: '/room/setNoDisturbing', // 群成员设置免打扰
  SET_MEMBER_NICKNAME: '/room/setMemberNickname', //  群成员设置昵称
  INVITE_JOIN_GROUP: '/room/joinRoomInvite', // 邀请入群申请
  DELETE_GROUP_MEMBER: '/room/kickOut', // 移除群成员
  REPLY_JOIN_GROUP: '/room/joinRoomApprove', // 入群申请回复
  GROUP_APPLY_LIST: '/room/joinInRoomApplyList', // 获取入群申请列表
  GROUP_CHAT_LOG: '/room/chatLog', // 获取群消息记录
  GET_GROUP_UNREAD: '/room/unread', // 获取所有群未读消息统计
  GET_MEMBER_INFO: '/room/userInfo', // 获取群成员信息
  SEARCH_MEMBER: '/room/searchMember', // 搜索群成员
  SET_GROUP_TOP: '/room/stickyOnTop', // 设置群置顶
  GET_GROUP_COUNT: '/room/getOnlineNumber', // 获取群在线人数
  EDIT_GROUP_NAME: '/room/setName', // 编辑群名称
  ADD_GROUP_NOTIFY: '/room/sendSystemMsgs', // 发布群公告
  GET_GROUP_NOTIFY: '/room/systemMsgs', // 获取群公告记录
  SET_GROUP_AVATAR: '/room/setAvatar', // 设置群头像
  GROUP_FILE_LIST: '/room/historyFiles', // 群文件列表
  GROUP_PHOTO_LIST: '/room/historyPhotos', // 群聊天记录中的图片/视频列表
  // 好友相关
  GET_FRIEND_LIST: '/friend/list', // 获取好友列表
  ADD_FRIEND_APPLY: '/friend/add', // 添加好友申请
  DELETE_FRIEND: '/friend/delete', // 删除好友
  ADD_FRIEND_REPLY: '/friend/response', // 好友申请处理
  FRIEND_APPLY_LIST: '/friend/requestList', //  获取好友申请列表
  FRIEND_CHAT_LOG: '/friend/chatLog', // 获取好友消息记录
  SET_FRIEND_REMARK: '/friend/setRemark', // 修改好友备注
  SET_FRIEND_MUTED: '/friend/setNoDisturbing', // 设置免打扰
  SET_FRIEND_TOP: '/friend/stickyOnTop', // 设置消息置顶
  GET_FRIEND_UNREAD: '/friend/unread', // 获取所有好友未读消息统计
  SET_DETAIL_NOTE: '/friend/setExtRemark', // 修改好友详细备注
  FRIEND_FILE_LIST: '/friend/historyFiles', // 好友文件列表
  FRIEND_PHOTO_LIST: '/friend/historyPhotos', // 好友
  // 通用
  DELETE_FILE_MSG: '/chat33/RevokeFiles', // 批量撤回文件消息
  START_LOG: '/open', // 启动埋点
  PRAISE_LIKE: '/praise/like', //点赞
  PRAISE_LIST:'/praise/list',  //赞赏历史列表
  PRAISE_DETAIL:'/praise/details',//赞赏详情
  PRAISE_DETAIL_LIST:'/praise/detailList',//赞赏详情列表
  
  // 找币登录注册相关

  // 托管账户
  TG_SEND_MSG: '/v1/send/sms', // 发送短信验证码
  TG_SEND_VOICE: '/v1/send/voice', // 发送语音验证码
  TG_CHECK_REG: '/v1/user/is-reg', // 查询是否已注册
  TG_USER_LOGIN: '/v1/user/login', // 登录托管账户
  TG_USER_REG: '/v1/user/reg', // 注册托管账户
  // socket
  SOCKET_URL: '/ws/' // socket地址
};

Object.keys(URLS).forEach((item) => {
  if (item.indexOf('TG') === 0) {
    URLS[item] = `${TG_BASE_URL}${URLS[item]}`;
  } else if (item.indexOf('SOCKET') === 0) { // 聊天服务socket
    URLS[item] = `ws://${BASE_URL}${URLS[item]}`;
  } else { // 聊天服务请求
    URLS[item] = `http://${BASE_URL}${URLS[item]}`;
  }
});

export default URLS;
