import {StateTypes} from './types';

const state: StateTypes = {
  groupList: [], // @State public groupList!: Group[];
  friendList: [], // @State public friendList!: Friend[];
  myInfo: null, // @State public myInfo!: UserLoggedInfo;
  socket: null, // @State public socket!: MySocket | null;
  isWin: false, // @State public isWin!: boolean;
  notifyEnable: false, // @State public notifyEnable!: boolean;
  applyCount: 0, // @State public applyCount!: number;
  chatTarget: null, // @State public chatTarget!: Group | Friend | null;
  audioPlaying: null, // @State public audioPlaying!: Message | null;
  audioPlayer: null, // @State public audioPlayer!: BenzAMRRecorder | null;
  datasource: null,
  isReg: true, //是否注册
  message: null //消息对象
};

export default state;
