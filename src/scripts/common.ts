import { FileMsgConfig } from './../object/messages/FileMsg';
import { ImageMaxSize, LabelEnum } from '@/config/config-enum';
import { GroupMember, UserLoggedInfo } from '@/scripts/object';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import { ChannelType, IsSnap, MsgDetailType, MsgType, RelayType } from '@/config/const-enums';
import OSS from 'ali-oss';
import { post } from '@/plugins/axios-plugin';
import URLS from '@/config/urls';
import notify from '@/plugins/NotifyPop';
import { ApiMsg, SenderInfo, RelayMsgItem } from '@/config/apiTypings';
import { MessageType } from '@/object/messages';
import GroupAnnounce from '@/object/messages/GroupAnnounce';
import { BaseMsgConfig } from '@/object/messages/BaseMsg';
import LabelNotice from '@/object/messages/notice/LabelNotice';
import LikeNotice from '@/object/messages/notice/LikeNotice';
import PayNotice from '@/object/messages/notice/PayNotice';
import TextMsg from '@/object/messages/TextMsg';
import SnapTextMsg from '@/object/messages/snapMsg/SnapTextMsg';
import RelayTextMsg from '@/object/messages/singleRelay/RelayTextMsg';
import AudioMsg from '@/object/messages/AudioMsg';
import SnapAudioMsg from '@/object/messages/snapMsg/SnapAudioMsg';
import SnapImageMsg from '@/object/messages/snapMsg/SnapImageMsg';
import RelayImageMsg from '@/object/messages/singleRelay/RelayImageMsg';
import PacketMsg from '@/object/messages/PacketMsg';
import VideoMsg from '@/object/messages/VideoMsg';
import RelayVideoMsg from '@/object/messages/singleRelay/RelayVideoMsg';
import MultiRelayMsg from '@/object/messages/MultiRelayMsg';
import FileMsg from '@/object/messages/FileMsg';
import RelayFileMsg from '@/object/messages/singleRelay/RelayFileMsg';
import PayMsg from '@/object/messages/PayMsg';
import ImageMsg from '@/object/messages/ImageMsg';
import { ErrorMsg } from '@/config/config-enum';

function formatNum(val: number): string {
  return val < 10 ? `0${val}` : `${val}`;
}

function formatShortDate(val: number, isComplete?: boolean): string {
  if (val === 0) {
    return '';
  }
  const date = new Date(val);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const now = new Date();
  const isToday = val > new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const short = `${formatNum(hour)}:${formatNum(minute)}`;
  return isToday ? short : `${year}/${formatNum(month)}/${formatNum(day)}${isComplete ? ` ${short}` : ''}`;
}

function formatChatTime(val: number): string {
  const time = new Date(val);
  const year = time.getFullYear();
  const month = time.getMonth() + 1;
  const date = time.getDate();
  const hour = time.getHours();
  const minute = time.getMinutes();
  const now = new Date();
  const isToday = val > new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let result = '';
  if (!isToday) {
    result = `${year}/${month}/${date}`;
  }
  result += ` ${formatNum(hour)}:${formatNum(minute)}`;
  return result;
}

function getImgHeight(width: number, height: number): number {
  const naturalWidth = width;
  const naturalHeight = height;
  const scale = naturalWidth / naturalHeight;
  const widthWhenHeightMax = scale * ImageMaxSize.HEIGHT;
  const heightWhenWidthMax = ImageMaxSize.WIDTH / scale;
  if (naturalHeight <= ImageMaxSize.HEIGHT && naturalWidth <= ImageMaxSize.WIDTH) {
    return naturalHeight;
  }
  return widthWhenHeightMax <= ImageMaxSize.WIDTH ? ImageMaxSize.HEIGHT : heightWhenWidthMax;
}

/**
 * 转换各接口的消息格式 todo 优化整理接口转换相关
 * @param apiMsg 消息中的msg字段对象
 * @param type 消息中的msgType字段
 */
function formatApiMsg(apiMsg: any, type: MsgType): string {

  return '不支持啊啊啊啊啊'; // todo 检查检测弹窗应用
}

