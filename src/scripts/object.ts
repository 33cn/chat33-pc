import  notify from '@/plugins/NotifyPop';
import {
  AddFriendEnable,
  Bool,
  ChannelType,
  EventType,
  FOREVER_TIME,
  IsSnap,
  JoinGroupAuthority,
  MemberMutedSet,
  MemberType,
  MsgDetailType,
  MsgType,
  MutedSet,
  NewChannelType,
  NO_NEXT_LOG,
  RecordPermission,
  UserLevel,
  VerifiedEnum,
  RelayType
} from '@/config/const-enums';
import { post } from '@/plugins/axios-plugin';
import URLS from '../config/urls';
import {
  defaultImage,
  ErrorMsg,
  FormLimit,
  GET_LOG_COUNT,
  LocalStorageUsage,
  MessageStatus,
  SocketEvent,
  TimeConfig
} from '@/config/config-enum';
import { UserLoggedInfoParam, FriendParam, GroupParam, ApiMsg, RelayMsg } from '@/config/apiTypings';
import { TableName } from '@/config/config-enum';
import { getApi2Message } from '@/scripts/common';
import { ipcRenderer } from 'electron';
import { NoteTel, PictureReaderProp } from '@/config/type';
import { showToast } from '@/plugins/Toast';
import { MessageType } from '@/object/messages';
import GroupAnnounce from '@/object/messages/GroupAnnounce';
import TextMsg from '@/object/messages/TextMsg';
import ImageMsg from '@/object/messages/ImageMsg';
import FileMsg from '@/object/messages/FileMsg';
import VideoMsg from '@/object/messages/VideoMsg';
import SnapTextMsg from '@/object/messages/snapMsg/SnapTextMsg';
import { generateSessionKey, encryptSymmetric, dencryptSymmetric, local2ApiMsg, formatDateString, updateLatestGroupKeyTime } from "@/utils/tool";
import { stringify } from 'querystring';
import Datasource from '@/scripts/data-source';
import AccountDao from "@/scripts/account-dao";
import MsgExDao from "@/scripts/msgEx-dao";
import GroupKeyDao from "@/scripts/groupKey-dao";
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';

// msgId 规则：`${Date.now()}${id}`

// todo 每个接口字段定义为枚举，使用枚举字段？

// todo 移除无用的字段
const defaultUserHeader = defaultImage.Friend; // tslint:disable-line
const defaultGroupHeader = defaultImage.Group; // tslint:disable-line


interface FileMsgApi { // todo 移至api type
  fileUrl: string;
  size: number;
  md5: string;
  name: string;
}

interface GetLogsResult {
  items: ApiMsg[];
  nextLog: string;
}

/**
 * 转账/收款消息msg
 * @desc (仅保存，实际没用)
 */
export interface PayMsg {
  coinName: string;
  amount: number;
  recordId: string;
}

interface VideoMsgApi { // todo 移至api type
  mediaUrl: string;
  time: number;
  width: number;
  height: number;
}

interface ImageMsgApi {
  url: string;
  width: number;
  height: number;
}

class GroupMember {
  public id: string;
  public name: string;
  public nameInGroup: string;
  public avatar: string;
  public type: MemberType;
  public mayNotMember: boolean; // 使用变量来区分是否是群成员
  public mutedEndTime: number; // 禁言结束时间
  public memberMutedSet: MemberMutedSet; // 该成员的禁言设置 临时成员无需考虑禁言设置
  public publicKey: string; //公钥

  public constructor(id: string = '', name: string = '', nameInGroup: string = '', avatar: string = '', type: MemberType = MemberType.Member, mayNotMember: boolean = false, mutedEndTime: number = 0,
    memberMutedSet: MemberMutedSet = MemberMutedSet.No, publicKey:string='') {
    this.id = id;
    this.name = name;
    this.nameInGroup = nameInGroup;
    this.avatar = avatar || defaultUserHeader;
    this.type = type;
    this.mayNotMember = mayNotMember;
    this.mutedEndTime = mutedEndTime;
    this.memberMutedSet = memberMutedSet;
    this.publicKey = publicKey;
  }
}

