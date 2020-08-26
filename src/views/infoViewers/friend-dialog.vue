<!--
  @Author: yuanzeyu
  @Date: 2018/12/26
  @Desc: 点击:(会话列表\聊天消息\左上角自己的头像)查看编辑资料
-->
<template>
  <div id="friend_dialog" class="friend_dialog g-dialog">
    <common-info :target="user"
                 :chatTarget="chatTarget"
                 :noSource="noSource"
                 @onClickBtn="$emit('onClickBtn')"
                 :isNumber="true"
                 :autoGetInfo="true">
    </common-info>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {AddFriendEnable} from '@/config/const-enums';
  import CommonInfo from './common-info.vue';

  @Component({
    components: {
      CommonInfo
    }
  })
  export default class FriendDialog extends Vue { // todo low 优化信息弹窗
    @Prop() public user!: Friend | UserLoggedInfo; // 展示的信息
    @Prop() public chatTarget!: Friend | Group | null; // 当前是群聊/好友聊天/自己头像
    @Prop({default: false}) public noSource!: boolean; //  从申请列表添加为true


    public get addFriendEnable(): boolean {
      if (this.chatTarget && this.chatTarget instanceof Group) {
        return (this.chatTarget as Group).addFriendEnable === AddFriendEnable.Yes;
      }
      return true;
    }

    /**
     * 跳转到当前聊天
     */
    public emitClickSend() {
      this.$emit('onClickBtn');
    }
  }
</script>

<style>
  #friend_dialog {
    & .top_wrapper {
      padding: 30px 30px 0 30px;
    }

    & .text {
      margin-left: 10px;
      width: 264px;
    }

    & .hr {
      margin-top: 20px;
    }

    & .content {
      padding: 0 30px;
    }

    & .content_wrapper {
      max-height: calc(440px - 151px - 100px);

      & #commonInfoScroll { /* 临时修复vuescroll无法支持max-height */
        max-height: calc(440px - 151px - 100px);
      }
    }
  }
</style>
