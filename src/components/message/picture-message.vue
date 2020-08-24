<!--
  @Author: yuanzeyu
  @Date: 2018/12/29
  @Desc: 图片消息
-->
<template>
  <message-holder
    :avatar="avatar"
    :name="name"
    :headerDisable="headerDisable"
    :message="message"
    :isMine="sendByMe"
  >
      <div class="islike_wrap_me" v-if="sendByMe&&totalCount>0&&!message.islikeDetail" @click="jumpToLikeDetail">
        <span class="islike_content_me">{{totalCount}}</span>
        <img class="g_islike" src="../../assets/like_other.svg" />
      </div>
      <div class="picture_wrapper">
        <span class="message_babel" v-if="typeof(message.unenc) === 'string'">{{message.unenc}}</span>
        <img
          v-else
          class="picture"
          :style="{'height': `${height}px`}"
          :src="message.url"
          @click="showPicture"
          alt="图片"
        />
        <slot></slot>
      </div>
      <div class="islike_wrap" v-if="!sendByMe&&totalCount>0&&!message.islikeDetail" @click="jumpToLikeDetail">
        <img class="g_islike" v-if="message.state === 0" src="../../assets/like_other.svg" />
        <img class="g_islike" v-else-if="message.state === 1" src="../../assets/like_me.svg" />
        <img class="g_islike" v-else src="../../assets/reward_me.svg" />
        <span class="islike_content">{{totalCount}}</span>
      </div>
  </message-holder>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import MessageHolder from "./message-holder.vue";
import { getImgHeight } from "@/scripts/common";
import { ImageMsgApi, UserLoggedInfo } from "@/scripts/object";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import { State, namespace } from "vuex-class";
import imageViewer from "@/plugins/ImageViewer/index";
import Bus from "@/scripts/bus";
import ImageMsg from "@/object/messages/ImageMsg";
import SnapImageMsg from "@/object/messages/snapMsg/SnapImageMsg";
import RelayImageMsg from "../../object/messages/singleRelay/RelayImageMsg";

const likeReward = namespace("likeReward");

@Component({
  components: {
    MessageHolder
  }
})
export default class PictureMessage extends Vue {
  @Prop({ default: false }) public headerDisable!: boolean;
  // 自定义用于支持合并转发弹窗
  @Prop() public avatar!: string;
  @Prop() public name!: string;
  // message用于聊天消息
  @Prop({ default: null }) public message!:
    | ImageMsg
    | SnapImageMsg
    | RelayImageMsg;
  @State public myInfo!: UserLoggedInfo;
  @State public chatTarget!: Group | Friend;
  @likeReward.Action("combineEffect") combineEffect!: (
  ) => void;
  @likeReward.Mutation("setMessageId") setMessageId!: (
    messageId: string
  ) => void;

  public get totalCount() {
    return this.message ? this.message.like + this.message.reward : 0;
  }
  public get sender() {
    return this.message ? this.message.sender : null;
  }

  public get sendByMe() {
    return this.sender ? this.sender.id === this.myInfo.id : false;
  }

  public get isSnap(): boolean {
    return this.message && this.message instanceof SnapImageMsg;
  }

  public get height(): number {
    return getImgHeight(this.message.width, this.message.height);
  }

  public emitClick() {
    this.showPicture();
  }

  public jumpToLikeDetail() {
    this.setMessageId(this.message.id);
    this.combineEffect();
  }
  /**
   * 点击查看大图， todo 优化showPicture 查看大图传入消息id
   */
  public showPicture() {
    const images: string[] = [];
    let msgWhenSnap: SnapImageMsg | null = null;
    let currentUrl: string = "";
    const target = this.chatTarget;
    const message = this.message;
    currentUrl = message.url;
    if (message instanceof SnapImageMsg) {
      // 阅后即焚图片：不能翻页
      images.push(currentUrl);
      msgWhenSnap = message;
      if (message.isSendByMe) {
        // 自己发送的不需要倒计时
        msgWhenSnap = null;
      }
    } else {
      images.push(message.url);
      target.msgHistory.forEach(item => {
        if (item instanceof ImageMsg) {
          if (!(item instanceof SnapImageMsg)) {
            // 排除阅后即焚
            images.push(item.url);
          }
        }
      });
    }
    imageViewer(
      {
        list: images,
        currentIndex: images.findIndex((item: string) => item === currentUrl),
        msgWhenSnap
      },
      src => {
        Bus.$emit("relayChatPicture", src);
      }
    );
  }
}
</script>

<style scoped>
@import "../../styles/var.css";

.picture_wrapper {
  display: inline-block;
  /* font-size: 0; */
  position: relative;
  border-radius: 4px;
}

.picture {
  max-width: 258px;
  max-height: 258px;
  border-radius: 4px;
  cursor: pointer;
}

.message_babel {
  box-sizing: border-box;
  position: relative;
  /* max-width: 60%; */
  padding: 10px 16px;
  display: inline-block;
  border-radius: 4px 18px 18px 18px;
  box-shadow: var(--shadow-select);
  line-height: 20px;
  min-height: 20px;
  word-break: break-word;
  background: #fff;
  text-align: left;
  &.message_babel_selected {
    background: var(--gray-background);
  }
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
