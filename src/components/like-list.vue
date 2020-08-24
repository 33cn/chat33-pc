<template>
  <div>
    <template v-for="item in dataList">
      <like-item :key="item.id" :record="item" :canBeClick="canBeClick"></like-item>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import LikeItem from "@/components/like-item.vue";
import { MessageType } from "../object/messages";
import { State, Mutation, Action } from "vuex-class";
import { ChannelType } from "@/config/const-enums";
import Group from "../object/targets/Group";
import Friend from "@/object/targets/Friend";
@Component({
  components: {
    LikeItem
  }
})
export default class LikeList extends Vue {
  @Prop({ default: [] }) dataList!: Array<any>;
  @Prop({ default:false}) canBeClick!: boolean;
  @State public message!: MessageType; // todo 改为prop isMine?
  @State public chatTarget!: Group | Friend;
  
  created() {
  }

}
</script>

<style>
</style>