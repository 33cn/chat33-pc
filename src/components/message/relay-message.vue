<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 批量转发消息项
-->
<template>
  <div>
    <text-message v-if="typeof(message.relayContent) !== 'string'"  :message="message" customText="" @clickBabel="detailShowing=true">
      <relay-template :msg="message.relayContent" :isMine="message.isSendByMe"></relay-template>
    </text-message>
    <text-message v-else :message="message" >
    </text-message>
    <focus-dialog :show.sync="detailShowing">
      <relay-dialog :relayMsg="message.relayContent" @onClose="detailShowing=false"></relay-dialog>
    </focus-dialog>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import RelayTemplate from './relay-msg.vue';
  import {UserLoggedInfo} from '@/scripts/object';
  import TextMessage from './text-message.vue';
  import {State} from 'vuex-class';
  import RelayDialog from '@/views/relay-dialog.vue';
  import FocusDialog from '../focus-dialog.vue';
  import MultiRelayMsg from '@/object/messages/MultiRelayMsg';

  @Component({
    components: {
      RelayTemplate,
      TextMessage,
      RelayDialog,
      FocusDialog
    }
  })
  export default class RelayMessage extends Vue {
    @Prop() public message!: MultiRelayMsg;
    @State public myInfo!: UserLoggedInfo;

    public detailShowing: boolean = false;

  }
</script>

<style scoped>
  @import '../../styles/var.css';
</style>