/**
 * 合并转发消息转换为Message格式
 * @param apiMsg
 */
function getRelayMsgToMessage(relayMsg: RelayMsgItem): MessageType {
  const baseMsgConfig: BaseMsgConfig = {
    id: relayMsg.logId,
    sendTime: relayMsg.msg.datetime,
    senderId: relayMsg.msg.fromId,
    receiverId: relayMsg.msg.targetId,
    sender: relayMsg.msg.sender,
    isSendByMe: relayMsg.msg.sender instanceof UserLoggedInfo,//todo是否是本人发送的待检验
    senderInfo: relayMsg.senderInfo,
    msgType: relayMsg.msgType
  };
  const config: any = {
    base: baseMsgConfig,
    typeConfig: {},
    // featureConfig: {},
    snapObject: null,
    relayObject: null,
    baseObject: null
  };
  switch (relayMsg.msgType) {
    case MsgType.System: {
      const msg = relayMsg.msg.encryptedMsg || relayMsg.msg;
      config.baseObject = TextMsg
      config.typeConfig = {
        content: msg.content || ErrorMsg.ERROR_DECRYPTO
      };
      break;
    }
    case MsgType.Text: {
      const msg = relayMsg.msg.encryptedMsg || relayMsg.msg;
      config.baseObject = TextMsg;
      config.snapObject = SnapTextMsg;
      config.relayObject = RelayTextMsg;
      config.typeConfig = {
        content: msg.content || ErrorMsg.ERROR_DECRYPTO
      };
      break;
    }
    case MsgType.Audio: {
      const msg = relayMsg.msg.encryptedMsg || relayMsg.msg;
      config.baseObject = AudioMsg;
      config.snapObject = SnapAudioMsg;
      config.typeConfig = {
        url: msg.url,
        duration: relayMsg.datetime
      };
      break;
    }
    case MsgType.Picture: {
      const msg = relayMsg.msg.encryptedMsg || relayMsg.msg;
      config.baseObject = ImageMsg;
      config.snapObject = SnapImageMsg;
      config.relayObject = RelayImageMsg;

      config.typeConfig = {
        url: msg.imageUrl,
        width: msg.width,
        height: msg.height,
        unenc: (typeof (msg) !== 'string') || ErrorMsg.ERROR_DECRYPTO
      }

      break;
    }
    case MsgType.Video: {
      const msg = relayMsg.msg.encryptedMsg || relayMsg.msg;
      config.baseObject = VideoMsg;
      config.relayObject = RelayVideoMsg;
      config.typeConfig = {
        url: msg.mediaUrl,
        width: msg.width,
        height: msg.height,
        duration: msg.time
      };
      break;
    }
    case MsgType.File: {
      const msg = relayMsg.msg.encryptedMsg || relayMsg.msg;
      config.baseObject = FileMsg;
      config.relayObject = RelayFileMsg;
      config.typeConfig = {
        url: msg.fileUrl,
        size: msg.size,
        md5: msg.md5,
        fileName: msg.name
      };
      break;
    }
    default:
      config.baseObject = TextMsg;
      config.typeConfig = {
        content: '[当前版本不支持该消息类型]'
      };
  }
  let ResultObj = config.baseObject;
  return new ResultObj(Object.assign({}, config.base, config.typeConfig));
}
/**
 * 接口字段转换为Message格式
 * @desc 用于object中的各聊天对象，发送者和接受者信息由外部维护
 */
