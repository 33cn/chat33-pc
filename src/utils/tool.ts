// 工具函数
import electron from 'electron';
import fs from 'fs';
import crypto from 'crypto-browserify';
import { ChannelType } from '@/config/const-enums';
import {
  LocalStorageUsage
} from "@/config/config-enum";
import { ApiMsg } from '@/config/apiTypings'
import { ipcRenderer } from 'electron';
import { randomBytes } from 'crypto';

const SimConsts = {
  aesNonceLength: 12,
  aesKeyLength: 32,
  gcmTagSize: 16
}
/**
   * 记录本地最新消息时间
   */
export function updateLatestMsgTime(id: string, time: number) {
  const userInfo = JSON.parse(
    localStorage.getItem(`${id}`) || "null"
  );
  if (userInfo && Number(userInfo.latestMsgTime) > time) {
    // 旧的最新时间更新则（消息时序导致）（旧消息未收到前断开会漏消息）
    return;
  }
  const LatestMsgTime: string = LocalStorageUsage.LatestMsgTime;
  const storage: any = {};
  storage[LatestMsgTime] = time;
  localStorage.setItem(`${id}`, JSON.stringify(Object.assign({}, userInfo, storage)));
}
/**
 * 记录本地最新密钥消息时间
 */
export function updateLatestGroupKeyTime(id: string, time: number) {
  const userInfo = JSON.parse(
    localStorage.getItem(`${id}`) || "null"
  );
  if (userInfo && Number(userInfo.latestGroupKeyTime) < time) {
    //时间往前回拉群密钥
    return;
  }
  const latestGroupKeyTime: string = LocalStorageUsage.LatestGroupKeyTime;
  const storage: any = {};
  storage[latestGroupKeyTime] = time;
  localStorage.setItem(`${id}`, JSON.stringify(Object.assign({}, userInfo, storage)));
}
/**
 * 记录未读点赞数
 * @param params 
 */
export function recordUnreadLike(id: string, targetId: string, praise: any) {
  const userInfo = JSON.parse(
    localStorage.getItem(id) || "null"
  );
  if (!userInfo.unreadLike) userInfo.unreadLike = {};
  let likeCount = 0; let rewardCount = 0;
  if (praise.action === 'like') {
    likeCount = 1;
    rewardCount = 0;
  } else if (praise.action === 'reward') {
    likeCount = 0;
    rewardCount = 1;
  }
  if (!(targetId in userInfo.unreadLike)) {
    userInfo.unreadLike[targetId] = { like: likeCount, reward: rewardCount };
    localStorage.setItem(id, JSON.stringify(userInfo));
    return;
  }
  if (praise.action === 'like') {
    userInfo.unreadLike[targetId].like += 1;
  } else if (praise.action === 'reward') {
    userInfo.unreadLike[targetId].reward += 1;
  }
  localStorage.setItem(id, JSON.stringify(userInfo));
}

/**
 * 删除未读点赞数
 * @param params 
 */
export function removeUnreadLike(id: string, targetId: string) {
  const userInfo = JSON.parse(
    localStorage.getItem(id) || "null"
  );
  if (userInfo.unreadLike && (targetId in userInfo.unreadLike)) {
    delete userInfo.unreadLike[targetId];
    localStorage.setItem(id, JSON.stringify(userInfo));
  }
}

/**
 * 本地私钥和对端公钥生成会话密钥
 * @param privateKey 私钥
 * @param publicKey 公钥
 */
export function generateSessionKey(privateKey: string, publicKey: string): string {
  const ecdh: any = crypto.createECDH('secp256k1');
  ecdh.setPrivateKey(toStandardHex(privateKey), 'hex');
  const sessionKey: string = ecdh.computeSecret(toStandardHex(publicKey), 'hex', 'hex');
  return sessionKey;
}
/**
 * 对称加密
 */
export function encryptSymmetric(key: string, painText: string): string {
  const salt = crypto.randomBytes(12);
  const ciper1 = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), salt, {
    authTagLength: SimConsts.gcmTagSize
  });
  let cryptedText = ciper1.update(painText, 'utf8', 'hex');
  cryptedText += ciper1.final('hex');
  const tag = ciper1.getAuthTag();
  const buffer = Buffer.concat([Buffer.from(cryptedText, 'hex'), tag, salt]);
  return buffer.toString('hex');
}
/**
 *  对称解密
 */
