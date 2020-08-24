<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 聊天消息列表的消息项
-->
<template>
  <div>
    <text-message v-if="message instanceof TextMsg" :message="message">
      <slot></slot>
    </text-message>
    <picture-message v-else-if="message instanceof ImageMsg" :message="message">
      <slot></slot>
    </picture-message>
    <audio-message v-else-if="message instanceof AudioMsg" :message="message" :autoPlay="autoPlay">
      <slot></slot>
    </audio-message>
    <packet-message v-else-if="message instanceof PacketMsg" :message="message"></packet-message>
    <relay-message v-else-if="message instanceof MultiRelayMsg" :message="message"></relay-message>
    <video-message v-else-if="message instanceof VideoMsg" :message="message"></video-message>
    <file-message v-else-if="message instanceof FileMsg" :message="message"></file-message>
    <pay-charge v-else-if="(message instanceof PayMsg)&&message.isCharge" :message="message"></pay-charge>
    <pay-receive v-else-if="message instanceof PayMsg" :message="message"></pay-receive>
    <!-- 群公告消息 -->
    <notice-item v-else-if="message instanceof GroupAnnounce" :notice="message"></notice-item>
    <!-- 系统消息 -->
    <label-item v-else-if="isLabel" :notify="message"></label-item>
    <div v-else-if="isLike" ></div>
    <div v-else>异常：不支持的消息</div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import NoticeItem from './notice-item.vue';
  import LabelItem from './label-item.vue';
  import TextMessage from './text-message.vue';
  import PictureMessage from './picture-message.vue';
  import AudioMessage from './audio-message.vue';
  import PacketMessage from './packet-message.vue';
  import RelayMessage from './relay-message.vue';
  import FileMessage from './file-message.vue';
  import VideoMessage from './video-message.vue';
  import PayCharge from '@/components/message/pay-charge.vue';
  import PayReceive from '@/components/message/pay-receive.vue';
  import {MessageType} from '@/object/messages';
  import TextMsg from '@/object/messages/TextMsg';
  import AudioMsg from '@/object/messages/AudioMsg';
  import MultiRelayMsg from '@/object/messages/MultiRelayMsg';
  import PayMsg from '@/object/messages/PayMsg';
  import PacketMsg from '@/object/messages/PacketMsg';
  import GroupAnnounce from '@/object/messages/GroupAnnounce';
  import LabelNotice from '@/object/messages/notice/LabelNotice';
  import PayNotice from '@/object/messages/notice/PayNotice';
  import VideoMsg from '@/object/messages/VideoMsg';
  import FileMsg from '@/object/messages/FileMsg';
  import ImageMsg from '@/object/messages/ImageMsg';
  import LikeNotice from '@/object/messages/notice/LikeNotice';

  @Component({
    components: {
      NoticeItem,
      LabelItem,
      TextMessage,
      PictureMessage,
      AudioMessage,
      PacketMessage,
      RelayMessage,
      FileMessage,
      VideoMessage,
      PayCharge,
      PayReceive
    }
  })

  export default class MessageItem extends Vue {
    @Prop() public message!: MessageType;
    @Prop({default: false}) public autoPlay!: boolean;

    public get isLabel(): boolean {
      return (this.message instanceof LabelNotice) || (this.message instanceof PayNotice);
    }

    public get isLike(): boolean {
      return this.message instanceof LikeNotice
    }

    public TextMsg = TextMsg;
    public AudioMsg = AudioMsg;
    public ImageMsg = ImageMsg;
    public FileMsg = FileMsg;
    public VideoMsg = VideoMsg;
    public MultiRelayMsg = MultiRelayMsg;
    public PacketMsg = PacketMsg;
    public PayMsg = PayMsg;
    public GroupAnnounce = GroupAnnounce;
  }
</script>

<style scoped>
  @import '../../styles/var.css';
</style>
