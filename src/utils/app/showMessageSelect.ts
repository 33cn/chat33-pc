import { ChannelType } from './../../config/const-enums';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import {copy2Clipboard, getFilePath} from '@/utils/app/index';
import {MemberMutedSet, MemberType, MutedSet} from '@/config/const-enums';
import showContextMenu from '@/plugins/ContextMenu';
import {MessageStatus, REVOKE_TIME_LIMIT} from '@/config/config-enum';
import {submitCancelMuted} from '@/scripts/common';
import {copyFile2Clipboard, openLocalFile} from '@/utils/tool';
import Notify from '@/plugins/NotifyPop';
import {ipcRenderer} from 'electron';
import {MessageType} from '@/object/messages';
import GroupAnnounce from '@/object/messages/GroupAnnounce';
import ImageMsg from '@/object/messages/ImageMsg';
import TextMsg from '@/object/messages/TextMsg';
import SnapTextMsg from '@/object/messages/snapMsg/SnapTextMsg';
import SnapImageMsg from '@/object/messages/snapMsg/SnapImageMsg';
import PacketMsg from '@/object/messages/PacketMsg';
import SnapAudioMsg from '@/object/messages/snapMsg/SnapAudioMsg';
import VideoMsg from '@/object/messages/VideoMsg';
import FileMsg from '@/object/messages/FileMsg';
import AudioMsg from '@/object/messages/AudioMsg';
import MultiRelayMsg from '@/object/messages/MultiRelayMsg';

import store from "@/store";
import {LabelEnum} from '@/config/config-enum';

interface ShowMessageSelectParam {
  message: MessageType;
  event: MouseEvent;
  target: Group | Friend;
  isRelayDialog: boolean; // 是合并转发显示弹窗
  myId: string;
  onMultiSelect: () => void;
  onRelay?: () => void;
  onMuted: () => void;
  onClose: () => void;
}

/**
 * 判断右键是否显示点赞
 */
function needShowLike(message:MessageType,myId:string):boolean {
  return message.senderId !== myId  && (message.state ===0 || message.state ===2) && !((message instanceof TextMsg || message instanceof VideoMsg || message instanceof FileMsg || message instanceof AudioMsg || message instanceof MultiRelayMsg ) && message.content === LabelEnum.DECRYPTO_LABEL)
}

/**
 * 判断右键是否显示复制
 */
function needShowCopy(msg: MessageType): boolean {
  const isType = (msg instanceof GroupAnnounce) || (msg instanceof TextMsg) || (msg instanceof ImageMsg);
  const isSnap = (msg instanceof SnapTextMsg) || (msg instanceof SnapImageMsg);
  return isType && !isSnap;
}

/**
 * 判断右键是否显示撤销
 */
function needShowRevoke(message: MessageType, target: Group | Friend): boolean {
  if (message instanceof GroupAnnounce) {
    return (target as Group).myLevel !== MemberType.Member; // 管理员/群主可撤回任意群公告
  }
  if (message instanceof PacketMsg) { // 红包不能撤回
    return false;
  }
  if (message.sendStatus !== MessageStatus.Success) { // 发送中的禁止撤回
    return false;
  }
  const inTime = Date.now() - message.sendTime < REVOKE_TIME_LIMIT; // 时间够
  const isSendByMe = message.isSendByMe;
  if (target instanceof Friend) { // 好友消息
    return isSendByMe && inTime;
  }
  if (target.myLevel === MemberType.Owner) { // 群主可撤回所有人不限时间
    return true;
  } else if (target.myLevel === MemberType.Manager) { // 管理员可撤回成员和自己不限时间
    const senderMember = target.memberList.find((item) => item.id === message.senderId);
    if (senderMember) { // 正常聊天消息本地都已保存成员
      return isSendByMe || senderMember.type === MemberType.Member;
    }
    return true;
  }
  return isSendByMe && inTime; // 普通群成员可在时间内撤回自己的消息
}

/**
 * 判断右键是否显示转发
 */
function needShowRelay(message: MessageType): boolean {
  if (message instanceof GroupAnnounce) {
    return true;
  } else {
    if ((message instanceof SnapTextMsg) || (message instanceof SnapImageMsg) || (message instanceof SnapAudioMsg)) {
      return false;
    } else {
      return (message instanceof TextMsg) || (message instanceof ImageMsg) || (message instanceof VideoMsg) || (message instanceof FileMsg);
    }
  }
}

/**
 * 判断是否需要显示禁言/解除禁言
 */