function getApi2Message(apiMsg: ApiMsg, sender: Friend | GroupMember | UserLoggedInfo, enCrypted: boolean): MessageType { // todo 失类型

  const msg = apiMsg.msg.encryptedMsg || apiMsg.msg;
  const baseMsgConfig: BaseMsgConfig = {
    id: apiMsg.logId,
    msgId: apiMsg.msgId || '',
    sendTime: apiMsg.datetime,
    senderId: apiMsg.fromId,
    receiverId: apiMsg.targetId,
    sender,
    isSendByMe: sender instanceof UserLoggedInfo,
    senderInfo: apiMsg.senderInfo,
    msgType: apiMsg.msgType,
    praise: apiMsg.praise
  };
  const isSnap = apiMsg.isSnap === IsSnap.yes; // 是阅后即焚消息
  const isSingleRelay = msg.forwardType === RelayType.Single; // 是逐条转发消息
  const config: any = {
    base: baseMsgConfig,
    typeConfig: {},
    // featureConfig: {},
    snapObject: null,
    relayObject: null,
    baseObject: null
  };
  switch (apiMsg.msgType) {
    case MsgType.System: {
      config.baseObject = isSingleRelay ? TextMsg : GroupAnnounce; // 单条转发以文字显示
      config.typeConfig = {
        content: msg.content || ErrorMsg.ERROR_DECRYPTO
      };
      break;
    }
    case MsgType.Text: {
      config.baseObject = TextMsg;
      config.snapObject = SnapTextMsg;
      config.relayObject = RelayTextMsg;
      config.typeConfig = {
        content: msg.content || ErrorMsg.ERROR_DECRYPTO
      };
      break;
    }
    case MsgType.Audio: {
      if (isSingleRelay) {
        config.baseObject = TextMsg;
        config.relayObject = RelayTextMsg;
        config.typeConfig = {
          content: LabelEnum.AUDIO_LABEL || ErrorMsg.ERROR_DECRYPTO
        };
      } else {
        config.baseObject = AudioMsg;
        config.snapObject = SnapAudioMsg;
        config.typeConfig = {
          url: msg.mediaUrl,
          duration: msg.time
        };
      }
      break;
    }
    case MsgType.Picture: {
      config.baseObject = ImageMsg;
      config.snapObject = SnapImageMsg;
      config.relayObject = RelayImageMsg;
      if (isSingleRelay) {
        config.typeConfig = {
          url: msg.imageUrl,
          width: msg.width,
          height: msg.height,
          unenc: (typeof (msg) !== 'string') || ErrorMsg.ERROR_DECRYPTO
        }
      } else {
        config.typeConfig = {
          url: msg.imageUrl,
          width: msg.width,
          height: msg.height,
          unenc: (typeof (msg) !== 'string') || ErrorMsg.ERROR_DECRYPTO
        }
      }
      break;
    }
    case MsgType.Packet: {
      if (isSingleRelay) {
        config.baseObject = TextMsg;
        config.relayObject = RelayTextMsg;
        config.typeConfig = {
          content: LabelEnum.PACKET_LABEL,
        };
      } else {
        config.baseObject = PacketMsg;
        config.typeConfig = {
          packetNote: msg.remark
        };
      }
      break;
    }
    case MsgType.Video: {
      config.baseObject = VideoMsg;
      config.relayObject = RelayVideoMsg;
      if (isSingleRelay) {
        config.typeConfig = {
          url: msg.mediaUrl,
          width: msg.width,
          height: msg.height,
          duration: msg.time
        };
      } else {
        config.typeConfig = {
          url: msg.mediaUrl,
          width: msg.width,
          height: msg.height,
          duration: msg.time
        };
      }
      break;
    }
    case MsgType.Notify: {
      if (msg.type === MsgDetailType.ReceivePay) { // 收款通知
        config.baseObject = PayNotice;
        config.typeConfig = {
          isPayByMe: baseMsgConfig.isSendByMe
        };
      } else {
        let content;
        config.baseObject = LabelNotice;
        if (msg.type === MsgDetailType.CutScreen) {
          content = baseMsgConfig.isSendByMe ? LabelEnum.CUT_SCREEN_ME : LabelEnum.CUT_SCREEN;
        } else if (msg.type === MsgDetailType.likeAndReward) {
          // const actions = new Map([
          //   ['like','点赞'],
          //   ['cancel_like','取消点赞'],
          //   ['reward','打赏'],
          //   ['default','']
          // ])
          // content  = actions.get(msg.action) || actions.get('default');
          config.baseObject = LikeNotice;
        } else {
          content = msg.content;
        }
        config.typeConfig = {
          content
        };
      }
      break;
    }
    case MsgType.RelayMsg: {
      if (isSingleRelay) {
        config.relayObject = RelayTextMsg;
        config.baseObject = TextMsg;
        config.typeConfig = {
          content: LabelEnum.RELAY_LABEL
        };
      } else {
        config.baseObject = MultiRelayMsg;
        config.typeConfig = {
          relayContent: msg
        };
      }
      break;
    }
    case MsgType.File: {
      config.baseObject = FileMsg;
      config.relayObject = RelayFileMsg;
      if (isSingleRelay) {
        config.typeConfig = {
          url: msg.fileUrl,
          size: msg.size,
          md5: msg.md5,
          fileName: msg.name
        };
      } else {
        config.typeConfig = {
          url: msg.fileUrl,
          size: msg.size,
          md5: msg.md5,
          fileName: msg.name
        };
      }
      break;
    }
    case MsgType.Pay: {
      config.baseObject = PayMsg;
      config.relayObject = RelayTextMsg;
      config.typeConfig = {
        coinName: msg.coinName,
        amount: msg.amount,
        recordId: msg.recordId,
        isCharge: false
      };
      break;
    }
    case MsgType.Charge: {
      config.baseObject = PayMsg;
      config.relayObject = RelayTextMsg;
      config.typeConfig = {
        coinName: msg.coinName,
        amount: msg.amount,
        recordId: msg.recordId,
        isCharge: true
      };
      break;
    }
    default: {
      config.baseObject = TextMsg;
      config.typeConfig = {
        content: '[当前版本不支持该消息类型]'
      };
    }
    // 产生文字提示不支持该消息
  }
  let ResultObj = config.baseObject;
  if (isSnap) {
    ResultObj = config.snapObject || config.baseObject;
  } else if (isSingleRelay) {
    ResultObj = config.relayObject || config.baseObject;
    return new ResultObj(Object.assign({}, config.base, config.typeConfig, {
      isRelayFromGroup: msg.channelType === ChannelType.Group,
      singleRelayFromName: msg.fromName
    }));
  }
  return new ResultObj(Object.assign({}, config.base, config.typeConfig));
}

