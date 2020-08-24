import { MsgType } from '@/config/const-enums';
/**
 * 群对象
 * @author yuanzeyu
 * @date 2019-05-09
 * @desc
 */

import Target from '@/object/targets/Target';
import {
  AddFriendEnable, FOREVER_TIME,
  JoinGroupAuthority,
  MemberMutedSet,
  MemberType,
  MsgDetailType,
  MutedSet, RecordPermission, NewChannelType
} from '@/config/const-enums';
import GroupAnnounce from '@/object/messages/GroupAnnounce';
import { GroupMember, UserLoggedInfo } from '@/scripts/object';
import { MessageType } from '@/object/messages';
import { getApi2Message } from '@/scripts/common';
import dataSource from '@/scripts/data-source';
import SnapTextMsg from '@/object/messages/snapMsg/SnapTextMsg';
import { post } from '@/plugins/axios-plugin';
import { defaultImage, ErrorMsg, GET_LOG_COUNT } from '@/config/config-enum';
import URLS from '@/config/urls';
import Friend from '@/object/targets/Friend';
import { UserLoggedInfoParam, GroupParam, ApiMsg, Praise } from '@/config/apiTypings';
import { generateSessionKey, encryptSymmetric, dencryptSymmetric, local2ApiMsg, isJsonString, getLikeState, recordUnreadLike } from "@/utils/tool";
import AccountDao from "@/scripts/account-dao";
import Datasource from '@/scripts/data-source';
import Cryptography from '@/object/targets/Cryptography';
import notify from '@/plugins/NotifyPop';

class Group extends Target {
  public muted: boolean;
  public ready4Send: boolean = false; // 从联系人页点击发送
  // 详情
  public memberCount: number = 0; // 成员总数
  public onlineCount: number = 0; // 在线人数
  public memberList: GroupMember[] = []; // 群成员列表
  public alreadyGetDetail: boolean = false; // 已经请求过详情
  public addFriendEnable: AddFriendEnable = AddFriendEnable.No; // 群内可以加好友
  public joinPermission: JoinGroupAuthority = JoinGroupAuthority.Forbidden; // 加群权限
  public mutedSet: MutedSet = MutedSet.NoMuted; // 群禁言设置
  public markId: string = ''; // 用于显示的id
  public myLevel: MemberType = MemberType.Member;
  public groupNotifyList: GroupAnnounce[]; // 群公告列表 todo groupNotify修改为announce
  public groupNotifyCount: number; // 群公告总数
  public groupNotifyNextLog: string; // 下条群公告的logId
  public myMutedSet: MemberMutedSet; // 我的禁言设置,用于判断当前禁言状态UI,在群详情中获取
  public myMutedRemainTime: number; // 我的禁言结束时间, 永久禁言为FOREVER_TIME
  public mutedTimer: any; // todo 优化
  public allowAllHistory: boolean = false; // 新成员可查看全部历史记录
  public banEndTime: number = 0; // 封群结束时间戳
  public encrypt: number = 1; //是否加密群，加密1，不加密2
  public constructor(props: GroupParam) {
    super(props);
    this.markId = props.markId || '';
    this.muted = props.muted || false;
    this.banEndTime = props.banEndTime || 0;
    this.encrypt = props.encrypt || 1;
    this.groupNotifyList = [];
    this.groupNotifyCount = 0;
    this.groupNotifyNextLog = '';
    this.myMutedSet = MemberMutedSet.No;
    this.myMutedRemainTime = 0;
    this.mutedTimer = '';
  }

  /**重写加载聊天记录 */
  public async loadMsgHistory(): Promise<void> {
    super.loadMsgHistory();
    await this.getLogs(false);
  }

