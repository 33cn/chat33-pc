// 业务
import {clipboard, ipcRenderer, nativeImage, shell} from 'electron';
import fs from 'fs-extra';
import path from 'path';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import {getBase64} from '@/scripts/common';
import {showToast} from '@/plugins/Toast';
import Notify from '@/plugins/NotifyPop';
import {OnSendParam, StorageName} from '@/config/type';
import {ErrorMsg, FILE_SEND_LIMIT, FILE_SIZE_LIMIT} from '@/config/config-enum';
import {MsgType} from '@/config/const-enums';
import Bus from '@/scripts/bus';
import {MessageType} from '@/object/messages';

/**
 * 复制到剪切板（文字/图片）
 * @param isImage 是图片
 * @param data 文字字符串或图片网络url
 */
export async function copy2Clipboard(isImage: boolean, data: string) {
  if (isImage) {
    const base64 = await getBase64(data);
    if (base64) {
      const image = nativeImage.createFromDataURL(base64);
      clipboard.writeImage(image);
    }
  } else {
    clipboard.writeText(data);
  }
}

/**
 * 计算群和好友未读总数
 */
export function getUnreadCount(groupList: Group[], friendList: Friend[]): number {
  let list: Array<Group | Friend> = [];
  list = list.concat(groupList, friendList);
  return list.reduce((total, item) => {
    return item.muted ? total : total + item.unReadCount;
  }, 0);
}

/**
 * 获取最新一条聊天消息,（当前包括所有消息类型）
 */
export function getLastChatMsg(target: Friend | Group): MessageType | null {
  const len = target.msgHistory.length;
  if (len === 0) { // 点击发送消息切换到的对象可能无最新消息
    return null;
  }
  return target.msgHistory[len - 1];
}

/**
 * 新消息页菜单的排序方法
 */
export function sortTargetList(a: Friend | Group, b: Friend | Group): number {
  if (a.isTop === b.isTop) {
    const aLastMsg = getLastChatMsg(a);
    const aLastTime = aLastMsg ? aLastMsg.sendTime : 0;
    const bLastMsg = getLastChatMsg(b);
    const bLastTime = bLastMsg ? bLastMsg.sendTime : 0;
    return bLastTime - aLastTime;
  } else { // 1置顶优先
    return a.isTop ? -1 : 1;
  }
}

/**
 * 点击支持链接的消息，如果是链接则用默认浏览器打开
 * @param e
 */
export function handleClickLink(e: MouseEvent): void {
  const target = e.target as Element;
  if (target.nodeName === 'A') { // 点击的是链接
    let url = target.textContent as string;
    if (url.indexOf('://') < 0) {
      url = `http://${url}`;
    }
    shell.openExternal(url);
  }
}

/**
 * 根据文件名获取对象的文件图标
 */
export function getFileIcon(name: string) {
    name = name||'';
    let ext = name.split('.').pop() || 'other';
    ext = ext.toLowerCase();
    const MAP: any = {
      xls: 'xlsx',
      xlsx: 'xlsx',
      doc: 'word',
      docx: 'word',
      pdf: 'pdf',
      mp4: 'video',
      ogg: 'video',
      flv: 'video',
      rmvb: 'video',
      f4v: 'video',
      mkv: 'video',
      avi: 'video',
      mp3: 'music',
      amr: 'music',
      flac: 'music'
    };
    return require(`../../assets/file_icons/${MAP[ext] || 'other'}.svg`);
}

export function setFileMap(key: string, value: string) {
  const oldStr = localStorage.getItem(StorageName.FileMap);
  let result = null;
  if (oldStr) {
    const old = JSON.parse(oldStr);
    old[key] = value;
    // console.info('路径映射增加', old[key]);
    result = old;
  } else {
    result = {} as any;
    result[key] = value;
  }
  localStorage.setItem(StorageName.FileMap, JSON.stringify(result));
}

/**
 * 根据文件url获取本地路径
 */
export function getFilePath(url: string): string {
  const str = localStorage.getItem(StorageName.FileMap);
  if (str) {
    const map = JSON.parse(str);
    return map[url] || '';
  }
  return '';
}

/**
 * 删除本地文件
 */
export function deleteLocalFile(url: string, onSuccess: () => void, onError: (err: any) => void) {
  const str = localStorage.getItem(StorageName.FileMap);
  if (str) {
    const map = JSON.parse(str);
    const localPath = map[url];
    delete map[url];
    localStorage.setItem(StorageName.FileMap, JSON.stringify(map));
    fs.remove(localPath).then(() => {
      onSuccess();
    }).catch((e: any) => {
      onError(e);
    });
  }
}

export function selectUploadFile() {
  ipcRenderer.once('after-file-select', (event: any, paths: string[] | null) => {
    if (paths) {
      if (paths.length > FILE_SEND_LIMIT) {
        showToast(ErrorMsg.OVER_FILE_LIMIT);
      }
      const getStat = (fs as any).lstatSync;
      let hasOverSize: boolean = false;
      paths.slice(0, FILE_SEND_LIMIT).forEach((item) => {
        if (getStat(item).size > FILE_SIZE_LIMIT) {
          hasOverSize = true;
        } else {
          const param: OnSendParam = {
            content: item,
            type: MsgType.File
          };
          Bus.$emit('onSendFile', param);
        }
      });
      if (hasOverSize) {
        Notify.fail('不能上传/发送大于100M的文件');
      }
    }
  });
  ipcRenderer.send('show-file-select');
}

export function selectUploadVideo() {
  ipcRenderer.once('after-video-select', (event: any, paths: string[] | null) => {
    if (paths) {
      if (paths.length > FILE_SEND_LIMIT) {
        showToast(ErrorMsg.OVER_FILE_LIMIT);
      }
      const getStat = (fs as any).lstatSync;
      let hasOverSize: boolean = false;
      paths.slice(0, FILE_SEND_LIMIT).forEach((item) => {
        if (getStat(item).size > FILE_SIZE_LIMIT) {
          hasOverSize = true;
        } else {
          const param: OnSendParam = {
            content: item,
            type: MsgType.Video
          };
          Bus.$emit('onSendFile', param);
        }
      });
      if (hasOverSize) {
        Notify.fail('不能上传/发送大于100M的文件');
      }
    }
  });
  ipcRenderer.send('show-video-select');
}

export function selectUploadVideoOrPic() { // todo 优化上传文件相关
  ipcRenderer.once('after-video-pic-select', (event: any, paths: string[] | null) => {
    if (paths) {
      if (paths.length > FILE_SEND_LIMIT) {
        showToast(ErrorMsg.OVER_FILE_LIMIT);
      }
      const getStat = (fs as any).lstatSync;
      const PIC_TYPE = ['.png', '.jpg', '.jpeg'];
      let hasOverSize: boolean = false;
      paths.slice(0, FILE_SEND_LIMIT).forEach((item) => {
        if (getStat(item).size > FILE_SIZE_LIMIT) {
          hasOverSize = true;
        } else {
          const ext: string = path.extname(item);
          const isPic: boolean = PIC_TYPE.includes(ext);
          const param: OnSendParam = {
            content: item,
            type: isPic ? MsgType.Picture : MsgType.Video
          };
          Bus.$emit('onSendFile', param);
        }
      });
      if (hasOverSize) {
        Notify.fail('不能上传/发送大于100M的文件');
      }
    }
  });
  ipcRenderer.send('show-video-pic-select');
}
