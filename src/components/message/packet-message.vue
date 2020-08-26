<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 红包消息(暂时和文字消息相同)
-->
<template>
  <text-message :message="message" :customText="packetLabel"></text-message>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import TextMessage from './text-message.vue';
  import {NotifyEnum} from '@/config/config-enum';
  import PacketMsg from '@/object/messages/PacketMsg';

  @Component({
    components: {
      TextMessage
    }
  })
  export default class PacketMessage extends Vue { // todo 移除用于转发的prop
    @Prop() public message!: PacketMsg;

    public packetLabel = NotifyEnum.PACKET_MSG;
  }
</script>