export function dencryptSymmetric(key: string, ciphertext: string) {
  const byteR1 = Buffer.from(ciphertext, 'hex');
  const salt = byteR1.slice(byteR1.length - SimConsts.aesNonceLength, byteR1.length);
  // 密文文本部分为原文末尾分别减去盐和标识
  const text = byteR1.slice(0, byteR1.length - SimConsts.aesNonceLength - SimConsts.gcmTagSize);
  const dCiper1 = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), salt, {
    authTagLength: SimConsts.gcmTagSize
  });
  const decryptedText = dCiper1.update(text, 'hex');
  return decryptedText.toString('utf-8');
}
/**
 * 用于加密自己的钱包密码 使用方式：创建密码后，通过调用这个接口对密码进行加密
 */
export function EncPasswd(password: string | number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      //去主进程执行密码加密算法
      const listenEvent = 'crypto-pass';
      ipcRenderer.once(listenEvent, (event: any, encdPassword: Buffer) => {
        resolve(encdPassword);
      });
      ipcRenderer.send('crypto-password', {
        password: password,
        listenEvent
      });
    } catch (error) {
      reject(error);
    }
  })
}
/**
 * 使用password对seed进行aesgcm加密,返回加密后的助记词
 */
export function SeedEncKey(password: Buffer, mnem: string): string {
  let salt = Buffer.alloc(32);
  if (password.length > 32) {
    salt = password.slice(0, 32);
  } else {
    password.copy(salt)
  }
  let ciper = crypto.createCipheriv('aes-256-gcm', password, salt.slice(0, 12), {
    authTagLength: SimConsts.gcmTagSize
  });
  let cryptedText = ciper.update(mnem, 'utf8', 'hex');
  cryptedText += ciper.final('hex');
  let tag = ciper.getAuthTag();
  let buffer = Buffer.concat([Buffer.from(cryptedText, 'hex'), tag]);
  return buffer.toString('hex');
}
/**
 * 使用password对seed进行aesgcm解密,返回解密后的助记词
 */
export function SeedDecKey(password: Buffer, encMnem: string) {
  let salt = Buffer.alloc(32);
  if (password.length > 32) {
    salt = password.slice(0, 32);
  } else {
    password.copy(salt)
  }
  let enc = Buffer.from(encMnem, 'hex');
  let text = enc.slice(0, enc.length - SimConsts.gcmTagSize);

  let dCiper = crypto.createDecipheriv('aes-256-gcm', password, salt.slice(0, 12), {
    authTagLength: SimConsts.gcmTagSize
  });
  // dCiper.setAutoPadding(true);
  let decryptedText = dCiper.update(text, 'hex');
  // decryptedText += dCiper.final('hex');
  return decryptedText.toString('utf-8');
}
/**
 *  随机生成256位密钥
 */
export function create256Key() {
  return crypto.randomBytes(32).toString('hex');
}
/**
 * 过滤16进制字符串前的0x
 */
export function toStandardHex(hexKey: string) {
  if (hexKey && hexKey.substr(0, 2).toLowerCase() === '0x') {
    return hexKey.substring(2, hexKey.length);
  } else {
    return hexKey;
  }
}
/**
 * 将本地缓存结构转换为接口结构
 */
export function local2ApiMsg(local: any, isGroup: boolean = true): ApiMsg {
  return {
    logId: String(local.LOG_ID),
    channelType: isGroup ? ChannelType.Group : ChannelType.Friend,
    fromId: local.FROM_ID,
    targetId: local.TARGET_ID,
    msgType: local.MSG_TYPE,
    msg: JSON.parse(local.MESSAGE),
    datetime: local.TIME,
    praise: JSON.parse(local.PRAISE),
    senderInfo: {
      nickname: local.SENDER_NAME,
      avatar: local.SENDER_AVATAR
    },
    isSnap: local.IS_SNAP
  };
}

/**
 * 在字符串中插入字符串
 * @param oldString 原字符串
 * @param val 要插入的字符串
 * @param index 插入位置
 * @param deleteCount 删除数量
 */
export function insertStr(oldString: string, val: string, index: number, deleteCount: number) {
  const old = oldString.split('');
  const text = val.split('');
  old.splice(index, deleteCount, ...text);
  return old.join('');
}

/**
 * 将图片文件转为DataUrl展示
 * @param file
 */
export function file2DataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e: any) => {
      resolve(e.target.result);
    };
  });
}

