<template>
  <div class="g-like-warp">
    <vue-scroll ref="listBox">
      <member-list :canBeClick="true" :group="group" @goBack="goBack"></member-list>
    </vue-scroll>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { State, Mutation, namespace, Action } from "vuex-class";

import MemberList from "@/components/member-list.vue";
import Group from "../object/targets/Group";
const addressSign = namespace("addressSign");

@Component({
  components: {
    MemberList
  }
})
export default class groupMemberPage extends Vue {
    @Prop() public group!: Group;
    @addressSign.Mutation("setPageShowing") hideMemberPage!: (payload: any) => void;
    @addressSign.Mutation("setAitInfoList") sendMember!: (payload: any) => void;

    goBack(e:any) {
      this.sendMember({aitInfo:e});
      this.hideMemberPage({showFriendList:false});
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