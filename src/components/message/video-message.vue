<!--
  @Author: yuanzeyu
  @Date: 2019/2/19
  @Desc: 视频消息
-->
<template>
  <message-holder
    v-if="!message.content||this.message.url"
    :message="message"
    :isMine="message.isSendByMe"
    :headerDisable="headerDisable"
    :avatar="avatar"
    :name="name"
  >
    <div class="islike_wrap_me" v-if="sendByMe&&totalCount>0&&!message.islikeDetail" @click="jumpToLikeDetail">
      <span class="islike_content_me">{{totalCount}}</span>
      <img class="g_islike" src="../../assets/like_other.svg" />
    </div>
    <div
      class="video_wrapper"
      :style="{width:`${getSize.width}px`,height:`${getSize.height}px`}"
      @click="clickMsg"
    >
      <video class="video" :src="message.url"></video>
      <pie-loading
        v-if="downloading"
        class="loading"
        :current="message.loadedSize"
        :total="message.videoSize"
        size="60px"
        waitingColor="rgba(234,246,255,0.8)"
      ></pie-loading>
      <img v-else class="icon_play" src="../../assets/video-play.svg" alt="播放" />
      <div class="time">{{message.duration | formatTime}}</div>
    </div>
    <div class="islike_wrap" v-if="!sendByMe&&totalCount>0&&!message.islikeDetail" @click="jumpToLikeDetail">
        <img class="g_islike" v-if="message.state === 0" src="../../assets/like_other.svg" />
        <img class="g_islike" v-else-if="message.state === 1" src="../../assets/like_me.svg" />
        <img class="g_islike" v-else src="../../assets/reward_me.svg" />
        <span class="islike_content">{{totalCount}}</span>
    </div>
  </message-holder>
  <!-- <text-message v-else :message="message"></text-message> -->
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import MessageHolder from "./message-holder.vue";
import { UserLoggedInfo } from "@/scripts/object";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import { State, namespace } from "vuex-class";
import { formatVideoTime, openLocalFile } from "@/utils/tool";
import { downloadFile2Local } from "@/utils/app/downloadFile";
import { getFilePath } from "@/utils/app";
import PieLoading from "@/components/pie-loading.vue";
import VideoMsg from "@/object/messages/VideoMsg";
import TextMessage from "@/components/message/text-message.vue";

const likeReward = namespace("likeReward");

@Component({
  components: {
    MessageHolder,
    PieLoading,
    TextMessage
  },
  filters: {
    formatTime: formatVideoTime
  }
})
export default class VideoMessage extends Vue {
  @Prop() public avatar!: string; // todo 修改为customAvatar
  @Prop() public name!: string;
  // message用于聊天消息
  @Prop() public message!: VideoMsg;
  @Prop({ default: false }) public headerDisable!: boolean;
  @State public myInfo!: UserLoggedInfo;
  @State public chatTarget!: Group | Friend;
  @likeReward.Action("combineEffect") combineEffect!: (
  ) => void;
  @likeReward.Mutation("setMessageId") setMessageId!: (
    messageId: string
  ) => void;
  public downloading: boolean = false;

  public get totalCount() {
    return this.message ? this.message.like + this.message.reward : 0;
  }

  public get sender() {
    return this.message ? this.message.senderId : null;
  }

  public get sendByMe() {
    return this.sender ? this.sender === this.myInfo.id : false;
  }

  public get getSize() {
    const width = this.message.width;
    const height = this.message.height;
    const MAX_SIZE = 300;
    if (width < MAX_SIZE && height < MAX_SIZE) {
      return {
        height,
        width
      };
    }
    if (width > height) {
      return {
        height: (height / width) * MAX_SIZE,
        width: MAX_SIZE
      };
    }
    return {
      height: MAX_SIZE,
      width: (width / height) * MAX_SIZE
    };
  }

  public clickMsg() {
    if (this.downloading) {
      return;
    }
    const path = getFilePath(this.message.url);
    if (path) {
      openLocalFile(path);
    } else {
      this.downloadFile(true);
    }
  }

  public jumpToLikeDetail() {
    this.setMessageId(this.message.id);
    this.combineEffect();
  }
  public created() {
    if (!this.message.content||this.message.url) this.autoDownload();
  }

  private autoDownload() {
    if (!this.message.isSendByMe) {
      // 自己发送的文件无需自动下载（上传oss后已经复制到文件夹中）
      const path = getFilePath(this.message.url); // 本地无该文件则自动下载
      if (!path) {
        this.downloadFile();
      }
    }
  }

  private downloadFile(autoOpen: boolean = false) {
    this.downloading = true;
    const url = this.message.url || "";
    downloadFile2Local({
      url,
      name: (url.split("/") as any).pop() || "",
      autoOpen,
      onProcess: count => {
        this.message.loadedSize = count;
      },
      onStart: total => {
        this.message.videoSize = total;
      },
      onError: () => {
        this.$notify.fail("保存失败");
        this.downloading = false;
        this.message.loadedSize = 0;
      },
      onFinish: () => {
        this.downloading = false;
      }
    });
  }
}
</script>

<style scoped>
@import "../../styles/var.css";

.video_wrapper {
  display: inline-block;
  position: relative;
}

.video {
  background: #3a4048;
  border-radius: 4px;
  width: 100%;
  height: 100%;
}

.icon_play {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  margin-top: -30px;
  margin-left: -30px;
  cursor: pointer;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -30px;
  margin-left: -30px;
}

.time {
  color: #eaf6ff;
  font-size: var(--small-font-size);
  position: absolute;
  right: 10px;
  bottom: 10px;
}

.islike_wrap_me {
  margin-right: 10px;
  display: inline-block;
}

.islike_content_me {
  margin-right: 5px;
  display: inline-block;
}

.g_islike {
  width: 14px;
  height: 14px;
}

.islike_wrap {
  margin-left: 10px;
  display: inline-block;
}

.islike_content {
  margin-left: 5px;
  display: inline-block;
}
</style>
