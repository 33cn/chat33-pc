<template>
  <text-message :message="message" :customText="msgLabel"></text-message>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {NotifyEnum} from '@/config/config-enum';
  import {UserLoggedInfo} from '@/scripts/object';
  import TextMessage from '@/components/message/text-message.vue';
  import {State} from 'vuex-class';
  import PayMsg from '@/object/messages/PayMsg';

  /**
   * 收款消息
   * @author yuanzeyu
   * @date 2019-05-05
   * @desc
   */
  @Component({
    components: {
      TextMessage
    }
  })
  export default class PayCharge extends Vue {
    @State public myInfo!: UserLoggedInfo;
    @Prop() public message!: PayMsg;

    public get msgLabel(): string {
      return this.message.isSendByMe ? NotifyEnum.CHARGE_MSG_MINE : NotifyEnum.CHARGE_MSG;
    }
  }
</script>

<style scoped>
</style>