// 登录用户信息
class UserLoggedInfo {
  public id: string;
  public account: string;
  public uid: string;
  public avatar: string;
  public userLevel: UserLevel;
  public name: string;
  public verified: VerifiedEnum;
  public position: string;
  public isFirstLogin: boolean;
  public publicKey: string; //用户公钥
  public isLoggedUser: boolean = true;
  public needCheck: boolean = true; // 添加好友需要验证
  public needAnswer: boolean = false; // 添加好友需要回答问题
  public addQuestion: string = ''; // 问题
  public addAnswer: string = ''; // 答案
  public privateKey: string = ''; //用户助记词

  public constructor(props: UserLoggedInfoParam) {
    this.id = props.id || '';
    this.account = props.account || '';
    this.uid = props.uid || '';
    this.avatar = props.avatar || defaultUserHeader;
    this.userLevel = props.userLevel || 0;
    this.name = props.username || '';
    this.verified = props.verified || 0;
    this.position = props.position || '';
    this.isFirstLogin = props.firstLogin || false;
    this.publicKey = props.publicKey || '';
    this.privateKey = props.privateKey || ''
  }
}

interface SendChatMsgParam {
  channel: ChannelType;
  targetId: string;
  msg: MessageType; // todo 排除并不可能主动发送的消息类型？
  aitList: Array<string>;
  isSnap: boolean;
  failCb: (failMsg: string, code?: number) => void;
}

class MySocket { // 维护所有socket相关接口字段并集成断线重连(聊天消息字段和申请通知外部维护)
  public isSyncing: boolean = false;
  public accountDao: AccountDao;
  public groupKeyDao: GroupKeyDao;
  private callbackMap = new Map(); // todo 消息回调 发送消息时存入， 收到带msgId的消息移除
  private readonly url: string;
  private socket: WebSocket | null = null;
  private reconnectCount: number = 0;
  private blockReconnect: boolean = false;
  private eventMap = new Map();
  private _myInfo!: UserLoggedInfo;
  public callback: any;

  public constructor(url: string) {
    this.url = url;
    this.accountDao = new AccountDao(Datasource.getInstance());
    this.groupKeyDao = new GroupKeyDao(Datasource.getInstance());
  }

  public set myInfo(value:UserLoggedInfo) {
    this._myInfo = value;
  }

  public get myInfo() {
    return this._myInfo;
  }
  
  public set logback(cb:any) {
    this.callback = cb;
  }

