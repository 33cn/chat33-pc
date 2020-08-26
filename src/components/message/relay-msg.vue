<!--
  @Author: yuanzeyu
  @Date: 2018/12/28
  @Desc: 合并转发消息显示
-->
<template>
  <div class="relay">
    <h2 v-if="msg.channelType === ChannelType.Group" class="relay-title">[{{msg.fromName}}]的聊天记录</h2>
    <h2 v-else class="relay-title">[{{msg.forwardUserName}}]和[{{msg.fromName}}]的聊天记录</h2>
    <div class="relay-content">
      <p v-for="item in msg.data" :key="item.logId">
        {{item | listLabel}}
      </p>
    </div>
    <div class="relay-hr" :class="{'relay-hr_mine':isMine}"></div>
    <div class="relay-count">聊天记录 共{{msg.data.length}}条</div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {RelayMsg, RelayMsgItem} from '@/config/apiTypings';
  import {ChannelType, MsgType} from '@/config/const-enums';
  import {LabelEnum} from '@/config/config-enum';

  @Component({
    filters: {
      listLabel(val: RelayMsgItem) {
        // todo 提出获取消息标签方法
        let result: string = val.senderInfo ? `${val.senderInfo.nickname}：`:'';
        if (val.msg.encryptedMsg) {
          return `${result}[加密消息]`;
        }
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
          case MsgType.Picture:
            result += LabelEnum.IMAGE_LABEL;
            break;
          case MsgType.Packet:
            result += LabelEnum.PACKET_LABEL;
            break;
          case MsgType.RelayMsg:
            result +=  LabelEnum.RELAY_LABEL;
            break;
          case MsgType.Video:
            result += LabelEnum.VIDEO_LABEL;
            break;
          case MsgType.File:
            result += LabelEnum.FILE_LABEL;
            break;
          default:
            result += LabelEnum.NOT_SUPPORT;
        }
        return result;
      }
    }
  })
  export default class RelayMsgClass extends Vue {
    @Prop() public msg!: RelayMsg;  //TODO 合并转发消息会收不到消息对象
    @Prop() public isMine!: boolean;

    public ChannelType = ChannelType;
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .relay {
    width: 204px;
    cursor: pointer;
  }

  .relay-title {
    margin: 0;
    font-size: var(--normal-font-size);
    font-weight: 400;
    line-height: 20px;
  }

  .relay-content {
    margin-top: 10px;
    font-size: var(--small-font-size);
    font-weight: 400;
    line-height: 17px;
    color: var(--font-color-light);
    max-height: 68px;
    overflow: hidden;
    & > p {
      margin: 0;
    }
  }

  .relay-hr {
    position: relative;
    left:  -10px;
    width: 224px;
    margin-top: 10px;
    border-bottom: var(--common-border);
  }

  .relay-hr_mine {
    border-bottom: 1px solid #9FCAF5;
  }

  .relay-count {
    margin-top: 7px;
    font-size: var(--small-font-size);
    line-height: 17px;
    color: var(--font-color-light);
  }
</style>