function needShowMuted(message: MessageType, target: Group | Friend): boolean {
  if (target instanceof Group && !(message instanceof GroupAnnounce)) {
    if (target.myLevel !== MemberType.Member) {
      const sender = target.memberList.find((item) => item.id === message.sender.id);
      if (sender) {
        return sender.type === MemberType.Member;
      }
    }
  }
  return false;
}

/**
 * 是解除禁言
 */
function isCancelMuted(message: MessageType, target: Group) {
  const sender = target.memberList.find((item) => item.id === message.senderId);
  if (sender) {
    const inBlackList = target.mutedSet === MutedSet.BlackList && sender.memberMutedSet === MemberMutedSet.Black;
    const beforeEndTime = sender.mutedEndTime > Date.now();
    const isAllMuted = target.mutedSet === MutedSet.AllMuted;
    const notInWhiteList = target.mutedSet === MutedSet.WhiteList && sender.memberMutedSet !== MemberMutedSet.White;
    return inBlackList && beforeEndTime || isAllMuted || notInWhiteList;
  }
  return false;
}


/**
 * 执行复制
 * @param message
 */
function doCopy(message: MessageType) {
  if (message instanceof GroupAnnounce) {
    copy2Clipboard(false, message.content);
  } else {
    if (message instanceof TextMsg) {
      copy2Clipboard(false, message.content);
    } else if ((message instanceof FileMsg) || (message instanceof VideoMsg)) {
      const url = getFilePath(message.url);
      copyFile2Clipboard(url, () => {
        Notify.fail('文件复制失败');
      });
    } else if (message instanceof ImageMsg) { // 图片
      copy2Clipboard(true, message.url);
    }
  }
}

/**
 * 执行点赞
 * @param message 
 */
function doLike(message: MessageType,isGroup: Boolean) {
  store.dispatch('clickLike',{channelType:isGroup ? ChannelType.Group : ChannelType.Friend,logId:message.id,action:"like"});
}

function showMessageSelect(param: ShowMessageSelectParam) {
  const menuItems = [];
  const message = param.message;
  const target = param.target;

  //点赞
  if (needShowLike(message,param.myId)) {
    menuItems.push({
      label: '点赞',
      onClick: () => {
        doLike(message,target instanceof Group);
      }
    });
  }
  // 复制
  if (needShowCopy(message)) {
    menuItems.push({
      label: '复制',
      onClick: () => {
        doCopy(message);
      }
    });
  }
  // 打开
  if (!(message instanceof GroupAnnounce)) {
    if (message instanceof VideoMsg || message instanceof FileMsg) {
      let url: string = '';
      let name: string = '';
      if (message instanceof FileMsg) {
        url = message.url;
        name = message.fileName;
      } else {
        url = message.url;
        name = url.split('/').pop() as string;
      }
      const path = getFilePath(url);
      if (path) {
        menuItems.push({
          label: '打开',
          onClick: () => {
            openLocalFile(path);
          }
        });
        menuItems.push({
          label: '另存为',
          onClick: () => {
            ipcRenderer.send('save-to-dir', {
              path,
              name
            });
          }
        });
      }
    }
  }
  if (!param.isRelayDialog) { // 合并转发显示弹窗不显示部分选项
    // 转发
    if (needShowRelay(message)) {
      menuItems.push({
        label: '转发',
        onClick: () => {
          if (param.onRelay) {
            param.onRelay();
          }
        }
      });
    }
    // 删除
    menuItems.push({
      label: '删除',
      onClick: () => {
        target.deleteLocalMessage(message.id,target instanceof Group);
      }
    });
    // 多选
    menuItems.push({
      label: '多选',
      onClick: () => {
        param.onMultiSelect();
      }
    });
    // 撤回
    if (needShowRevoke(message, target)) {
      menuItems.push({
        label: '撤回',
        onClick: () => {
          Group.revokeMessage(message.id);
        }
      });
    }
    // 禁言
    if (needShowMuted(message, target)) {
      const group = target as Group;
      if (isCancelMuted(message, group)) {
        menuItems.push({
          label: '解除禁言',
          onClick: () => {
            submitCancelMuted(target.id, message.senderId).then((data: any) => {
              if (data) {
                group.getGroupDetail();
                group.getMembers();
              }
            });
          }
        });
      } else {
        menuItems.push({
          label: '禁言',
          onClick: () => {
            param.onMuted();
          }
        });
      }
    }
  }
  if (menuItems) {
    showContextMenu(menuItems, param.event, false, () => {
      param.onClose();
    });
  }
}

export default showMessageSelect;