  public init() {
    this.socket = new WebSocket(this.url);
    this.socket.onclose = (e: CloseEvent) => {
      if(e.code === 4011) {
        const reason = JSON.parse(e.reason)
        notify.fail({
          text: `你的账号于${formatDateString(reason.time)}在${reason.device}上更改了密聊密码，请重新登录`
        });
        this.blockReconnect = true;
        this.callback()
      }
      if (e.code !== 1000) {
        this.reconnect();
      }
    };
    this.socket.onerror = (e: any) => {
      if (e.code === 'ECONNREFUSED') {
        this.reconnect();
      }
    };
    this.socket.onmessage = (res) => {
      const data = JSON.parse(res.data);
      switch (data.eventType) {
        case EventType.ChatMsg: {
          if (data.code) { // 发送失败执行回调,成功回调由目标接受消息方法处理
            this.runCallback(data.msgId, data.content);
          } else {
            this.emitEvent(SocketEvent.ChatMsg, [data]);
          }
          break;
        }
        case EventType.MultiChatMsg: {
          this.emitEvent(SocketEvent.MultiMsg, [data.list, false]);
          break;
        }
        case EventType.MultiUnreadMsg: {
          this.emitEvent(SocketEvent.MultiMsg, [data.list, true]);
          break;
        }
        case EventType.JoinGroup:
          this.emitEvent(SocketEvent.JoinNewGroup, [data.roomId]);
          break;
        case EventType.QuitGroup: // 你退出了群
          this.emitEvent(SocketEvent.RemoveGroup, [data.roomId, data.type]);
          break;
        case EventType.DeleteGroup: // 群解散了
          this.emitEvent(SocketEvent.DeleteGroup, [data.roomId, data.userId]);
          break;
        case EventType.GroupOnlineCount:
          this.emitEvent(SocketEvent.GroupOnlineCount, [data.roomId, data.number]);
          break;
        case EventType.FriendApply:
          this.emitEvent(SocketEvent.AddApply, [data]);
          break;
        case EventType.DeleteFriend:
          this.emitEvent(SocketEvent.DeleteFriend, [data.receiveInfo.id, data.senderInfo.id]);
          break;
        case EventType.GroupApply:
          this.emitEvent(SocketEvent.AddApply, [data]);
          break;
        case EventType.CloseSocket:
          this.blockReconnect = true;
          this.emitEvent(SocketEvent.LogOff, [data.content]);
          break;
        case EventType.BanUser:
          this.emitEvent(SocketEvent.BanUser, [data.disableDeadline]);
          break;
        case EventType.BanGroup:
          this.emitEvent(SocketEvent.BanGroup, [data.roomId, data.disableDeadline]);
          break;
        case EventType.MutedGroup:
          this.emitEvent(SocketEvent.MutedGroup, [data.roomId]);
          break;
        case EventType.OnEndSync:
          this.isSyncing = false;
          break;
        case EventType.RelaySync:
          this.emitEvent(SocketEvent.MultiMsg, [data.list, true]);
          break;
        case EventType.ReceChangePublic:
          this.emitEvent(SocketEvent.ChangePublicKey, [data]);
          break;
        case EventType.SyncGroupKey: //接受到群秘钥推送
          this.emitEvent(SocketEvent.OnSyncGroupKey, [data.list]);
          break;  
        case EventType.SyncGroupKeySuccess:
          this.isSyncing = false;
          this.emitEvent(SocketEvent.SyncGroupKeySuccess, []);
          break;
        default:
          console.error('unexpected socket eventType');
      }
    };
    this.socket.onopen = () => {
      this.blockReconnect = false;
      this.reconnectCount = 0;
      const userInfo = JSON.parse(localStorage.getItem(`${this._myInfo.id}`) ||"null");
      const LatestMsgTime = LocalStorageUsage.LatestMsgTime;
      const LatestGroupKeyTime = LocalStorageUsage.LatestGroupKeyTime;

      this.sendStartSyncMsg(userInfo ? userInfo[LatestMsgTime] : 0);
      //本地第一次登录,传最大值获取全部群秘钥
      if(!userInfo){
        this.sendStratSyncGroupKey(Number.MAX_SAFE_INTEGER);
      }else if (userInfo[LatestGroupKeyTime]){
        this.sendStratSyncGroupKey(userInfo[LatestGroupKeyTime]);
      }else if (!userInfo[LatestGroupKeyTime]){
        return 
      }
    };
  }
  /**
   * 更新公钥
   */
  public sendKey(publicKey: string) {
    const socket = this.socket as WebSocket;
    const sendData = () => {
      this.sendData({
        eventType: EventType.ChangePublic,
        publicKey: publicKey
      });
    }
    if (socket.readyState !== 1) {
      socket.close();
      this.reconnect();
      setTimeout(() => {
        sendData();
      }, TimeConfig.SOCKET_RESEND_TIME);
    } else {
      sendData();
    }
  }
  /**
   * 更新群会话密钥
   */
  public sendGroupKey(secretObj: object) {
    this.sendData(secretObj);
  }
  /**
   * 发送聊天消息,Message转换为api格式
   */
  public async sendChatMsg({ channel, targetId, msg, aitList,isSnap, failCb }: SendChatMsgParam, target?: Friend | Group) {
    let apiMsg = null;
    let msgType: MsgType = MsgType.Text;
    if (msg instanceof TextMsg) {
      const textMsg = msg.content;
      apiMsg = {
        aitList,
        content: textMsg
      };
    } else if (msg instanceof ImageMsg) {
      apiMsg = {
        height: msg.height,
        width: msg.width,
        imageUrl: msg.url
      };
      msgType = MsgType.Picture;
    } else if (msg instanceof FileMsg) {
      apiMsg = {
        fileUrl: msg.url,
        size: msg.size,
        md5: msg.md5,
        name: msg.fileName
      };
      msgType = MsgType.File;
    } else if (msg instanceof VideoMsg) {
      apiMsg = {
        mediaUrl: msg.url,
        time: msg.duration,
        width: msg.width,
        height: msg.height
      };
      msgType = MsgType.Video;
    } else {
      throw new Error('sendChatMsg:发送的消息类型不支持');
    }
    this.callbackMap.set(msg.msgId, failCb);

    const encryptedmsg = await this.encryptContent(JSON.stringify(apiMsg), target);

    this.sendData({
      eventType: EventType.ChatMsg,
      msgId: msg.msgId,
      channelType: channel,
      targetId,
      msgType,
      msg: encryptedmsg || apiMsg,
      isSnap: isSnap ? IsSnap.yes : IsSnap.no
    });
  }
 
