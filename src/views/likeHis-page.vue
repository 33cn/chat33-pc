<template>
  <div class="g-like-warp">
    <vue-scroll ref="listBox" @handle-scroll="handleMsgScroll">
      <like-list :dataList="likehis" :canBeClick="true"></like-list>
    </vue-scroll>
  </div>
</template>

<script lang="ts">
import LikeList from "@/components/like-list.vue";
import { Component, Prop, Vue } from "vue-property-decorator";
import { State, Mutation, Action } from "vuex-class";
import { MessageType } from "../object/messages";
import URLS from "@/config/urls";
import Group from "../object/targets/Group";
import Friend from "@/object/targets/Friend";
import { ChannelType } from "@/config/const-enums";
import {removeUnreadLike} from "@/utils/tool";

@Component({
  components: {
    LikeList
  }
})
export default class LikeHisPage extends Vue {
  @State public chatTarget!: Group | Friend;
  @State public message!: MessageType; // todo 改为prop isMine?

  public likehis: Array<any> = [];
  async created() {
    const data = await this.$post(URLS.PRAISE_LIST, {
      channelType:
        this.chatTarget instanceof Group
          ? ChannelType.Group
          : ChannelType.Friend,
      targetId: this.chatTarget.id,
      startId: "",
      number: 20
    });
    this.likehis=[...data.records.reverse()];

    this.removeUnlike();
  }

  public removeUnlike() {
      this.chatTarget.unReadLike = 0;
      this.chatTarget.unReadReward = 0;
      removeUnreadLike(this.chatTarget.me.id,this.chatTarget.id);
  }

  public async handleMsgScroll(vertical: any) {
    if (vertical.process === 0) {
      const data = await this.$post(URLS.PRAISE_LIST, {
        channelType:
          this.chatTarget instanceof Group
            ? ChannelType.Group
            : ChannelType.Friend,
        targetId: this.chatTarget.id,
        startId: this.likehis[0].recordId,
        number: 20
      });
      data.records.shift();
      this.likehis=data.records.reverse().concat(this.likehis);
          console.log(this.likehis);
    }
  }
}
</script>

<style>
.g-like-warp {
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 100%;
}
</style>