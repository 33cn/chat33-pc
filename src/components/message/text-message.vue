<!--
  @Author: yuanzeyu
  @Date: 2018/12/29
  @Desc: 普通文字消息
-->
<template>
  <message-holder
    :avatar="avatar"
    :name="name"
    :message="message"
    :isMine="sendByMe"
    :headerDisable="headerDisable"
  >
      <div class="islike_wrap_me" v-if="sendByMe&&totalCount>0&&!message.islikeDetail" @click="jumpToLikeDetail">
        <span class="islike_content_me">{{totalCount}}</span>
        <img class="g_islike" src="../../assets/like_other.svg" />
      </div>
      <div
        class="message_babel"
        :class="{'message_babel_mine': sendByMe, 'message_babel_selected': message&&message.isMenuShowing}"
        @click="emitEventClick"
      >
        <img
          v-if="NotDenc"
          src="../../assets/locked.svg"
          class="message_locked"
          :class="{'message_locked_mine': sendByMe}"
        />
        <span v-if="typeof(customText)==='string'">{{customText}}</span>
        <!--      <span v-else-if="message&&message.isEncrypto">{{sendByMe?'[加密消息]':'【你收到了一条加密消息，请在手机上查看】'}}</span>-->
        <!--      <span v-else>{{message.msg}}</span>-->
        <!-- todo 支持加密屏蔽 -->
        <span v-else>{{message.content}}</span>
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
import { UserLoggedInfo } from "../../scripts/object";
import { State, Mutation, Action, namespace } from "vuex-class";
import TextMsg from "@/object/messages/TextMsg";
import { LabelEnum } from "@/config/config-enum";

const likeReward = namespace("likeReward");

@Component({
  components: {
    MessageHolder
  }
})
export default class TextMessage extends Vue {
  @Prop() public avatar!: string; // todo 修改为customAvatar
  @Prop() public name!: string;
  @Prop({ default: false }) public isMine!: boolean;
  @Prop({ default: false }) public headerDisable!: boolean;

  @Prop({ default: null }) public message!: TextMsg;
  @Prop() public customText!: string;
  @State public myInfo!: UserLoggedInfo; // todo 改为prop isMine?
  @likeReward.Action("combineEffect") combineEffect!: (
  ) => void;

  @likeReward.Mutation("setMessageId") setMessageId!: (
    messageId: string
  ) => void;

  public get totalCount() {
    return this.message ? this.message.like + this.message.reward : 0;
  }

  public get sender() {
    return this.message ? this.message.senderId : null;
  }

  public get sendByMe(): boolean {
    return this.sender ? this.sender === this.myInfo.id : false;
  }

  public get NotDenc(): boolean {
    return this.message
      ? this.message.content === LabelEnum.DECRYPTO_LABEL
      : false;
  }

  public emitEventClick() {
    this.$emit("clickBabel");
  }

  public jumpToLikeDetail() {
    this.setMessageId(this.message.id);
    this.combineEffect();
  }
  public created() {
    
  }
}
</script>

<style scoped>
@import "../../styles/var.css";

.message_babel {
  box-sizing: border-box;
  position: relative;
  max-width: 60%;
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

.message_locked {
  width: 20px;
  height: 20px;
  position: absolute;
  top: 0px;
  right: -10px;
}

.message_locked_mine {
  left: -10px;
}

.message_babel_mine {
  background: #c1e9ff;
  border-radius: 18px 4px 18px 18px;

  &.message_babel_selected {
    background: #9dd3f0;
  }
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
.islike_wrap_me {
  margin-right: 10px;
  display: inline-block;
}
.islike_content_me {
  margin-right: 5px;
  display: inline-block;
}

.message_isLike {
}
</style>

<style>
.content_focused {
  & .message_babel {
    background: #e3eef4;
  }

  & .message_babel_mine {
    background: #9dd3f0;
  }
}
</style>