  public static revokeMessage(messageId: string) {
    post(URLS.REVOKE_MSG, {
      logId: messageId,
      type: NewChannelType.Group
    });
  }
  /**
     * 从数据提供方法获取聊天记录
     */
  private async getLogs(localOnly: boolean = false, count: number = GET_LOG_COUNT) {

    const data = await this.getRangeLogs(this.id, true, localOnly, this.nextMsgId, count);
    if (data) {
      const logs = data.items;
      let _this = this;
      (async function loop() {
        for (let i = 0; i < logs.length; i++) {
          if (!_this.msgHistory.find((msg: MessageType) => msg.id === logs[i].logId)) {
            const { encMsg } = await _this.dencryptGroupMsg(logs[i], false);
            logs[i] = encMsg;
            const message = _this.getMsg(logs[i], true);
            _this.msgHistory.unshift(message);
          }
        }
      })()

      this.nextMsgId = data.nextLog;
      if (!localOnly || this.msgHistory.length > GET_LOG_COUNT) { // 不是仅请求本地或请求本地数量较多(避免本地少无法滚动触发请求)
        this.alreadyGetLogs = true; // 则设为已请求过记录
      }
    }
  }
 
  public filterMsgStatus(status:ApiMsg["msgType"]) {
    const actions = new Map([
      [MsgType.Text,true],
      [MsgType.Audio,true],
      [MsgType.Picture,true],
      [MsgType.Video,true],
      [MsgType.File,true],
      [MsgType.RelayMsg,true]
    ])
    return actions.get(status) || false;
  }

  public async dencryptGroupMsg(encMsg: ApiMsg, encrypted: boolean) {
    // 对解密群的消息进行解密
    if (this.filterMsgStatus(encMsg.msgType)&&typeof (encMsg.msg.encryptedMsg) === 'string') {
        const groupSessionKey = await this.groupKeyDao.getGroupKeyByKeyId(encMsg.msg.kid);
        let dencryptResult = null;
        if (!groupSessionKey) {
          encrypted = false;
        } else if (isJsonString(dencryptResult = await dencryptSymmetric(groupSessionKey, encMsg.msg.encryptedMsg))) {
          encMsg.msg.encryptedMsg = JSON.parse(dencryptResult);//解密消息
          encrypted = true;
        } else {
          encrypted = false;
        }
      }
    return { encMsg, encrypted }
  }

  // 群聊处理接受消息
  public async onReceiveChatMsg(apiMsg: any, isNotify: boolean = false) {
    let encrypt = true;
    let { encMsg, encrypted } = await this.dencryptGroupMsg(apiMsg, encrypt);
    console.log(encMsg);
    if (encMsg.msg.type === MsgDetailType.SnapRead) {
      const id = encMsg.msg.logId;
      const index = this.msgHistory.findIndex((item) => item.id === id);
      if (index > -1 && !(this.msgHistory[index] as SnapTextMsg).isUnLockByLocal) { // 非本端解锁立即删除
        this.msgHistory.splice(index, 1);
        this.msgExDao.deleteOneLog(id, false);
      }
      return null;
    }
    if (encMsg.msg.type === MsgDetailType.likeAndReward) {
      await this.haddleLikeMsg(encMsg);           
      if(encMsg.msg.operator!=this.me.id){
        this.unReadLike = encMsg.msg.like;
        this.unReadReward = encMsg.msg.reward;
        recordUnreadLike(this.me.id, this.id, encMsg.msg);
      }
      return null;
    }

    this.saveLog(this.id, true, encMsg); // 收到消息则存入数据库
    const newMsg = this.getMsg(encMsg, encrypted);
    let msgSendByMe = null;
    if ((newMsg as any).msgId) { // 有非空msgId
      msgSendByMe = this.msgHistory.find((item) => item.msgId === newMsg.msgId);
    }
    
    // 收到'别人发送的'或'自己的其他端发送'，且非重复消息（请求历史中收到socket则可能重复）
    const notRepeatMsg = !this.msgHistory.find((item) => item.id === newMsg.id);

    if (msgSendByMe) { // 本地已存在该消息==是本端发送的回复：更新状态
      Target.updateMsg(msgSendByMe, newMsg);
    } else if (notRepeatMsg) {
      if (encMsg.msg.type !== MsgDetailType.Revoke || this.handleRevokeMessage(encMsg)) {
        this.addNewMsg(newMsg);
      }
      // 当前是隐藏窗口状态 且 非禁言: 显示系统通知
      const needSystemNotify = isNotify && !this.muted;
      if (needSystemNotify) {
        this.showSystemNotify(newMsg, this);
      }
    }

    if (newMsg instanceof GroupAnnounce) { // 是群公告
      newMsg.isUnread = true; // 收到socket消息标为未读 todo 未读状态本地数据库保存
      if (!this.groupNotifyList.find((item) => item.id === newMsg.id)) {
        this.groupNotifyList.unshift(newMsg); // 新公告在前
        this.groupNotifyCount += 1;
      }
    }
    return newMsg;
  }

