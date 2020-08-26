<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 语音消息
-->
<template>
  <text-message v-if="!message.content" id="audio_message" :message="message" customText="" @clickBabel="handleClickAudio">
    <div class="icon_box_wrapper" :class="{'icon_box_wrapper_mine':sendByMe}" :style="babelMargin">
      <div class="icon_box"
           :class="{'icon_wrapper_play':audioPlaying===message}">
        <img class="icon" src="../../assets/voice.svg" alt="语音">
      </div>
    </div>

    <div class="info" :class="{'info_mine':sendByMe}">
      <div class="info-unread" :class="{'info-unread_hide':sendByMe||!message.isUnPlayed}"></div>
      <div class="info-time">{{Math.round(message.duration)}}s</div>
    </div>
    <slot></slot>
  </text-message>
  <text-message v-else :message="message">
  </text-message>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import TextMessage from './text-message.vue';
  import {UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {Action, State} from 'vuex-class';
  import {ClickAudioParam} from '@/config/type';
  import AudioMsg from '@/object/messages/AudioMsg';
  import SnapAudioMsg from '@/object/messages/snapMsg/SnapAudioMsg';

  @Component({
    components: {
      TextMessage
    }
  })
  export default class AudioMessage extends Vue {
    @Prop() public message!: AudioMsg | SnapAudioMsg;
    @Prop({default: false}) public autoPlay!: boolean; // 创建后自动播放
    @State public myInfo!: UserLoggedInfo;
    @State public audioPlaying!: AudioMsg | SnapAudioMsg | null;
    @State public chatTarget!: Group | Friend;
    @Action public clickAudio!: (param: ClickAudioParam) => void;


    public get sender() {
      return this.message.sender;
    }

    public get sendByMe() {
      return this.sender.id === this.myInfo.id;
    }

    public get babelMargin(): string {
      const time = this.message.duration;

      const MIN_WIDTH = 80;
      const MIN_TIME = 1;
      let width: number = 0;
      if (time <= MIN_TIME) {
        width = MIN_WIDTH;
      } else {
        const MAX_WIDTH = 300;
        const MAX_TIME = 60;
        const duration = MAX_WIDTH - MIN_WIDTH;
        width = duration / (MAX_TIME - MIN_TIME) * (time - MIN_TIME);
      }
      const margin = width + MIN_WIDTH - 20 - 22; // - padding - icon.width
      return `${this.sendByMe ? 'margin-left' : 'margin-right'}:${margin}px`;
    }

    public handleClickAudio() {
      this.clickAudio({
        audioMessage: this.message,
        target: this.chatTarget
      });
    }

    public created(): void {
      if (this.autoPlay) {
        this.handleClickAudio();
      }
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .icon_box_wrapper {
    width: 22px;
  }

  .icon_box {
    float: left;
    position: relative;
    display: inline-block;
    width: 22px;
    height: 20px;
    border-radius: 50%;
    overflow: hidden;
  }

  .icon_box_wrapper_mine {
    float: right;
    & .icon_box {
      float: right;
    }
    & .icon {
      transform: scaleX(-1);
      right: 0;
      left: initial;
    }
  }

  .icon_wrapper_play {
    animation: voice 1.5s linear infinite;
  }

  .icon {
    position: absolute;
    top: 0;
    left: 0;
  }

  @keyframes voice {
    0% {
      width: 4px;
    }
    33% {
      width: 4px;
    }
    34% {
      width: 10px;
    }
    66% {
      width: 10px;
    }
    67% {
      width: 22px;
    }
    100% {
      width: 22px;
    }
  }

  .info {
    position: absolute;
    top: 0;
    left: calc(100% + 10px);
  }

  .info_mine {
    right: calc(100% + 10px);
    left: initial;
  }

  .info-unread {
    margin-top: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--font-color-red);
  }

  .info-unread_hide {
    visibility: hidden;
  }

  .info-time {
    margin-top: 2px;
    color: var(--font-color-light);
    line-height: 20px;
    white-space: nowrap;
  }
</style>

<style>
  #audio_message {
    & .message_babel {
      cursor: pointer;
    }
  }
</style>
