<template>
  <text-message :message="message" :customText="msgLabel"></text-message>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import TextMessage from '@/components/message/text-message.vue';
  import {UserLoggedInfo} from '@/scripts/object';
  import {State} from 'vuex-class';
  import {NotifyEnum} from '@/config/config-enum';
  import PayMsg from '@/object/messages/PayMsg';

  /**
   * 转账消息
   * @author yuanzeyu
   * @date 2019-05-05
   * @desc
   */
  @Component({
    components: {
      TextMessage
    }
  })
  export default class PayReceive extends Vue {
    @State public myInfo!: UserLoggedInfo;
    @Prop() public message!: PayMsg;

    public get msgLabel(): string {
      return this.message.isSendByMe ? NotifyEnum.PAY_MSG_MINE : NotifyEnum.PAY_MSG;
    }
  }
</script>

<style scoped>
</style>