  public async haddleLikeMsg(encMsg:ApiMsg){
    const id = encMsg.msg.logId;
      this.msgHistory.forEach(async item => {
        if (item.id === id) {
          item.like = encMsg.msg.like;
          item.reward = encMsg.msg.reward;
          item.state = getLikeState(item.state, encMsg.msg, encMsg.msg.operator === this.me.id);
          const praise: Praise = {
            like: item.like,
            reward: item.reward,
            state: item.state
          }
          const result = await this.msgExDao.updatePraise(JSON.stringify(praise), id, true);
          console.log(result);
        }
      }); 
  }
  // 加载群详情 增加字段 并 更新已有字段
  public async getGroupDetail() {
    const data = await post(URLS.GET_GROUP_INFO, { roomId: this.id });
    if (data.markId) {
      this.markId = data.markId;
      this.alreadyGetDetail = true;
      this.avatar = data.avatar || defaultImage.Group;
      this.memberCount = data.memberNumber;
      this.addFriendEnable = data.canAddFriend;
      this.joinPermission = data.joinPermission;
      this.onlineCount = data.onlineNumber; // todo 移除在线人数
      this.myLevel = data.memberLevel;
      this.groupNotifyCount = data.systemMsg.number;
      this.groupNotifyNextLog = data.systemMsg.nextLog;
      this.mutedSet = data.roomMutedType;
      this.name = data.name;
      this.allowAllHistory = data.recordPermission === RecordPermission.All;
      if (data.roomMutedType === MutedSet.BlackList && data.mutedType === MemberMutedSet.Black && data.deadline <= Date.now()) {
        this.myMutedSet = MemberMutedSet.No; // 计时结束后端仍然返回在黑名单，手动置为不采用,避免禁言闪动
      } else {
        this.myMutedSet = data.mutedType;
      }
      // 临时处理禁言时间
      this.handleMutedCount(data.deadline);

      // 临时处理禁言时间 end
      if (data.systemMsg.list.length > 0) {
        const latestNotify = data.systemMsg.list[0]; // 只会带一个
        if (!this.groupNotifyList.find((item) => item.id === latestNotify.logId)) {
          const item = new GroupAnnounce({
            id: latestNotify.logId,
            msgId: '',
            sendTime: latestNotify.datetime,
            senderId: '',
            receiverId: '',
            // @ts-ignore
            sender: new Friend({ name: latestNotify.senderName }), // todo 更新GroupAnnounce
            isSendByMe: false,
            content: latestNotify.content
          });
          this.groupNotifyList.unshift(item);
        }
      }
      if (data.users) {
        // todo 接口 memberLevel暂未使用，查询了我在群内的信息
        data.users.forEach((item: any) => { // 信息接口带前16个群成员，可能在内存已存在
          this.addMember(this.getApi2Member(item));
        });
      }
    }
  }

  // 加载单个群成员
  public async getMemberInfo(id: string) {
    const data = await post(URLS.GET_MEMBER_INFO, {
      roomId: this.id,
      userId: id
    });
    if (data) {
      const member = this.getApi2Member(data);
      this.addMember(member);
    } // 如果群内已无该成员，则继续保持消息自带的信息
  }

  // 加载群成员列表
  public async getMembers() {
    const data = await post(URLS.GET_GROUP_MEMBER, { roomId: this.id });
    if (data) {
      data.userList.forEach((item: any) => {
        this.addMember(this.getApi2Member(item));
      });
    }
  }

  /**
   * 获取自己的加群来源
   */
  public async getSource(myId: string) {
    const data = await post(URLS.GET_MEMBER_INFO, {
      roomId: this.id,
      userId: myId
    });
    if (data) {
      this.source = data.source;
    }
  }

