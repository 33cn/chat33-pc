<!--
  @Author: yuanzeyu
  @Date: 2019/1/29
  @Desc: 消息列表底部
-->
<template>
  <footer class="chat-footer" @drop.prevent="dropFile" @dragover.prevent>
    <message-editor :target="target" @onSend="handleSendMsg" @onAddPic="addPictureItem"></message-editor>
    <footer-muted v-if="isMuted" class="l-model" :target="target"></footer-muted>
    <picture-sender
      v-if="target.picturesSending.length>0"
      class="l-model"
      :list="target.picturesSending"
      @onConfirm="sendPictures"
      @onCancel="target.picturesSending=[]"
    ></picture-sender>
    <selector-menu
      v-if="target.selectorShow"
      class="l-model"
      @onRelay="emitOnRelay"
      @onDelete="$emit('onDelete')"
      @onCancel="$emit('onCancel')"
    ></selector-menu>
  </footer>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { State, namespace } from 'vuex-class';
import { ipcRenderer } from 'electron';
import nodePath from 'path';
import fs from 'fs';
import {
  ChannelType,
  MemberMutedSet,
  MemberType,
  MsgType,
  MutedSet
} from '@/config/const-enums';
import {
  ErrorMsg,
  FILE_SEND_LIMIT,
  IMAGE_SEND_LIMIT,
  ImageTypeLimit,
  MessageStatus,
  TimeConfig,
  VIDEO_SEND_LIMIT
} from '@/config/config-enum';
import { OnSendParam } from '@/config/type';
import {
  FileMsgApi,
  ImageMsgApi,
  MySocket,
  UserLoggedInfo
} from '@/scripts/object';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import { upLoadOssFile } from '@/scripts/common';
import Bus from '@/scripts/bus';
import { file2DataUrl,generateSessionKey } from '@/utils/tool';
import MessageEditor from '@/views/message-editor.vue';
import FooterMuted from '@/views/footer-muted.vue';
import PictureSender from '@/components/picture-sender.vue';
import SelectorMenu from './selector-menu.vue';
import { setFileMap } from '@/utils/app';
import { GetVideoInfoReturn } from '@/utils/app/getVideoInfo';
import { MessageType } from '@/object/messages';
import { BaseMsgConfig } from '@/object/messages/BaseMsg';
import SnapTextMsg from '@/object/messages/snapMsg/SnapTextMsg';
import TextMsg from '@/object/messages/TextMsg';
import SnapImageMsg from '@/object/messages/snapMsg/SnapImageMsg';
import ImageMsg from '@/object/messages/ImageMsg';
import VideoMsg from '@/object/messages/VideoMsg';
import FileMsg from '@/object/messages/FileMsg';
  const addressSign = namespace("addressSign");

@Component({
  components: {
    MessageEditor,
    FooterMuted,
    PictureSender,
    SelectorMenu
  }
})
export default class ChatFooter extends Vue {
  @Prop() public target!: Friend | Group;
  @State public socket!: MySocket;
  @State public myInfo!: UserLoggedInfo;

  @addressSign.Mutation("clearAitInfoList") clearAitInfoList!: () => void;

  /**
   * 登录用户是否在群中被禁言
   */
  public get isMuted(): boolean {
    const target = this.target;
    if (target instanceof Group) {
      if (target.myLevel !== MemberType.Member) {
        // 群主和管理员无禁言
        return false;
      } else if (target.mutedSet === MutedSet.AllMuted) {
        // 全员禁言
        return true;
      } else if (
        target.mutedSet === MutedSet.BlackList &&
        target.myMutedSet === MemberMutedSet.Black
      ) {
        // 群设置黑名单且我在黑名单里
        return true;
      } else if (
        target.mutedSet === MutedSet.WhiteList &&
        target.myMutedSet !== MemberMutedSet.White
      ) {
        // 群设置白名单且我不采用
        return true;
      }
    }
    return false;
  }

  /**
   * 处理发送聊天消息
   */
  public async handleSendMsg({ content, type }: OnSendParam) {
    let target = this.target;
    // 获取基本消息格式
    const preMessage = await this.getPreMessage(content, type, target);
    if (preMessage) {
      // 显示到页面
      this.handleLocalEvent(preMessage);
      // 上传文件到oss
      if (preMessage instanceof FileMsg) {
        const fileMsg: FileMsgApi | null = await this.uploadFile(
          content as string
        );
        if (fileMsg) {
          preMessage.url = fileMsg.fileUrl;
          preMessage.md5 = fileMsg.md5;
        } else {
          return null;
        }
      } else if (preMessage instanceof VideoMsg) {
        const ossUrl = await this.uploadVideo(content as string);
        if (ossUrl) {
          preMessage.url = ossUrl as string;
        } else {
          return null;
        }
      }
      setTimeout(() => {
        // 超时标为失败
        if (preMessage.sendStatus !== MessageStatus.Success) {
          preMessage.sendStatus = MessageStatus.Fail;
        }
      }, TimeConfig.SOCKET_TIMEOUT_WAIT);

      const aitIdList = target.aitInfos.map((item)=>{
         return item.id;
      });
      // 发送socket消息
      this.socket.sendChatMsg({
        channel:
          target instanceof Group ? ChannelType.Group : ChannelType.Friend,
        targetId: target.id,
        msg: preMessage,
        aitList: aitIdList,
        isSnap: target.isSendSnap,
        failCb: (failMsg: string) => {
          this.$notify.fail(failMsg);
          preMessage.sendStatus = MessageStatus.Fail;
        }
      },target);
      target.aitInfos = [];
    }
  }

