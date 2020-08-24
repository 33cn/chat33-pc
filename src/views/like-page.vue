<template>
  <div class="g-like-warp">
    <div class="back-title" @click="goBackToHis">
      <div v-if="isGoBack">
        <span class="s-back-arrow"></span>
        <span class="s-back">赞善列表</span>
      </div>
    </div>
    <message-item v-if="message" :message="message"></message-item>
    <div class="likeShow-flex">
      <div class="likeShow-item-left item-flex">
        <span>{{detailObj.praiseNumber}}</span>
        <span>赞赏</span>
      </div>
      <div class="likeShow-item-right item-flex">
        <span>¥{{detailObj.reward}}</span>
        <span>赞赏(估值)</span>
      </div>
    </div>
    <like-list :dataList="dataList"></like-list>
    <div class="button_wrap">
      <button
        class="g-btn_active common-btn btn_dialog"
        :class="{'g-btn_active_disable':likeByMe||sendByMe}"
        :disabled="likeByMe||sendByMe"
        @click="addLike"
      >点赞</button>
      <button class="g-btn_active common-btn btn_dialog g-btn_active_disable">打赏</button>
    </div>
  </div>
</template>

<script lang="ts">
import LikeList from "@/components/like-list.vue";
import { Component, Prop, Vue } from "vue-property-decorator";
import { State, Mutation, Action, namespace } from "vuex-class";
import { MessageType } from "../object/messages";
import Group from "../object/targets/Group";
import Friend from "@/object/targets/Friend";
import { ChannelType } from "@/config/const-enums";
import MessageItem from "@/components/message/message-item.vue";
import URLS from "@/config/urls";

const likeReward = namespace("likeReward");
@Component({
  components: {
    LikeList,
    MessageItem
  }
})
export default class LikePage extends Vue {
  // @Prop() public goBack: boolean = false;
  @State public chatTarget!: Group | Friend;
  @likeReward.State("messageId") messageId!: string;
  @likeReward.State("isFromListEnter") isFromListEnter!: boolean;

  @likeReward.Mutation("setShowLikeHis") setShowLikeHis!: (
    showLikeHis: boolean
  ) => void;
  @likeReward.Mutation("setShowing") setShowing!: (
    param: any
  ) => void;
  public dataList: Array<any> = [];
  public detailObj: any = {};
  public message: MessageType | null = null;

  public get isGoBack(): boolean {
    return this.isFromListEnter;
  }
  
  beforeUpdate() {
    console.log(this.isGoBack);
  }

  public get likeByMe(): boolean {
    return this.messageId &&
      (this.detailObj.state === 0 || this.detailObj.state === 2)
      ? false
      : true;
  }

  public get sendByMe(): boolean {
    return this.message ? this.message.isSendByMe : false;
  }

  async created() {
    const detailData = await this.$post(URLS.PRAISE_DETAIL, {
      channelType:
        this.chatTarget instanceof Group
          ? ChannelType.Group
          : ChannelType.Friend,
      logId: this.messageId
    });
    this.detailObj = { ...detailData };

    const { encMsg, encrypted } = await this.chatTarget.dencryptGroupMsg(
      detailData.log,
      true
    );
    const message = this.chatTarget.getMsg(encMsg, encrypted);
    this.message = Object.defineProperty(message, "islikeDetail", {
      value: true
    });
    const data = await this.$post(URLS.PRAISE_DETAIL_LIST, {
      channelType:
        this.chatTarget instanceof Group
          ? ChannelType.Group
          : ChannelType.Friend,
      logId: this.messageId,
      startId: "",
      number: 20
    });
    this.dataList = [...data.records];
  }

  public addLike() {
    this.$emit("addLike", {
      channelType:
        this.chatTarget instanceof Group
          ? ChannelType.Group
          : ChannelType.Friend,
      logId: this.messageId,
      action: "like"
    });
  }

  public goBackToHis() {
    this.setShowLikeHis(true);
    this.setShowing({showLikeView:false});
  }
}
</script>

<style scoped>
.g-like-warp {
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 100%;
}
.back-title {
  height: 37px;
  line-height: 37px;
  margin-left: 20px;
}
.likeShow-flex {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}
.likeShow-item-left {
  width: 175px;
  height: 70px;
  border-radius: 10px;
  background: rgba(234, 246, 255, 1);
  margin-right: 10px;
}
.likeShow-item-right {
  width: 175px;
  height: 70px;
  border-radius: 10px;
  background: rgba(252, 243, 226, 1);
}
.s-back-arrow {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-top: 2px solid var(--common-blue);
  border-left: 2px solid var(--common-blue);
  transform: rotate(-45deg);
}
.item-flex {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
}
.likeShow-item-left span:first-child {
  font-size: 24px;
  color: #32b2f7;
}
.likeShow-item-right span:first-child {
  font-size: 24px;
  color: #efa019;
}
.button_wrap {
  display: flex;
  justify-content: center;
  margin-top: auto;
  margin-bottom: 20px;
}
.button_wrap :first-child {
  margin-right: 20px;
}
.reward-button {
  background: rgba(239, 160, 25, 1);
  border: 1px solid rgba(239, 160, 25, 1);
}
.s-back {
  color: var(--common-blue);
  margin-left: 10px;
}
</style>