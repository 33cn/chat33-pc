/**
 * 父类
 * @author yuanzeyu
 * @date 2019-05-09
 * @desc
 */
import { PictureReaderProp } from '@/config/type';
import {MessageType} from '@/object/messages';
import {NO_NEXT_LOG,MsgDetailType} from '@/config/const-enums';
import {defaultImage, ErrorMsg, FormLimit, GET_LOG_COUNT, MessageStatus} from '@/config/config-enum';
import {showToast} from '@/plugins/Toast';
import {UserLoggedInfo} from '@/scripts/object';
import {post} from '@/plugins/axios-plugin';
import URLS from '@/config/urls';
import { ApiMsg , TargetParam, Praise } from '@/config/apiTypings';
import Datasource from '@/scripts/data-source';
import AccountDao from "@/scripts/account-dao";
import MsgExDao from "@/scripts/msgEx-dao";
import { local2ApiMsg } from "@/utils/tool";
import GroupKeyDao from "@/scripts/groupKey-dao";
import {ipcRenderer} from 'electron';

interface GetLogsResult {
  items: ApiMsg[];
  nextLog: string;
}

abstract class Target {

  // 收到消息回复时更新旧消息
  protected static updateMsg(existMsg: MessageType, newMsg: MessageType) {
    console.log(existMsg);
    existMsg.id = newMsg.id;
    existMsg.sendTime = newMsg.sendTime;
    existMsg.sendStatus = MessageStatus.Success;
    existMsg.msgType = newMsg.msgType;
    existMsg.senderInfo = newMsg.senderInfo;
  }

  // info
  public readonly id: string;
  public name: string;
  public avatar: string;
  // data
  public msgHistory: MessageType[] = []; // 区分群和好友?
  public nextMsgId: string = ''; // 下一条消息id
  public isTemp: boolean; // 是临时会话
  public source: string = ''; // 加好友/群来源字符串
  // set status
  public isTop: boolean; // 是否开启置顶
  // chat status
  public isTempChat: boolean = false; // 是临时会话
  public msgEditing: string = ''; // 正在输入的文字
  // public aitList: Array<string> = [];//@的用户id列表
  public aitInfos: Array<any> = [];//保存@用户的信息数组
  public isSendingSnap: boolean = false; // 正在编辑阅后即焚
  public unReadCount: number = 0; // 未读消息数量
  public unreadDownCount: number = 0; // 滚动到上方时底部收到的新消息;
  public unReadLike: number = 0; // 未读点赞数
  public unReadReward: number = 0; // 未读点赞数
  public picturesSending: PictureReaderProp[]; // 要发送的图片
  public isSendSnap: boolean = false; // 输入框在发送阅后即焚状态
  public selectorShow: boolean = false; // 多选显示

  // tool
  public me: UserLoggedInfo; // 登录者,用于加载消息
  public isShowSelector: boolean = false; // 多选状态
  public alreadyGetLogs: boolean = false; // 已经获取过至少一次聊天记录
  public selectedItems: MessageType[] = []; // todo 排除通知
  public publicKey: string;
  public msgExDao!: MsgExDao;
  public groupKeyDao!: GroupKeyDao;

  protected constructor(props: TargetParam) {
    this.id = props.id;
    this.name =  props.name || '';
    this.avatar = props.avatar || defaultImage.Group;
    this.isTop =  props.isTop || false;
    this.me = props.me || new UserLoggedInfo({});
    this.publicKey = props.publicKey || ''
    this.isTemp = false; // 默认不是临时会话(当添加临时会话：需要设为true)
    this.unreadDownCount = 0;
    this.picturesSending = [];
    this.msgExDao = new MsgExDao(Datasource.getInstance());
    this.groupKeyDao = new GroupKeyDao(Datasource.getInstance());
  }

  /**
   * 加载聊天记录
   */
  public async loadMsgHistory(localOnly: boolean = false, count: number = GET_LOG_COUNT): Promise<void> {
    if (this.nextMsgId === NO_NEXT_LOG) { // 已知没有更多消息
      return;
    }
    if (this.isTempChat) { // 临时会话不支持请求记录
      return;
    }
    if (this.nextMsgId.length === 0 && this.msgHistory.length > 0) { // 无nextId且本地有消息
      this.nextMsgId = String(Number(this.msgHistory[0].id) - 1);
    }

    const userInfo = JSON.parse(
      localStorage.getItem(this.me.id) || "null"
    );
    if(userInfo.unreadLike && (this.id in userInfo.unreadLike)){
      this.unReadLike = userInfo.unreadLike[this.id].like;
      this.unReadReward = userInfo.unreadLike[this.id].reward;
    }
  }

  /**
   * 清空用于滚动到最早未读消息的未读计数
   */
  public clearUnreadMessage() {
    this.msgHistory.forEach((item) => {
      item.isUnread = false;
    });
  }