  /**
   * 添加该对象正在发送的图片，包含File/DataUrl
   */
  public addPictureItem(item: File) {
    file2DataUrl(item).then(url => {
      this.target.picturesSending.push({
        file: item,
        url
      });
    });
  }

  /**
   * 确认发送选中的图片
   */
  public sendPictures() {
    this.target.picturesSending.forEach(item => {
      this.handleSendMsg({
        content: item.file,
        type: MsgType.Picture
      });
    });
    this.target.picturesSending = [];
  }

  /**
   * 拖入图片/视频/文件
   * @desc 自动判断消息类型，图片需要加入待发送列表（最多n张）,其他直接发送（一次拖入最多发送n个视频和n个文件）
   */
  public dropFile(e: DragEvent) {
    if (e.dataTransfer) {
      const allFiles = e.dataTransfer.files;
      let sendPicCount: number = this.target.picturesSending.length;
      let sendVideoCount: number = 0;
      let sendFileCount: number = 0;
      for (let i = 0, len = allFiles.length; i < len; i++) {
        const item = allFiles[i];
        if (ImageTypeLimit.includes(item.type)) {
          // 是图片

          if (sendPicCount < IMAGE_SEND_LIMIT) {
            this.addPictureItem(item);
          }
          sendPicCount += 1;
        } else {
          const VideoExtLimit = ['.mp4', '.avi', '.mov', '.mpg'];
          const ext = (nodePath as any).extname(item.path);
          if (VideoExtLimit.includes(ext)) {
            // 作为视频消息直接发送
            if (sendVideoCount < VIDEO_SEND_LIMIT) {
              const param: OnSendParam = {
                content: item.path,
                type: MsgType.Video
              };
              this.handleSendMsg(param);
            }
            sendVideoCount += 1;
          } else if ((fs as any).statSync(item.path).isFile()) {
            // 其他作为文件直接发送(非文件夹)
            if (sendFileCount < FILE_SEND_LIMIT) {
              const param: OnSendParam = {
                content: item.path,
                type: MsgType.File
              };
              this.handleSendMsg(param);
            }
            sendFileCount += 1;
          }
        }
      }
      if (sendPicCount > IMAGE_SEND_LIMIT) {
        this.$toast(ErrorMsg.OVER_IMAGE_LIMIT); // todo toast可能重复
      }
      if (
        sendVideoCount > VIDEO_SEND_LIMIT ||
        sendFileCount > FILE_SEND_LIMIT
      ) {
        this.$toast(ErrorMsg.OVER_FILE_LIMIT);
      }
    }
  }

  public emitOnRelay(isMulti: boolean) {
    
    this.$emit('onRelay', isMulti);
  }

  public created() {
    // 发送文件event
    Bus.$on('onSendFile', (param: OnSendParam) => {
      this.handleSendMsg(param);
    });
  }

  public beforeUpdate() {
    this.clearAitInfoList();
  }

  public beforeDestroy() {
    Bus.$off('onSendFile');
  }

  /**
   * 处理界面发消息交互
   */
  private handleLocalEvent(message: MessageType) {
    message.sendStatus = MessageStatus.Sending; // 标为loading加入本地
    this.target.msgHistory.push(message); //消息对象的历史列表中插入该条消息
    Bus.$emit('onSendingMsg'); // 消息列表将发送中的消息dom滚动到视图
  }

