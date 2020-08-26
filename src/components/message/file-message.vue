<!--
  @Author: yuanzeyu
  @Date: 2019/2/19
  @Desc: 文件消息
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
      <div class="file_box" @click="clickTemp">
        <!--downloadFile-->
        <div class="file_box-icon_wrapper">
          <img class="file_box-icon" :src="getFileIcon(message.fileName)" alt="其他类型" />
          <pie-loading
            v-if="downloading"
            class="file_box-loading"
            :current="message.loadedSize"
            :total="message.size"
            size="58px"
            waitingColor="rgba(234,246,255,0.8)"
            :reverse="true"
            :square="true"
          ></pie-loading>
        </div>

        <h2 class="file_box-name">
          <span class="file_box-name-cell_wrapper">
            <span class="file_box-name-cell">{{message.fileName}}</span>
          </span>
        </h2>

        <div class="file_box-size">{{message.size | formatSize}}</div>
      </div>
      <slot></slot>

      <div class="islike_wrap" v-if="!sendByMe&&totalCount>0" @click="jumpToLikeDetail&&!message.islikeDetail">
        <img class="g_islike" v-if="message.state === 0" src="../../assets/like_other.svg" />
        <img class="g_islike" v-else-if="message.state === 1" src="../../assets/like_me.svg" />
        <img class="g_islike" v-else src="../../assets/reward_me.svg" />
        <span class="islike_content">{{totalCount}}</span>
      </div>
  </message-holder>
  <text-message v-else :message="message"></text-message>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import MessageHolder from "./message-holder.vue";
import { UserLoggedInfo } from "@/scripts/object";
import { State, namespace } from "vuex-class";
import { getFileIcon, getFilePath } from "@/utils/app";
import { openLocalFile } from "@/utils/tool";
import { downloadFile2Local } from "@/utils/app/downloadFile";
import PieLoading from "@/components/pie-loading.vue";
import FileMsg from "@/object/messages/FileMsg";
import TextMessage from "@/components/message/text-message.vue";

const likeReward = namespace("likeReward");

@Component({
  components: {
    MessageHolder,
    PieLoading,
    TextMessage
  }
})
export default class FileMessage extends Vue {
  @Prop() public message!: FileMsg;
  @Prop({ default: false }) public headerDisable!: boolean;
  @State public myInfo!: UserLoggedInfo;

  @Prop() public avatar!: string;
  @Prop() public name!: string;

  @likeReward.Action("combineEffect") combineEffect!: (
  ) => void;
  @likeReward.Mutation("setMessageId") setMessageId!: (
    messageId: string
  ) => void;
  public getFileIcon = getFileIcon;
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

  public clickTemp() {
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

  public mounted() {
    if (!this.message.content||this.message.url) this.autoDownload(); //todo显示无法解密需要优化
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
    downloadFile2Local({
      url: this.message.url,
      name: this.message.fileName,
      autoOpen,
      onProcess: count => {
        this.message.loadedSize = count;
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

.file_box {
  display: inline-block;
  cursor: pointer;
  width: calc(227px - 20px);
  height: 58px;
  padding: 10px;
  background: #fff;
  box-shadow: var(--shadow-select);
  border-radius: var(--common-border-radius);
  text-align: left;
}

.file_box-icon_wrapper {
  display: inline-block;
  float: left;
  margin-right: 10px;
  width: 58px;
  height: 58px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.file_box-icon {
  width: 100%;
}

.file_box-loading {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.file_box-name {
  margin: 0;
  height: 40px;
  font-size: var(--normal-font-size);
  font-weight: 400;
  line-height: 40px;
}

.file_box-name-cell_wrapper {
  display: inline-block;
  vertical-align: middle;
}

.file_box-name-cell {
  line-height: 20px;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
  overflow: hidden;
  width: 139px;
}

.file_box-size {
  margin-top: 1px;
  font-size: var(--small-font-size);
  color: var(--font-color-light);
  line-height: 17px;
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