  public close() {
    if (this.socket) {
      this.socket.close(1000);
    }
  }

  // 注册监听接受消息回调
  public listen(eventName: SocketEvent, callback: any) {
    const events = this.eventMap.get(eventName);
    if (events) {
      events.push(callback);
    } else {
      this.eventMap.set(eventName, [callback]);
    }
  }

  //发送

  /**
   * 加密消息
   */
  private async encryptContent(apiMsg: string, target?: Friend | Group): Promise<any> {
    if (target instanceof Friend) {
      return await this.encryptFriendMessage(apiMsg, target);
    } else if (target instanceof Group) {
      return target.encrypt === 1 ? await this.encryptGroupMessage(apiMsg, target) : null;//群的encrypt为2不加密
    }
  }
  /**
   * 个人加密
   */
  private async encryptFriendMessage(apiMsg: string, target: Friend): Promise<object> {
    let encryptedMsgObj: object = {};
    const privateKey = await this.accountDao.getPrivateKey();
    const publicKey = await this.accountDao.getPublicKey();
    const sessionKey = generateSessionKey(privateKey, target.publicKey);
    const encryptedmsg = encryptSymmetric(sessionKey, apiMsg);
    encryptedMsgObj = { encryptedMsg: encryptedmsg, fromKey: publicKey, toKey: target.publicKey };
    return encryptedMsgObj;
  }
  /**
   * 群聊加密
   */
  private async encryptGroupMessage(apiMsg: string, target: Group) {
    let encryptedMsgObj: object = {};
    const groupKeyObj = await this.groupKeyDao.getRowByLatestKey(target.id);
    console.log(groupKeyObj);
    if(groupKeyObj){
      const encryptedmsg = encryptSymmetric(groupKeyObj.key, apiMsg);
      encryptedMsgObj = { encryptedMsg: encryptedmsg, kid: String(groupKeyObj.kid) };
      return encryptedMsgObj;
    } else {
      notify.fail({
          text: ErrorMsg.LOST_GROUPKEY,
          isUnique: true
        })
    }
  }
  /**
   * 发送开始同步消息
   */
  private sendStartSyncMsg(latestTime: number) {
    this.isSyncing = true;
    this.sendData({
      eventType: EventType.StartSync,
      time: latestTime
    });
  }
  /**
   * 发送同步群秘钥消息 
   */
  private sendStratSyncGroupKey(latestTime: number) {
    this.isSyncing = true;
    this.sendData({
      eventType: EventType.ActiveSyncGroupKey,
      datetime: latestTime
    });
  }
  // 触发监听事件,支持注册多事件
  private emitEvent(eventName: SocketEvent, params: any[]) {
    const event = this.eventMap.get(eventName);
    if (event) {
      event.forEach((item: any) => {
        item(...params);
      });
    } else {
      console.error('未注册该事件处理');
    }
  }

  // 断线重连
  private reconnect() {
    if (this.blockReconnect) {
      return;
    }
    setTimeout(() => {
      this.init();
      this.reconnectCount += 1;
      if (this.reconnectCount > 5) { // 多次重连失败则提示异常
        notify.fail({
          text: ErrorMsg.CONNECT_ERROR,
          isUnique: true
        });
      }
    }, this.reconnectCount < 5 ? TimeConfig.SOCKET_RECONNECT : TimeConfig.SOCKET_LOW_RECONNECT);
  }

  private sendData(data: any) { // todo 增加发送error处理直接运行cb
    if (this.socket) {
      this.socket.send(JSON.stringify(data));
    }
  }

  // 运行回调
  private runCallback(msgId: string, params: any) {
    const cb = this.callbackMap.get(msgId);
    if (cb) {
      cb(params);
      this.callbackMap.delete(msgId);
    } else {
      console.error('runCallback: no callback?');
    }
  }
}

export {
  UserLoggedInfo,
  MySocket,
  VideoMsgApi,
  ImageMsgApi,
  FileMsgApi,
  GroupMember,
};