export function getLikeState(state: number, msg: any, sendByme: boolean): number {
  const stateStr = state.toString(2);
  let stateArr = stateStr.split("");
  if (!sendByme) {
    return state
  } else if (msg.action === "like") {
    stateArr[stateArr.length - 1] = "1";
    return Number(stateArr.join(""));
  } else if (msg.action === "reward") {
    stateArr[stateArr.length - 2] = "1";
    return Number(stateArr.join(""));
  } else {
    return state
  }
}

/**
 * 检测是否是数字和字母或符号组合而且是8-16个字符
 */
export function checkPassword(str: string) {
  var re = /^(?![0-9]+$)(?![a-zA-Z]+$)(?![!?,.;:'"]+$)[0-9A-Za-z!?,.;:'"]{8,16}$/g;  //判断字符串是否为数字和字母组合     //判断正整数 /^[1-9]+[0-9]*]*$/  
  if (!re.test(str)) {
    return false;
  } else {
    return true;
  }
}

/**
 * 判断是否是数字和字母组合
 * @param nubmer 
 */
export function checkRate(str: string) {

  var re = /^[0-9a-zA-Z]*$/g;  //判断字符串是否为数字和字母组合     //判断正整数 /^[1-9]+[0-9]*]*$/  
  if (!re.test(str)) {
    return false;
  } else {
    return true;
  }
}
/**
 * 判断是否含有中文
 * @param str 
 */
export function funcChina(str: string) {
  if (/.*[\u4e00-\u9fa5]+.*$/.test(str)) {
    return true;
  } else {
    return false;
  }
}
/**
 * 
 * @param str 判断是否是json字符串
 */
export function isJsonString(str: string) {
  try {
    if (typeof JSON.parse(str) == "object") {
      return true;
    }
  } catch (e) {
  }
  return false;
}
/**
 * 将base64的url转换为File
 */
export function base64ToFile(dataURL: string, name: string) {
  const splits = dataURL.split(',');
  const bytes = window.atob(splits[1]);
  const mime = (splits[0].match(/:(.*?);/) as any[])[1];
  const arr = [];
  for (let i = 0, len = bytes.length; i < len; i += 1) {
    arr.push(bytes.charCodeAt(i));
  }
  return new File([new Uint8Array(arr)], name, { type: mime });
}

/**
 * 搜索判断符合结果的方法
 */
export function checkInclude(target: string, query: string): boolean {
  return target.indexOf(query) > -1;
}

/**
 * 打开本地文件
 */
export function openLocalFile(fullPath: string) {
  electron.shell.openItem(fullPath);
}

/**
 * byte转为大小字符串
 * @param byte
 */
export function formatSize(byte: number) {
  if(!byte) return ''
  const KB = 1024;
  const MB = KB * 1024;

  if (byte < KB) {
    return `${byte}B`;
  } else if (byte < MB) {
    return `${Math.floor(byte * 10 / KB) / 10}KB`;
  } else {
    return `${Math.floor(byte * 10 / MB) / 10}MB`;
  }
}

/**
 * 时间戳转为2018-1-11
 */
export function formatDate(datetime: number, keep2word: boolean = false): string {
  const date = new Date(datetime);
  const month = date.getMonth() + 1;
  let monthStr = String(month);
  const day = date.getDate();
  let dateStr = String(day);
  if (keep2word) {
    if (month < 10) {
      monthStr = `0${month}`;
    }
    if (day < 10) {
      dateStr = `0${day}`;
    }
  }
  return `${date.getFullYear()}-${monthStr}-${dateStr}`;
}

/**
 * 
 * @param time 
 */
export function formatVideoTime(datetime: number) {
  const minute = String(datetime).split('.').shift();
  const second = (String(datetime).split('.').pop() as string).substr(0, 2);
  return `${minute}:${second}`
}

export function formatFullDate(time: number = +new Date()) {
  var date = new Date(time + 8 * 3600 * 1000); // 增加8小时
  return date.toJSON().substr(0, 19).replace('T', ' ');
}

export function copyFile2Clipboard(filePath: string, onError?: (e: any) => void) {
  fs.readFile(filePath, (err, data) => {
    if (err && onError) {
      onError(err);
    } else {
      electron.clipboard.writeBuffer('text/plain', data); // todo 1 复制文件实现
    }
  });
}

export function formatDateString(datetime: number) {
  const date = new Date(datetime);
  const h = date.getHours();
  const m = date.getMinutes();
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}号${h < 10 ? 0 : ''}${h}:${m < 10 ? 0 : ''}${m}`;
}