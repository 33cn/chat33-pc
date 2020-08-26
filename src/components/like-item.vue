<template>
  <div class="like_cell" @click="goToDetail">
    <div class="flex_1">
      <common-header class="header" :url="header"></common-header>

      <div class="name_height">
        <span class="name_margin">{{record.user.name}}</span>
        <span
          :class="{'like_color': record.type === 1,'reward_color': record.type === 2}"
        >{{record.type === 1? "赞":"赏"}}</span>
      </div>
      <div class="time_size">{{time}}</div>
    </div>
    <div class="amount">
      <span>{{record.type === 2 ? record.amount +' '+record.coinName :''}}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { State, Mutation, namespace } from "vuex-class";
import CommonHeader from "@/components/common-header.vue";
import { defaultImage } from "@/config/config-enum";
import { formatFullDate } from "@/utils/tool";

const likeReward = namespace("likeReward");
@Component({
  components: {
    LikeItem,
    CommonHeader
  }
})
export default class LikeItem extends Vue {
  @Prop({ default: null }) record!: any;
  @Prop({ default: false }) canBeClick!: boolean;
  
  @likeReward.State("showLikeView") showLikeView!: boolean;
  @likeReward.State("showLikeHis") showLikeHis!: boolean;
  @likeReward.Mutation("setShowing") setShowing!: (
    showLikeView: boolean
  ) => void;
  @likeReward.Mutation("setShowLikeHis") setShowLikeHis!: (
    showLikeHis: boolean
  ) => void;
  @likeReward.Mutation("setMessageId") setMessageId!: (
    messageId: string
  ) => void;
  @likeReward.Mutation("setPara") setPara!: (
    param:any
  ) => void;

  public get time() {
    return formatFullDate(this.record.createTime);
  }

  public get header() {
    let url = "";
    if (this.record && this.record.user) {
      url = this.record.user.avatar;
    }
    return url || defaultImage.Friend;
  }

  goToDetail() {
    if (!this.canBeClick) return;
    this.setShowLikeHis(false);
    this.setShowing(true);
    this.setMessageId(this.record.logId);
    this.setPara({isFromListEnter:true})
  }
  created(){
  }
}
</script>

<style scoped>
.header {
  float: left;
  margin-right: 10px;
  margin-left: 0;
  width: 40px;
  height: 40px;
  margin-left: 20px;
}
.like_cell {
  display: flex;
  justify-content: ;
  box-sizing: border-box;
  height: 60px;
  padding-top: 10px;
  border-bottom: solid 1px rgba(1, 1, 1, 0.05);
}
.flex_1 {
  flex: 1;
}
.name_height {
  height: 50%;
}
.time_size {
  font-size: 11px;
  color: #8a97a5;
}
.name_margin {
  margin-right: 8px;
}
.name_height span:last-child {
  display: inline-block;
  width: 17px;
  height: 17px;
  line-height: 17px;
  border-radius: 4px;
  color: rgba(255, 255, 255, 1);
  text-align: center;
  font-size: 12px;
}
.like_color {
  background: rgba(97, 199, 255, 1);
}
.reward_color {
  background: rgba(239, 160, 25, 1);
}
.amount {
  line-height: 40px;
  font-weight: bold;
  color: rgba(36, 55, 78, 1);
  margin-right: 20px;
}
</style>

