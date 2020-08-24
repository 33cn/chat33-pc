<!--
  @Author: yuanzeyu
  @Date: 2018/12/29
  @Desc: 合并转发弹窗展示
-->
<template>
  <div class="relay_dialog" id="relay_dialog">
    <div class="close_wrapper g-tool-no_drag" @click="emitClose">
      <img class="close_wrapper-icon" src="../assets/close.svg" alt="关闭">
    </div>
    <h2 v-if="relayMsg.channelType === ChannelType.Group" class="title">[{{relayMsg.fromName}}]的聊天记录</h2>
    <h2 v-else class="title">[{{relayMsg.forwardUserName}}]和[{{relayMsg.fromName}}]的聊天记录</h2>
    <div class="time_hr">
      <div class="time_hr-content">{{relayMsg.data[0].datetime | formatDate}}—{{LastMsg.datetime | formatDate}}</div>
    </div>
    <div class="content">
      <vue-scroll :ops="ops">
        <div class="content-wrapper">
          <div v-for="(item, index) in relayMsg.data" :key="item.logId">
            <div v-if="!checkIsNewPeriod(item, index)" class="period-label">{{item.datetime | filterChatTime}}</div>
            <text-message v-if="item.msgType===MsgType.Text"
                          class="content-item"
                          :avatar="item.senderInfo.avatar"
                          :name="item.senderInfo.nickname"
                          :headerDisable="true"
                          :message="getMessage(item)">
            </text-message>
            <picture-message v-else-if="item.msgType===MsgType.Picture"
                             class="content-item"
                             :avatar="item.senderInfo.avatar"
                             :name="item.senderInfo.nickname"
                             :headerDisable="true"
                             :message="getMessage(item)">
            </picture-message>
            <video-message v-else-if="item.msgType===MsgType.Video"
                           class="content-item"
                           :avatar="item.senderInfo.avatar"
                            :name="item.senderInfo.nickname"
                           :headerDisable="true"
                           :message="getMessage(item)">
            </video-message>
            <file-message v-else-if="item.msgType===MsgType.File"
                          class="content-item"
                          :avatar="item.senderInfo.avatar"
                          :name="item.senderInfo.nickname"
                          :headerDisable="true"
                          :message="getMessage(item)">
            </file-message>
            <!-- 其他转换为文字显示 -->
            <text-message v-else
                          class="content-item"
                          :avatar="item.senderInfo.avatar"
                          :name="item.senderInfo.nickname"
                          :customText="item | listLabel">
            </text-message>
          </div>
        </div>
      </vue-scroll>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {ApiMsg, RelayMsg, RelayMsgItem} from '@/config/apiTypings';
  import {ChannelType, MsgType} from '@/config/const-enums';
  import {LabelEnum} from '@/config/config-enum';
  import {formatApiMsg, formatChatTime, getRelayMsgToMessage} from '@/scripts/common';
  import TextMessage from '@/components/message/text-message.vue';
  import PictureMessage from '@/components/message/picture-message.vue';
  import VideoMessage from '@/components/message/video-message.vue';
  import FileMessage from '@/components/message/file-message.vue';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {Config} from 'vuescroll';
  import {MessageType} from '@/object/messages';

  @Component({
    components: {
      TextMessage,
      PictureMessage,
      VideoMessage,
      FileMessage
    },
    filters: {
      formatDate(val: number) {
        const date = new Date(val);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      },
      listLabel(val: RelayMsgItem) {
        // todo 提出获取消息标签方法
        let result: string = '';
        switch (val.msgType) {
          case MsgType.Text:
            result += val.msg.content;
            break;
          case MsgType.System: // 公告以普通文字消息显示
            result += val.msg.content;
            break;
          case MsgType.Audio:
            result += LabelEnum.AUDIO_LABEL;
            break;
          case MsgType.Packet:
            result += LabelEnum.PACKET_LABEL;
            break;
          case MsgType.RelayMsg:
            result += LabelEnum.RELAY_LABEL;
            break;
          default:
            result += LabelEnum.NOT_SUPPORT;
        }
        return result;
      },
      image(val: RelayMsgItem) {
        return formatApiMsg(val.msg, val.msgType);
      },
      filterChatTime(val: number): string {
        return formatChatTime(val);
      }
    }
  })
  export default class RelayDialog extends Vue {
    @Prop() public relayMsg!: RelayMsg;

    public ChannelType = ChannelType;
    public MsgType = MsgType;
    public ops: Config = {
      vuescroll: {
        sizeStrategy: 'number'
      }
    };

    public get LastMsg() {
      const arr = this.relayMsg.data;
      return arr[arr.length - 1];
    }

    public emitClose(): void {
      this.$emit('onClose');
    }

    // 返回该消息是否和上条消息在五分钟之内
    public checkIsNewPeriod(msg: RelayMsgItem, index: number) {
      if (index === 0) {
        return false;
      } else {
        const lastMsg = this.relayMsg.data[index - 1];
        const FIVE_MINUTE = 5 * 60 * 1000;
        return msg.datetime - lastMsg.datetime < FIVE_MINUTE;
      }
    }

    public getMessage(item: RelayMsgItem): MessageType {
      return getRelayMsgToMessage(item);
    }

  }
</script>

<style scoped>
  @import '../styles/var.css';

  .relay_dialog {
    flex-direction: column;
    position: fixed;
    top: 50%;
    left: 50%;
    margin-left: -250px;
    transform: translateY(-50%);
    width: 500px;
    background: #fff;
    border-radius: var(--border-radius-dialog);
  }

  .close_wrapper {
    position: absolute;
    top: 0;
    right: 0;
    width: 54px;
    height: 50px;
    cursor: pointer;
    text-align: center;
    line-height: 50px;
  }

  .close_wrapper-icon {
    width: 14px;
    vertical-align: middle;
  }

  .title {
    margin: 0;
    line-height: 50px;
    font-weight: bold;
    font-size: 16px;
    text-align: center;
  }

  .time_hr {
    position: relative;
    margin: 18px auto 8px;
    background: var(--gray-background);
    width: calc(500px - 20px - 20px);
    height: 1px;
  }

  .time_hr-content {
    position: absolute;
    top: -8px;
    left: 140px;
    width: 180px;
    height: 17px;
    text-align: center;
    line-height: 17px;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    background: #fff;
  }

  .content {
    margin-top: 20px;
    max-height: calc(700px - 50px - 47px);
    overflow: auto;
  }

  .content-wrapper {
    padding: 0 20px;
  }

  .content-item {
    margin-bottom: 20px;
  }

  .period-label {
    margin-bottom: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--font-color-light);
    line-height: 17px;
  }
</style>

<style>
  #relay_dialog {
    & .__vuescroll { /* 临时修复vuescroll无法支持max-height */
      max-height: calc(700px - 50px - 47px);
    }
  }
</style>
