import {ApplyItem} from '@/config/apiTypings';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import {MsgType} from '@/config/const-enums';
import {MessageType} from '@/object/messages';
import AudioMsg from '@/object/messages/AudioMsg';
import SnapAudioMsg from '@/object/messages/snapMsg/SnapAudioMsg';

export interface EmitApplyClick {
  apply: ApplyItem;
  id: string;
  e: MouseEvent;
  isGroup: boolean;
}

export interface PictureReaderProp {
  file: File;
  url: string;
}

export enum RouterName {
  Login = 'login',
  Main = 'main',
  Chat = 'chat',
  Contact = 'contact',
  Set = 'set'
}

export enum RouterPath {
  Login = '/login',
  Main = '/main',
  Logging = '/logging',
  Chat = '/chat',
  Contact = '/contact',
  Set = '/set'
}

// localStorage key
export enum StorageName {
  FileMap = 'file-map' // 文件网路url映射本地路径
}

export const FileFolderName = 'file'; // 文件存放文件夹名

export interface ShowMessageSelectEventParam {
  message: MessageType;
  event: MouseEvent;
  isRelayDialog: boolean;
}

export interface ClickAudioParam {
  audioMessage: AudioMsg | SnapAudioMsg;
  target: Friend | Group;
}


export interface NoteTel { // 电话备注项
  label: string;
  value: string;
  key: string;
}

export interface PicItem {
  url: string;
  file: File | null;
  isDataUrl: boolean;
}

export interface FileItemType { // 上传文件项
  id: string;
  name: string;
  size: number;
  time: number;
  senderId: string;
  senderName: string;
  url: string; // 本地或oss
  localPath: string; // 本地文件路径
}

export interface FileListPicItem {
  url: string;
  time: number;
}

export interface FileListVideoItem {
  url: string;
  localPath: string;
  time: number;
  duration: number;
  width: number;
  height: number;
}

export interface PicVideoListItem {
  timeStr: string;
  items: Array<FileListPicItem | FileListVideoItem>;
}

export interface OnSendParam { // chat-footer event参数
  content: string | File;
  type: MsgType;
}

export interface LogCallback {
  onClickLogin?: () => void; // 点击登录/注册按钮
  onFail?: () => void; // onClickLogin后中断
  onRegSuccess?: () => void; // 成功注册
  onLogSuccess?: (token: string) => void;
}