/**
 * 将base64的url转换为Blob
 * @param dataURL base64URL
 * @returns {Blob} 供上传的Blob
 */
function base64ToBlob(dataURL: any) {
  const bytes = window.atob(dataURL.split(',')[1]);
  const arr = [];
  for (let i = 0, len = bytes.length; i < len; i += 1) {
    arr.push(bytes.charCodeAt(i));
  }
  return new Blob([new Uint8Array(arr)], { type: 'image/png' });
}

/**
 * 上传头像
 * @param fileBlob 二进制文件
 * @param type 聊天文件chat/用户头像avatar/群头像groupAvatar/用户备注图片note/视频消息video
 * @param userId 附加图片：用户id
 * @returns {IDBRequest | Promise<void>}
 */
function upLoadOssFile({ fileBlob, type = 'chat', userId }: any) { // todo 移除
  const client = new OSS({
    endpoint: process.env.VUE_APP_OSSIP,
    accessKeyId: process.env.VUE_APP_OSSKEY,
    accessKeySecret: process.env.VUE_APP_OSSSECRET,
    bucket: process.env.VUE_APP_OSSBUKET
  });
  const fileType = fileBlob.name.split('.').pop();
  // const fileType = fileBlob.path.split('.').pop();
  let url = 'chat33/';
  if (type === 'chat') { // 聊天消息图片或语音 todo switch
    const date = new Date();
    const year = date.getFullYear();
    const month = formatNum(date.getMonth() + 1);
    const day = formatNum(date.getDay());
    const hour = formatNum(date.getHours());
    const minute = formatNum(date.getMinutes());
    const second = formatNum(date.getSeconds());
    const millisecond = String(date.getMilliseconds())[1];
    const dateStr = `${year}${month}${day}`;
    const timeStr = `${dateStr}${hour}${minute}${second}${millisecond}`;
    const typeStr = ['png', 'jpg', 'jpeg'].indexOf(fileType) > -1 ? 'picture' : 'voice';
    const flag = Math.floor(Math.random() * 10000);
    url += `chatList/${typeStr}/${dateStr}/${timeStr}_${userId}_${flag}.${fileType}`;
    // chat33/chatList/picture/20180201/201802011230100_123123221.png
  } else if (type === 'avatar') { // 用户头像
    url += `user/avatar/${Date.now()}_${userId}.${fileType}`; // chat33/user/avatar/12312312.png
  } else if (type === 'groupAvatar') {
    url += `group/avatar/${Date.now()}_${userId}.${fileType}`;
  } else if (type === 'note') {
    url += `note/${Date.now()}_${userId}.${fileType}`;
  } else if (type === 'video') {
    url += `video/${Date.now()}_${userId}.${fileType}`;
  } else {
    throw new Error('错误的type');
  }
  return client.put(url, fileBlob);
}

