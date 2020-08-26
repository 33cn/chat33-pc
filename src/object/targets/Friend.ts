/**
 * 好友
 * @author yuanzeyu
 * @date 2019-05-09
 * @desc
 */
import Target from '@/object/targets/Target';
import {MessageType} from '@/object/messages';
import {getApi2Message} from '@/scripts/common';
import {NoteTel} from '@/config/type';
import {UserLoggedInfo} from '@/scripts/object';
import {defaultImage, GET_LOG_COUNT, ErrorMsg} from '@/config/config-enum';
import {post} from '@/plugins/axios-plugin';
import URLS from '@/config/urls';
import {Bool, MsgDetailType, NewChannelType} from '@/config/const-enums';
import Datasource from '@/scripts/data-source';
import MsgExDao from "@/scripts/msgEx-dao";
import SnapTextMsg from '@/object/messages/snapMsg/SnapTextMsg';
import {UserLoggedInfoParam, FriendParam, ApiMsg, Praise} from '@/config/apiTypings';
import {
  generateSessionKey,
  encryptSymmetric,
  dencryptSymmetric,
  local2ApiMsg,
  isJsonString,
  checkRate,
  getLikeState,
  recordUnreadLike
} from "@/utils/tool";
import Cryptography from '@/object/targets/Cryptography';
import {MsgType} from '@/config/const-enums';
import GroupKeyDao from "@/scripts/groupKey-dao";
import notify from '@/plugins/NotifyPop';

class Friend extends Target {

  public position : string;
  public often : boolean; // 是否常用联系人
  public muted : boolean; // 是否开启免打扰
  public remark : string = ''; // 联系人备注
  public ready4Send : boolean = false; // 从联系人页点击发送
  public uid : string;
  public needCheck : boolean = true; // 添加好友需要验证
  public needAnswer : boolean = false; // 添加好友需要回答问题
  public addQuestion : string = ''; // 问题
  // v2.4.0新增备注功能
  public notePictures : string[]; // 图片备注
  public noteTels : NoteTel[]; // 电话备注
  public noteDesc : string; // 描述

  public constructor(props : FriendParam) {
    super(props);
    this.avatar = props.avatar || defaultImage.Friend;
    this.position = props.position || '';
    this.often = props.often || false;
    this.muted = props.muted || false;
    this.remark = props.remark || '';
    this.uid = props.uid || '';
    this.notePictures = [];
    this.noteTels = [];
    this.noteDesc = '';
  }

  public static revokeMessage(messageId : string) {
    post(URLS.REVOKE_MSG, {
      logId: messageId,
      type: NewChannelType.Friend
    });
  }
  /**
   * 获取好友详情
   */
  public async getFriendDetail() { // todo 移除其他处该接口调用
    const data = await post(URLS.GET_USER_INFO, {id: this.id});
    if (!data) {
      return;
    }
    this.name = data.name;
    this.avatar = data.avatar || defaultImage.Friend;
    this.position = data.position;
    this.uid = data.uid;
    this.needCheck = data.needConfirm === Bool.Yes;
    this.needAnswer = data.needAnswer === Bool.Yes;
    this.addQuestion = data.question;
    // 仅好友可见
    if (data.isFriend !== Bool.Yes) {
      return;
    }
    this.muted = data.noDisturbing === Bool.Yes;
    this.isTop = data.stickyOnTop === Bool.Yes;
    this.remark = data.remark;
    this.source = data.source;
    const note = data.extRemark;
    if (note.pictures) {
      this.noteDesc = note.description;
      this.notePictures = note.pictures;
      this.noteTels = note
        .telephones
        .map((item : any) => {
          return {
            label: item.remark,
            value: item.phone,
            key: String(Math.random())
          };
        });
    }
  }

  /**重写加载聊天记录 */
  public async loadMsgHistory() : Promise < void > {
    super.loadMsgHistory();
    await this.getLogs(false);
  }

  /**
   * 从数据提供方法获取聊天记录
   */
  private async getLogs(localOnly : boolean = false, count : number = GET_LOG_COUNT) {

    const data = await this.getRangeLogs(this.id, false, localOnly, this.nextMsgId, count);
    if (data) {
      const logs = data.items;
      logs.forEach((item) => {
        if (!this.msgHistory.find((msg) => msg.id === item.logId)) {
          const message = this.getMsg(item, true);
          this
            .msgHistory
            .unshift(message);
        }
      });
      this.nextMsgId = data.nextLog;
      if (!localOnly || this.msgHistory.length > GET_LOG_COUNT) { // 不是仅请求本地或请求本地数量较多(避免本地少无法滚动触发请求)
        this.alreadyGetLogs = true; // 则设为已请求过记录
      }
    }
  }

