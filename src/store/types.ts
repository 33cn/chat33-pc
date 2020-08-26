import {MySocket, UserLoggedInfo} from '@/scripts/object';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import BenzAMRRecorder from 'benz-amr-recorder';
import AudioMsg from '@/object/messages/AudioMsg';
import SnapAudioMsg from '@/object/messages/snapMsg/SnapAudioMsg';
import Datasource from '@/scripts/data-source';
import { MessageType } from '../object/messages';

export interface StateTypes {
  groupList: Group[]; // 群列表
  friendList: Friend[]; // 好友列表
  myInfo: UserLoggedInfo | null; // 登录用户信息
  socket: MySocket | null;
  isWin: boolean; // 当前系统为windows
  notifyEnable: boolean; // 是否开启系统通知
  applyCount: number; // 未读申请数量计数
  chatTarget: Group | Friend | null; // 选中的聊天会话对象
  audioPlaying: AudioMsg | SnapAudioMsg | null; // 当前播放的语音消息
  audioPlayer: BenzAMRRecorder | null; // 语音播放器
  datasource: Datasource | null; // 数据库操作
  isReg: boolean; //是否已注册
  message: MessageType | null //消息对象
}

export interface likeRewardType {
  namespaced: boolean;
  state: any;
  getters: any;
  actions: any;
  mutations: any
}

export interface addressSignType {
  namespaced: boolean;
  state: any;
  getters: any;
  actions: any;
  mutations: any
}
