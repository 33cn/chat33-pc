<!--
  @Author: yuanzeyu
  @Date: 2019/2/15
  @Desc: 新版底部发消息等按钮（已加好友）
-->
<template>
  <div class="base_btn">
    <div class="item-wrapper" @click="sendMessage">
      <img class="item-icon" src="../../assets/send_message.svg" alt="发送消息">
      <span class="item-label">发送消息</span>
    </div>
    <div v-if="isFriend" class="item-wrapper" @click="deleteShowing=true">
      <img class="item-icon" src="../../assets/delete_friend.svg" alt="删除好友">
      <span class="item-label">删除好友</span>
    </div>
    <div v-else-if="isOwner" class="item-wrapper" @click="dismissShowing=true">
      <img class="item-icon" src="../../assets/delete_friend.svg" alt="解散群聊">
      <span class="item-label">解散群聊</span>
    </div>
    <div v-else class="item-wrapper" @click="quitShowing=true">
      <img class="item-icon" src="../../assets/delete_friend.svg" alt="退出群聊">
      <span class="item-label">退出群聊</span>
    </div>
    <!-- 删除好友确认 -->
    <confirm-dialog v-if="deleteShowing" @cancel="deleteShowing=false" @confirm="confirmDeleteFriend">
      <div>删除后，将同时删除与该联系人的聊天记录，确定删除联系人 <span>{{target.name}}</span> 吗？</div>
    </confirm-dialog>
    <!-- 解散群确认 -->
    <confirm-dialog v-if="dismissShowing" @cancel="dismissShowing=false" @confirm="confirmDeleteGroup">
      <div>确定解散 <span>{{target.name}}</span> 群吗？</div>
    </confirm-dialog>
    <!--  退出群确认 -->
    <confirm-dialog v-if="quitShowing" @cancel="quitShowing=false" @confirm="confirmExitGroup">
      <div>退群通知仅群主和管理员可见，确定退出 <span>{{target.name}}</span> 群吗？</div>
    </confirm-dialog>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import Bus from '@/scripts/bus';
  import ConfirmDialog from '@/components/confirm-dialog.vue';
  import {Action} from 'vuex-class';
  import {MemberType} from '@/config/const-enums';

  @Component({
    components: {
      ConfirmDialog
    }
  })
  export default class BaseBtn extends Vue {
    @Prop() public target!: Friend | Group;
    @Action public deleteFriend!: (target: string | Friend) => void;
    @Action public deleteGroup!: (target: Group) => Promise<void>;
    @Action public quitGroup!: (target: Group) => Promise<void>;

    public deleteShowing: boolean = false;
    public quitShowing: boolean = false;
    public dismissShowing: boolean = false;

    public get isFriend(): boolean {
      return this.target instanceof Friend;
    }

    public get isOwner(): boolean {
      return (this.target as Group).myLevel === MemberType.Owner;
    }

    public sendMessage(): void {
      this.$emit('onClickBtn');
      Bus.$emit('onTrySendMsg', this.target);
    }

    public confirmDeleteFriend() {
      this.deleteShowing = false;
      this.deleteFriend(this.target as Friend);
      this.$emit('onClickBtn');
    }

    /**
     * 退出群
     */
    public async confirmExitGroup() {
      this.quitShowing = false;
      this.quitGroup(this.target as Group);
    }

    /**
     * 解散群
     */
    public async confirmDeleteGroup() {
      this.dismissShowing = false;
      this.deleteGroup(this.target as Group);
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .base_btn {
    height: calc(100px - 19px - 30px); /* 覆盖底部padding */
    padding-top: 19px;
    text-align: center;
  }

  .item-wrapper {
    display: inline-block;
    width: 48px;
    cursor: pointer;
    &:not(:last-child) {
      margin-right: 50px;
    }
  }

  .item-icon {
    width: 40px;
  }

  .item-label {
    margin-top: 2px;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 17px;
  }
</style>