  // 添加或更新一个群成员
  public addMember(m: GroupMember) {
    const member = this.memberList.find((item) => item.id === m.id);
    if (!member) {
      this.memberList.push(m);
    } else { // 如果已经存在则更新成员数据
      const memberExist = member as GroupMember;
      memberExist.nameInGroup = m.nameInGroup;
      memberExist.avatar = m.avatar;
      memberExist.name = m.name;
      memberExist.type = m.type;
      memberExist.mayNotMember = false;
      memberExist.mutedEndTime = m.mutedEndTime;
      memberExist.memberMutedSet = m.memberMutedSet;
      memberExist.publicKey = m.publicKey;
    }
  }

  // 搜索群成员
  public async searchMember(query: string) {
    const data = await post(URLS.SEARCH_MEMBER, {
      roomId: this.id,
      query
    });
    if (data) {
      data.userList.forEach((item: any) => {
        this.addMember(this.getApi2Member(item));
      });
    }
  }

  /**
   * 获取消息对象
   * @param apiMsg
   */
  public getMsg(apiMsg: any, encrypted: boolean): MessageType {
    const senderId = apiMsg.fromId;
    let member = null;
    const memberExist = this.memberList.find((item: GroupMember) => item.id === senderId);
    if (memberExist) {
      member = memberExist;
    } else {
      member = new GroupMember(senderId, apiMsg.senderInfo.nickname, '',
        apiMsg.senderInfo.avatar, undefined, true);
      this.addMember(member); // 先添加到群成员中
    }
    return getApi2Message(apiMsg, senderId === this.me.id ? this.me : member, encrypted);
  }

  /**
   * 处理撤回消息
   * @param apiMsg
   * @return 是否需要加入聊天记录
   */
  protected handleRevokeMessage(apiMsg: any): boolean {
    const index = this.msgHistory.findIndex((item: any) => item.id === apiMsg.msg.logId);
    if (index > -1) {
      const msg = this.msgHistory[index];
      const isGroupAnnounce = msg instanceof GroupAnnounce;
      if (isGroupAnnounce) {
        const notifyListIndex = this.groupNotifyList.findIndex((item) => item.id === msg.id);
        if (notifyListIndex > -1) {
          this.groupNotifyList.splice(notifyListIndex, 1);
          this.groupNotifyCount -= 1;
        }
      }
      this.msgHistory.splice(index, 1);
      this.msgExDao.deleteOneLog(msg.id, true);
      if (isGroupAnnounce) { // 群公告撤回不显示撤回通知
        return false;
      }
    }
    return true;
  }

  private handleMutedCount(endTime: number) {
    const groupIsBlackMuted = this.mutedSet === MutedSet.BlackList;
    const isInBlackList = this.myMutedSet === MemberMutedSet.Black;
    const isMember = this.myLevel === MemberType.Member;
    this.myMutedRemainTime = 0;
    if (this.mutedTimer) {
      clearInterval(this.mutedTimer);
      this.mutedTimer = '';
    }
    if (groupIsBlackMuted && isInBlackList && isMember) {
      if (endTime === FOREVER_TIME) {
        this.myMutedRemainTime = FOREVER_TIME;
      } else {
        // 设置我的剩余禁言时间毫秒
        this.myMutedRemainTime = endTime - Date.now();
        // 读秒，结束时更新状态
        this.mutedTimer = setInterval(() => {
          this.myMutedRemainTime -= 1000;
          if (this.myMutedRemainTime <= 0) {
            this.myMutedSet = MemberMutedSet.No; // 从黑名单中移出
            this.mutedTimer = '';
            this.getGroupDetail();
            clearInterval(this.mutedTimer);
          }
        }, 1000);
      }
    }
  }

  private getApi2Member(apiMember: any): GroupMember {
    return new GroupMember(apiMember.id, apiMember.nickname, apiMember.roomNickname,
      apiMember.avatar, apiMember.memberLevel, false, apiMember.deadline, apiMember.mutedType, apiMember.publicKey);
  }
}

export default Group;