  /**
   * 接收到聊天消息
   * @param apiMsg 接口的消息
   * @param isNotify 是否需要调用系统通知（用于收到socket消息）
   */
  public async onReceiveChatMsg(apiMsg : ApiMsg, isNotify : boolean = false) { // todo 整理
    if (apiMsg.msg.type === MsgDetailType.SnapRead) { // 是焚毁消息
      const id = apiMsg.msg.logId;
      const index = this
        .msgHistory
        .findIndex((item) => item.id === id);
      if (index > -1 && !(this.msgHistory[index]as SnapTextMsg).isUnLockByLocal) {
        // 非本端解锁时删除消息
        this
          .msgHistory
          .splice(index, 1);
        this
          .msgExDao
          .deleteOneLog(id, false);
      }
      return null;
    }
    if (apiMsg.msg.type === MsgDetailType.likeAndReward) {
      
      await this.haddleLikeMsg(apiMsg);
       
      console.log('====================走了');
      if (apiMsg.msg.operator !== this.me.id) {
        this.unReadLike = apiMsg.msg.like;
        this.unReadReward = apiMsg.msg.reward;
        recordUnreadLike(this.me.id, this.id, apiMsg.msg);
      }

      return null;
    }

    //某人更新了群密钥
    if (apiMsg.msg.type === MsgDetailType.GroupKeyChanged) { //更新群密钥消息
      const publicKey = apiMsg.msg.fromKey;
      const crypto = new Cryptography();
      const privateKey = await crypto.getPrivateKey();
      const sessionKey = generateSessionKey(privateKey, publicKey);
      const groupKey = dencryptSymmetric(sessionKey, apiMsg.msg.key); //解密群密钥
      console.log(groupKey);

      if (checkRate(groupKey)) {
        return await this
          .groupKeyDao
          .InsertOneRow(apiMsg, groupKey); // 存入群密钥表
      } else {
        console.log('解密群密钥失败');
        return null
      }
    }
    let encrypt = true;
    const {encMsg, encrypted} = await this.dencryptGroupMsg(apiMsg, encrypt);

    this.saveLog(this.id, false, encMsg); // 收到消息则存入数据库
    const newMsg = this.getMsg(encMsg, encrypted);
    let msgSendByMe = null;

    if ((newMsg as any).msgId) { // 有非空msgId
      msgSendByMe = this
        .msgHistory
        .find((item : any) => item.msgId === newMsg.msgId);
    }

    if (msgSendByMe) { // 本地已存在该消息==是本端发送的回复：更新状态
      Target.updateMsg(msgSendByMe, newMsg);
    } else {
      // 收到'别人发送的'或'自己的其他端发送'，且非重复消息（请求历史中收到socket则可能重复）
      const notRepeatMsg = !this
        .msgHistory
        .find((item) => item.id === newMsg.id);
      if (notRepeatMsg) {
        if (encMsg.msg.type === MsgDetailType.Revoke) { // 撤销消息
          if (this.handleRevokeMessage(encMsg)) {
            this.addNewMsg(newMsg);
          }
        } else {
          this.addNewMsg(newMsg);
        }
        // 当前是隐藏窗口状态 且 非禁言: 显示系统通知
        const needSystemNotify = isNotify && !(this as any).muted; // todo muted移至target
        if (needSystemNotify) {
          this.showSystemNotify(newMsg, this);
        }
      }
    }
    return newMsg;
  }

  public async haddleLikeMsg(apiMsg:ApiMsg){
    const id = apiMsg.msg.logId;
    for(let i = 0;i<this.msgHistory.length;i++){
        const item = this.msgHistory[i];
        if (item.id === id) {
            item.like = apiMsg.msg.like;
            item.reward = apiMsg.msg.reward;
            item.state = getLikeState(item.state, apiMsg.msg, apiMsg.msg.operator === this.me.id);
            const praise : Praise = {
              like: item.like,
              reward: item.reward,
              state: item.state
            }
            const result = await this
              .msgExDao
              .updatePraise(JSON.stringify(praise), id, true);
            console.log(result);
          }
      }
  }

  //解密消息
  public async dencryptGroupMsg(encMsg : ApiMsg, encrypted : boolean) {
    if (this.filterMsgStatus(encMsg.msgType)) {
      const crypto = new Cryptography();
      const privateKey = await crypto.getPrivateKey();
      const publicKey = encMsg.fromId == this.me.id
        ? encMsg.msg.toKey
        : encMsg.msg.fromKey; //根据是否自己发的消息接受选择合适的公钥
      const sessionKey = generateSessionKey(privateKey, publicKey);
      const result = dencryptSymmetric(sessionKey, encMsg.msg.encryptedMsg);
      if (isJsonString(result)) {
        encrypted = true;
        encMsg.msg.encryptedMsg = JSON.parse(result); //解密消息
      } else {
        encrypted = false;
      };
    }
    return {encMsg, encrypted}
  }

  // 将接口消息转为本地消息对象
  public getMsg(apiMsg : any, encrypted : boolean) : MessageType { // todo 类型化apiMsg
    return getApi2Message(apiMsg, apiMsg.fromId === this.me.id
      ? this.me
      : this, encrypted); // todo 更新
  }

  /**
   * 撤回消息
   * @param apiMsg
   */
  protected handleRevokeMessage(apiMsg : any) : boolean {
    this.deleteLocalMessage(apiMsg.msg.logId, false);
    return true;
  }

  public filterMsgStatus(status : ApiMsg["msgType"]) {
    const actions = new Map([
      [
        MsgType.Text, true
      ],
      [
        MsgType.Audio, true
      ],
      [
        MsgType.Picture, true
      ],
      [
        MsgType.Video, true
      ],
      [
        MsgType.File, true
      ],
      [MsgType.RelayMsg, true]
    ])
    return actions.get(status) || false;
  }

}

export default Friend;
