/**
 * @name 消息父对象(会话内的聊天消息、通知消息、公告消息)
 * @author yuanzeyu
 * @date 2019-05-09
 * @desc
 */
import {MessageStatus} from '@/config/config-enum';
import {GroupMember, UserLoggedInfo} from '@/scripts/object';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import {SenderInfo, Praise} from '@/config/apiTypings';
import {MsgType} from '@/config/const-enums';

export type SenderType = Friend | UserLoggedInfo | GroupMember ;

export interface BaseMsgConfig {
  id: string;
  msgId?: string;
  sendTime: number;
  senderId: string;
  receiverId?: string;
  sender: SenderType;
  isSendByMe: boolean;
  msgType?: MsgType;
  senderInfo?: SenderInfo;
  praise?: Praise;
}

abstract class BaseMsg { // todo 无发送者信息 sender 改为通过vuex getter实现?
  public id: string; // logId
  public readonly msgId?: string; // 消息id（用于验证自己发送的消息）
  public sendTime: number;
  public readonly senderId: string; // 发送者id
  public readonly receiverId?: string; // 接收者id
  public sender: SenderType; // 发送者object
  public isSendByMe: boolean; // 发送人是自己(包括其他端)
  public senderInfo?: SenderInfo; //发送者信息
  public msgType?: MsgType;
  public sendStatus: MessageStatus = MessageStatus.Success; // 发送状态
  public isUnread: boolean = false; // 是未读消息（是显示过）
  public isRightMenuShowing: boolean = false; // 右键菜单显示中
  public like: number = 0; // 赞数量
  public reward: number = 0; //赏数量
  public state: number = 0; //赞赏状态
  public islikeDetail?: boolean = false;

  protected constructor({id, msgId, sendTime, senderId, receiverId, sender, isSendByMe,senderInfo,msgType,praise}: BaseMsgConfig) {
    this.id = id;
    this.msgId = msgId;
    this.sendTime = sendTime;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.sender = sender;
    this.isSendByMe = isSendByMe;
    this.senderInfo = senderInfo;
    this.msgType = msgType;
    this.like = praise ? praise.like : 0;
    this.reward = praise ? praise.reward : 0;
    this.state = praise ? praise.state : 0;
  }

  /**
   * 获取会话列表最新消息和系统弹窗通知显示的文本
   */
  public abstract getListLabel(isGroup: boolean): string;

}

// class demo extends BaseMsg{
//   public msgType: string;
//   constructor(id: string, msgId: string, msgType: string) {
//     super(id, msgId);
//     this.msgType = msgType;
//   }
// }
//
// const a = new demo('11', '22', '33');

export default BaseMsg;