/**
 * 转换倒计时样式
 */
function formatDateCount(datetime: number) {
  const time = datetime / 1000;
  const preHour = 3600;
  const preMinute = 60;
  const hour = Math.floor(time / preHour);
  const hourStr = hour > 9 ? hour : `0${hour}`;
  const minute = Math.floor((time % preHour) / preMinute);
  const minuteStr = minute > 9 ? minute : `0${minute}`;
  const second = Math.round(time % preMinute);
  const secondStr = second > 9 ? second : `0${second}`;
  return `${hourStr}:${minuteStr}:${secondStr}`;
}

/**
 * 提交取消禁言并提示
 * @param groupId
 * @param memberId
 */
async function submitCancelMuted(groupId: string, memberId: string) {
  const data = await post(URLS.SET_SINGLE_MUTED, {
    roomId: groupId,
    userId: memberId,
    deadline: 0
  });
  if (data) {
    notify.success('解除成功');
  }
  return data;
}

/**
 * 获取字符串首字母
 */
function getFirstLetter(str: string): string {
  const compareStr = ['啊', '吧', '擦', '搭', '妸', '发', '旮', '哈', '击', '咖', '垃', '妈', '那', '哦', '葩', '妻', '燃', '仨', '它', '挖', '夕', '原', '匝'];
  const UpperCode = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'];
  const charCode = str.charCodeAt(0);
  if (charCode > 65 && charCode < 122) {
    return str[0].toUpperCase();
  } else if (charCode > 255) {
    for (let i = compareStr.length; i--;) {
      if (str.localeCompare(compareStr[i], 'zh-Hans-CN', { sensitivity: 'accent' }) > 0) {
        return UpperCode[i];
      }
    }
    return 'A';
  } else {
    return '#';
  }
}

function groupByFirstLetter(objects: any[], getKey: (item: any) => string) {
  const map: any = {};
  objects.forEach((item: any) => {
    const letter = getFirstLetter(getKey(item));
    if (!map[letter]) {
      map[letter] = [];
    }
    map[letter].push(item);
  });
  const result = Object.keys(map).map((valueKey: string) => {
    return {
      letter: valueKey,
      list: map[valueKey]
    };
  });
  return result.sort((a: any, b: any) => {
    if (b.letter === '#') {
      return -1;
    }
    if (a.letter === '#') {
      return 1;
    }
    return a.letter > b.letter ? 1 : -1;
  });
}

/**
 * 将图片转换为base64
 */
function getBase64Image(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas.toDataURL();
}

/**
 * 将网络图片转换为base64
 * @param src
 */
function getBase64(src: string): Promise<string> {
  return new Promise((resolve, rej) => {
    const image = new Image();
    // image.crossOrigin = '';
    image.src = src;
    image.onload = () => {
      resolve(getBase64Image(image));
    };
    image.onerror = (err) => { // todo 处理图片加载异常
      rej('error');
    };
  });
}

export {
  formatShortDate,
  formatChatTime,
  getImgHeight,
  getApi2Message,
  getRelayMsgToMessage,
  base64ToBlob,
  upLoadOssFile,
  formatDateCount,
  submitCancelMuted,
  groupByFirstLetter,
  formatApiMsg,
  getBase64
};
