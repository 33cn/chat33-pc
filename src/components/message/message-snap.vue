<!--
  @Author: yuanzeyu
  @Date: 2019/1/31
  @Desc: 阅后即焚消息项
-->
<template>
  <div id="message_snap">
    <message-item v-if="message.isSendByMe" :message="message">
      <img class="l-icon_lock l-icon_lock_mine"
           src="../../assets/snap_lock.svg"
           alt="阅后即焚">
    </message-item>
    <text-message v-else-if="message.isLocked"
                  id="snap_lock"
                  :message="message"
                  customText="点击查看"
                  @clickBabel="showSnap">
      <img class="l-icon_lock"
           src="../../assets/snap_lock.svg"
           alt="阅后即焚">
    </text-message>
    <message-item v-else :message="message" :autoPlay="true">
      <div class="snap_count">{{message.snapCount}}</div>
    </message-item>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import TextMessage from './text-message.vue';
  import MessageItem from './message-item.vue';
  import {State} from 'vuex-class';
  import SnapTextMsg from '@/object/messages/snapMsg/SnapTextMsg';
  import SnapImageMsg from '@/object/messages/snapMsg/SnapImageMsg';
  import SnapAudioMsg from '@/object/messages/snapMsg/SnapAudioMsg';

  @Component({
    components: {
      MessageItem,
      TextMessage
    }
  })
  /**
   * @desc 阅后即焚消息仅支持文字、图片、语音
   */
  export default class MessageSnap extends Vue {
    @Prop() public message!: SnapTextMsg | SnapImageMsg | SnapAudioMsg;
    @State public myInfo!: UserLoggedInfo;
    @State public chatTarget!: Group | Friend;

    public showSnap(): void {
      this.message.unlockSnap(this.chatTarget);
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .l-icon_lock {
    position: absolute;
    top: 0;
    right: -10px;
  }

  .l-icon_lock_mine {
    left: -10px;
    right: initial;
  }

  .snap_count {
    position: absolute;
    top: 0;
    right: -10px;
    width: 20px;
    height: 14px;
    line-height: 14px;
    font-size: 10px;
    border-radius: 7px;
    color: #fff;
    text-align: center;
    background: #EF883E;
  }
</style>

<style>
  #message_snap {
    & .message_babel {
      cursor: pointer;
    }
  }
</style>
