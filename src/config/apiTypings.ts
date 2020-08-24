import { UserLoggedInfo } from '@/scripts/object';
import {
  AddFriendEnable, ApplyStatus,
  Bool,
  ChannelType,
  EventType, IsSnap, JoinGroupAuthority,
  MsgType,
  NewChannelType, RecordPermission,
  RelayType,
  UserLevel,
  VerifiedEnum
} from '@/config/const-enums';

export interface RelayMsg { // 转发消息的消息内容结构
  channelType: ChannelType;
  forwardType: RelayType;
  fromId: string;
  fromName: string;
  forwardUserName: string; // 转发人的名称
  data: RelayMsgItem[];
}

export interface RelayMsgItem {
  datetime: number;
  logId: string;
  msgType: MsgType;
  msg: any; // 多种类型暂未定义
  senderInfo: SenderInfo;
}

export interface SenderInfo {
  nickname: string;
  avatar: string;
}

export interface Praise {
  like:number;
  reward:number;
  state:number; //0没有状态，1点赞，2打赏，3点赞又打赏 
}

// RELAY_MSG 转发消息参数
export interface RelayMsgParam {
  sourceId: string;
  type: NewChannelType;
  forwardType: RelayType;
  logArray: string[];
  targetRooms: string[];
  targetUsers: string[];
}

export interface UserLogin { // api:TOKEN_LOGIN回参
  account: string;
  id: string;
  uid: string;
  user_level: UserLevel;
  avatar: string;
  username: string;
  verified: VerifiedEnum;
  firstLogin: boolean;
}

// 消息记录/文件列表相关接口
export interface MessageListResult {
  logs: ApiMsg[];
  nextLog: string;
}

// 聊天消息项
export interface ApiMsg {
  eventType?: EventType;
  msgId?: string;
  channelType: ChannelType;
  fromId: string;
  targetId: string;
  datetime: number;
  logId: string;
  msgType: MsgType;
  msg: any; // 定义msg type
  senderInfo: SenderInfo;
  isSnap: IsSnap;
  praise: Praise;
}

export interface SenderInfo {
  nickname: string;
  avatar: string;
}

export interface SearchUserInfo { // api:SEARCH_FRIEND_GROUP userInfo
  id: string;
  name: string;
  avatar: string;
  position: string;
  remark: string;
  needConfirm: Bool;
  needAnswer: Bool;
  question: string;
  uid: string;
}

export interface SearchRoomInfo { // api: SEARCH_FRIEND_GROUP roomInfo
  id: string;
  markId: string;
  name: string;
  avatar: string;
  canAddFriend: AddFriendEnable;
  joinPermission: JoinGroupAuthority;
  recordPermission: RecordPermission;
  memberNumber: number;
  managerNumber: number;
  systemMsg: any; // 忽略
}

export interface SearchTarget {
  type: NewChannelType;
  roomInfo?: SearchRoomInfo;
  userInfo?: SearchUserInfo;
}

export interface ApplyList { // GET_APPLY_LIST 申请记录
  applyList: ApplyItem[];
  totalNumber: number;
  nextId: string;
}

export interface ApplyItem { // GET_APPLY_LIST applyList
  senderInfo: ApplyUserInfo;
  receiveInfo: ApplyUserInfo;
  id: string;
  type: NewChannelType;
  applyReason: string;
  status: ApplyStatus;
  datetime: number;
  source: string;
}

export interface ApplyUserInfo { // GET_APPLY_LIST 发送者/接受者信息
  id: string;
  name: string;
  avatar: string;
  position: string;
}

// FRIEND_FILE_LIST param
export interface FileListParam {
  id: string;
  startId: string;
  number: number;
  query: string;
  owner: string;
}

// FRIEND_PHOTO_LIST param
export interface PicVideoListParam {
  id: string;
  startId: string;
  number: number;
}

export interface UserLoggedInfoParam {
  id?: string;
  account?: string;
  uid?: string;
  avatar?: string;
  userLevel?: number;
  username?: string;
  verified?: number;
  position?: string;
  firstLogin?: boolean;
  publicKey?: string;
  privateKey?: string;
  [propName:string]:any;
}

export interface TargetParam {
  id: string;
  name?: string;
  avatar?: string;
  isTop?: boolean;
  me?: UserLoggedInfo;
  publicKey?: string;
}

export interface FriendParam extends TargetParam {
  position?: string;
  often?: boolean;
  muted?: boolean;
  remark?: string;
  uid?: string;
  [propName:string]:any;
}

export interface GroupParam extends TargetParam {
  markId?: string;
  muted?: boolean;
  banEndTime?: number;
  encrypt?: number; //是否是加密群
  [propName:string]:any;
}

export interface groupKeyParam {
  KEY_ID: string;
  KEY: string;
  GROUP_ID: string;
}

export interface BackspaceEvent {
  target: HTMLTextAreaElement;
}