  /**
   * 聊天消息按时间排序
   */
  public sortMsgList() {
    this.msgHistory.sort((a, b) => a.sendTime > b.sendTime ? 1 : -1);
  }

  /**
   * 切换多选选中状态（限制最多选n个）
   */
  public switchSelect(message: MessageType) {
    const existIndex = this.selectedItems.indexOf(message);
    if (existIndex > -1) {
      this.selectedItems.splice(existIndex, 1);
    } else if (this.selectedItems.length > FormLimit.SelectMsgCount) {
      showToast(ErrorMsg.OVER_SELECT_LIMIT);
    } else {
      this.selectedItems.push(message);
    }
  }

  /**
   * 清理消息，保留最多50条消息
   */
  public limitMsgLength() {
    this.msgHistory = this.msgHistory.slice(-50);
    this.nextMsgId = ''; // 清除错误的下条id(下次使用最旧一条的id)
  }

  /**
   * 删除指定的本地聊天消息
   * @param id 消息logId
   */
  public deleteLocalMessage(id: string, isGroup:boolean): void { // 未删除对应的本地文件
    const existIndex = this.msgHistory.findIndex((item) => item.id === id);
    if (existIndex > -1) {
      this.msgHistory.splice(existIndex, 1);
         this.msgExDao.deleteOneLog(id, isGroup);
    }
  }

  // 记录追加一条消息
  protected addNewMsg(message: MessageType): void { // todo 有缓存后语音未读保存
    console.log(message);
    this.msgHistory.push(message);
  }

  /**
   * 调用系统通知
   * @param message
   */
  protected showSystemNotify(message: MessageType,obj:any) {
    const body = message.getListLabel(obj);
    const notify = new Notification(this.name, {body}); // tslint:disable-line
    notify.onclick = () => {
      ipcRenderer.send('focus-app');
    };
  }

  public async getRangeLogs(targetId: string, isGroup: boolean, localOnly: boolean,
    startId: string, count: number): Promise<GetLogsResult | null> {
    try {
      // 查询本地
      const result = await this.msgExDao.getRangeLogs(targetId, startId, count, isGroup);
      const localLogs = result.map((item: any) => local2ApiMsg(item));
      const len = localLogs.length;
      const fakeNextLog = len > 0 ? String(Number(localLogs[len - 1].logId) - 1) : startId;

      // 本地缓存消息够: 直接返回本地的数据
      if (len >= count) {
        const latestLog = localLogs.pop();
        const nextLogId = len > count ? (latestLog as ApiMsg).logId : fakeNextLog;
        return {
          items: localLogs,
          nextLog: nextLogId // 多查一条：多的作为nextLog并移出数组；刚好：最老一条-1作为nextLog
        };
      }
      // 本地缓存不够：请求缺少的
      const needCount = count - len;
      if (localOnly) { // 如果仅适用本地缓存
        return {
          items: localLogs,
          nextLog: fakeNextLog
        };
      } else {
        const result = await this.requestLogs(targetId, fakeNextLog, needCount, isGroup);
        if (result) {
          const logs = result.logs;
          const nextLog = result.nextLog;
          this.msgExDao.batchInserts(targetId, logs, isGroup);// 保存新请求的记录（同步避免未保存前再次请求本地）
          return {
            items: logs.concat(localLogs),
            nextLog
          };
        }
        return null;
      }
    } catch (e) {
      console.error('查询异常,错误内部已处理', e);
      return null;
    }
  }
  
  public async requestLogs(targetId: string, startId: string, count: number, isGroup: boolean) {
    const url = isGroup ? URLS.GROUP_CHAT_LOG : URLS.FRIEND_CHAT_LOG;
    const data = await post(url, {
      id: targetId,
      startId,
      number: count
    });
    if (data) {
      return {
        logs: data.logs.filter((item: any) => item.msg.type !== MsgDetailType.SnapRead), // 过滤掉焚毁通知
        nextLog: data.nextLog
      };
    }
    throw new Error('请求失败（post内部已处理）');
  }
  /**
   * 保存一条聊天记录
   */
  public saveLog(targetId: string, isGroup: boolean, newLog: any) {
    if(!("praise" in newLog)) newLog.praise = {like:0,reward:0,state:0};
    this.msgExDao.batchInserts(targetId, [newLog as ApiMsg], isGroup);
  }
  /**
   * 获取消息对象抽象方法
   */
  protected abstract getMsg(apiMsg: any,encrypted?:boolean): MessageType;

  /**
   * 处理撤回消息
   * @param apiMsg
   */
  protected abstract handleRevokeMessage(apiMsg: any): boolean; // todo 类型化apiMsg

}


export default Target;