  private async getPreMessage(
    content: string | File,
    type: MsgType,
    target: Friend | Group
  ): Promise<MessageType | null> {
    const date = Date.now();
    const msgId = `${date}${target.id}${Math.random()}`;
    const isSnap: boolean = target.isSendSnap;
    const baseConfig: BaseMsgConfig = {
      id: msgId,
      msgId,
      sendTime: date,
      senderId: this.myInfo.id,
      receiverId: target.id,
      sender: this.myInfo,
      isSendByMe: true
    };
    switch (type) {
      case MsgType.Text: {
        if (isSnap) {
          return new SnapTextMsg(
            Object.assign(
              {},
              baseConfig,
              {
                content: content as string
              },
              {
                temp: ''
              }
            )
          );
        }
        return new TextMsg(
          Object.assign({}, baseConfig, {
            content: content as string
          })
        );
      }
      case MsgType.Picture: {
        // 图片仍然上传后再显示
        let picture: ImageMsgApi | null = null;
        if (typeof content === 'string') {
          // electron上传
          picture = await this.uploadPictureElectron(content);
        } else {
          picture = await this.uploadPicture(content as File); // todo 优化为先获取宽度并推入列表，在loading时上传
        }
        if (picture) {
          if (isSnap) {
            return new SnapImageMsg(
              Object.assign(
                {},
                baseConfig,
                {
                  url: picture.url,
                  width: picture.width,
                  height: picture.height
                },
                {
                  temp: ''
                }
              )
            );
          }
          return new ImageMsg(
            Object.assign({}, baseConfig, {
              url: picture.url,
              width: picture.width,
              height: picture.height
            })
          );
        }
        return null;
      }
      case MsgType.Video: {
        const info = await this.getVideoInfo(content as string);
        if (info) {
          const video = info as GetVideoInfoReturn;
          return new VideoMsg(
            Object.assign({}, baseConfig, {
              url: '',
              width: video.width,
              height: video.height,
              duration: video.duration
            })
          );
        }
        this.$notify.fail("读取视频信息失败");
        return null;
      }
      case MsgType.File: {
        return new FileMsg(
          Object.assign({}, baseConfig, {
            url: '',
            size: (fs as any).lstatSync(content as string).size,
            md5: '',
            fileName: (nodePath as any).basename(content)
          })
        );
      }
      default:
        throw new Error('getPreMessage:发送不支持的消息类型？');
    }
  }

  /**
   * 图片上传到oss 获取消息内容
   */
  private uploadPicture(file: File): Promise<ImageMsgApi | null> {
    // todo 整理
    return new Promise((resolve) => {
      upLoadOssFile({
        fileBlob: file,
        userId: this.myInfo.id
      })
        .then((res: any) => {
          const url = res.url;
          const img = new Image();
          img.src = url;
          img.onload = () => {
            const picture: ImageMsgApi = {
              url,
              height: img.height,
              width: img.width
            };
            resolve(picture);
          };
          img.onerror = () => {
            this.$notify.fail('图片加载异常');
            resolve();
          };
        })
        .catch(() => {
          this.$notify.fail('上传失败');
          resolve();
        });
    });
  }

  private uploadPictureElectron(path: string): Promise<ImageMsgApi | null> {
    return new Promise((resolve) => {
      const listenEvent: string = `oss-pic${path}`;
      ipcRenderer.once(listenEvent, (event: any, url: string) => {
        if (url) {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            const picture: ImageMsgApi = {
              url,
              height: img.height,
              width: img.width
            };
            resolve(picture);
          };
          img.onerror = () => {
            this.$notify.fail('图片加载异常');
            resolve();
          };
        } else {
          resolve();
        }
      });
      ipcRenderer.send('upload-oss-pic', {
        path,
        userId: this.myInfo.id,
        listenEvent
      });
    });
  }

  /**
   * 上传文件并返回文件消息内容
   */
  private uploadVideo(path: string) {
    return new Promise((resolve) => {
      const listenEvent: string = `oss-video${path}`;
      ipcRenderer.once(listenEvent, (event: any, arg: any) => {
        if (arg.err) {
          // 可能存在err和oss
          this.$notify.fail(arg.err);
        }
        if (arg.oss) {
          const result = arg.oss.url;
          if (arg.err !== '文件转存失败') {
            // 文件成功复制到file文件夹
            setFileMap(result, arg.localPath);
          }
          resolve(result);
        } else {
          resolve();
        }
      });
      ipcRenderer.send('upload-oss-video', {
        path,
        userId: this.myInfo.id,
        listenEvent
      });
    });
  }

  private getVideoInfo(path: string) {
    return new Promise((resolve) => {
      ipcRenderer.once(
        `get-video-info${path}`,
        (event: any, info: GetVideoInfoReturn | null) => {
          if (info) {
            resolve(info);
          }
          resolve();
        }
      );
      ipcRenderer.send('get-video-info', path);
    });
  }

  /**
   * 上传文件并返回文件消息内容
   */
  private uploadFile(path: string): Promise<FileMsgApi | null> {
    return new Promise((resolve) => {
      const listenEvent: string = `oss-file${path}`;
      ipcRenderer.once(listenEvent, (event: any, arg: any) => {
        if (arg.err) {
          // 可能存在err和oss
          this.$notify.fail(arg.err);
        }
        if (arg.oss) {
          const fileMsg: FileMsgApi = {
            fileUrl: arg.oss.url,
            size: arg.size,
            md5: arg.md5,
            name: arg.name
          };
          if (arg.err !== '文件复制失败') {
            // 文件成功复制到file文件夹
            setFileMap(fileMsg.fileUrl, arg.localPath);
          }
          resolve(fileMsg);
        } else {
          resolve();
        }
      });
      ipcRenderer.send('upload-oss-file', {
        path,
        userId: this.myInfo.id,
        listenEvent
      });
    });
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.chat-footer {
  position: relative;
  height: 160px;
  border-top: var(--common-border);
}

.l-model {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
