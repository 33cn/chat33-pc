import {StateTypes} from './types';
import {MutationTree} from 'vuex';
import {MySocket, UserLoggedInfo} from '@/scripts/object';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import Datasource from '@/scripts/data-source';
import BenzAMRRecorder from 'benz-amr-recorder';
import AudioMsg from '@/object/messages/AudioMsg';
import SnapAudioMsg from '@/object/messages/snapMsg/SnapAudioMsg';
import MsgExDao from '@/scripts/msgEx-dao';
import GroupKeyDao from '@/scripts/groupKey-dao';

const mutations: MutationTree<StateTypes> = {
  setIsWin(state): void { // @Mutation public setIsWin!: () => {};
    state.isWin = true;
  },
  setMyInfo(state, myInfo: UserLoggedInfo | null): void { // @Mutation public setMyInfo!: (myInfo: UserLoggedInfo | null) => void;
    state.myInfo = myInfo;
  },
  setGroupList(state, groupList: Group[]): void { // @Mutation public setGroupList!: (groupList: Group[]) => void;
    state.groupList = groupList;
  },
  setFriendList(state, friendList: Friend[]): void { // @Mutation public setFriendList!: (friendList: Friend[]) => void;
    state.friendList = friendList;
  },
  /**
   * 消息对象
   */
  setMessage(state,payload:any):void {
    state.message = payload;
  },
  /**
   * 添加新朋友/临时会话更新为好友
   * @param state
   * @param friend
   */
  handleAddFriend(state, friend: Friend): void {
    const exist = state.friendList.find((item) => item.id === friend.id);
    if (!exist) {
      state.friendList.push(friend);
    } else {
      exist.isTemp = false; // 已经存在（临时会话）更新为非临时会话
    }
  },
  /**
   * 退出登录时调用
   * @param state
   */
  clearStore(state): void { // @Mutation public clearStore!: () => {};
    if (state.socket) {
      state.socket.close();
      state.socket = null;
    }
    state.groupList = [];
    state.friendList = [];
    state.myInfo = null;
    state.chatTarget = null;
    Datasource.getInstance().closeDB(); // 关闭该用户数据库
  },
  /**
   * 删除群/好友：删除store中的target和该target的本地聊天记录
   * @example @Mutation public removeTarget!: (target: Group | Friend) => void;
   */
  removeTarget(state, target: Group | Friend): void {
    const list: Array<Friend | Group> = target instanceof Group ? state.groupList : state.friendList;
    const index = list.findIndex((item: Friend | Group) => item.id === target.id);
    if (index > -1) {
      list.splice(index, 1);
      const msgExDao = new MsgExDao(Datasource.getInstance());
      msgExDao.clearOnesLogs(target.id, target instanceof Group);
      if ( target instanceof Group ) {
        const groupKeyDao = new GroupKeyDao(Datasource.getInstance()); // 删除该群相关密钥
        groupKeyDao.deleteGroupKeys(target.id);
      }
    }
  },
  /**
   * 设置socket
   * @example @Mutation public setSocket!: (socket: MySocket) => void;
   */
  setSocket(state, socket: MySocket): void {
    state.socket = socket;
  },
  /**
   * 设置是否开启系统通知
   * @example @Mutation public setNotifyEnable!: (enable: boolean) => void;
   */
  setNotifyEnable(state, enable: boolean): void {
    state.notifyEnable = enable;
  },
  /**
   * 更新未读申请计数
   * @example @Mutation public setApplyCount!: (count: number) => void;
   */
  setApplyCount(state, count: number): void {
    state.applyCount = count;
  },
  /**
   * 未读申请计数+1
   * @example @Mutation public addApplyCount!: () => void;
   */
  addApplyCount(state): void {
    state.applyCount += 1;
  },
  /**
   * 设置当前会话对象
   * @example  @Mutation public setChatTarget!: (target: Group | Friend | null) => void;
   */
  setChatTarget(state, target: Group | Friend | null): void {
    state.chatTarget = target;
  },
  /**
   * 设置正在播放的语音
   * @example  @Mutation public setAudioPlaying!: (audio: Message | null) => void;
   */
  setAudioPlaying(state, audio: AudioMsg | SnapAudioMsg | null): void {
    state.audioPlaying = audio;
  },
  /**
   * 设置语音播放器
   * @example  @Mutation public setAudioPlayer!: (player: BenzAMRRecorder | null) => void;
   */
  setAudioPlayer(state, player: BenzAMRRecorder | null): void {
    state.audioPlayer = player;
  },
  /**
   * 设置群禁言时间
   * @example  @Mutation public setGroupBanTime!: (param: any) => void;
   */
  setGroupBanTime(state, {groupId, endTime}) {
    const group = state.groupList.find((item) => item.id === groupId);
    if (group) {
      group.banEndTime = endTime;
    }
  },
  /**
   * 设置数据库操作
   */
  setDatasource(state, datasource: Datasource) {
    state.datasource = datasource;
  },
  /**
   * 设置是否注册
   */
  setIsReg(state, isReg: boolean) {
    state.isReg = isReg;
  }
};

export default mutations;
