<!--
  @Author: yuanzeyu
  @Date: 2018/10/18
  @Desc:
-->
<template>
  <common-dialog title="群公告" :hasCancel="true" @onClose="emitCloseDialog">
    <img v-if="isManager" slot="icon" src="../assets/add.svg" alt="添加" @click="emitClickAdd">
    <div class="notify_wrapper" ref="notifyListDom" @mousewheel="scrollNotifyList">
      <vue-scroll>
        <div class="notify" v-for="item in group.groupNotifyList" :key="item.id">
          <p class="notify-content">{{item.content}}</p>
          <div class="notify-delete_wrapper" v-show="isManager">
            <img class="notify-delete" src="../assets/delete.svg" @click="deleteNotify(item)" alt="删除">
          </div>
          <div class="notify-sender_wrapper">
            <div class="notify-sender">{{item.sender.name}}</div>
            <div class="notify-time" :class="{'notify-time_padding': !isManager}">{{item.sendTime | formatTime}}</div>
          </div>
        </div>
      </vue-scroll>
    </div>
  </common-dialog>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {formatShortDate} from '@/scripts/common';
  import URLS from '@/config/urls';
  import {NewChannelType} from '@/config/const-enums';
  import {GET_NOTIFY_COUNT} from '@/config/config-enum';
  import CommonDialog from '@/components/common-dialog.vue';
  import GroupAnnounce from '@/object/messages/GroupAnnounce';

  @Component({
    components: {
      CommonDialog
    },
    filters: {
      formatTime(val: number) {
        return formatShortDate(val, true);
      }
    }
  })
  export default class TextEdit extends Vue {
    @Prop() public isManager!: boolean;
    @Prop() public group!: Group;

    public listLoading: boolean = false;

    public emitCloseDialog(): void {
      this.$emit('update:showing', false);
    }

    public emitClickAdd(): void {
      this.$emit('clickAdd');
    }

    public deleteNotify(notify: GroupAnnounce): void {
      this.$post(URLS.REVOKE_MSG, {
        logId: notify.id,
        type: NewChannelType.Group
      });
    }

    public scrollNotifyList() {
      const dom = this.$refs.notifyListDom as Element;
      const isBottom = dom.scrollTop + dom.clientHeight === dom.scrollHeight;
      if (isBottom) {
        this.loadNotify();
      }
    }

    public created() {
      if (this.group.groupNotifyList.length < GET_NOTIFY_COUNT) {
        this.loadNotify();
      }
    }

    private async loadNotify() {
      if (this.group.groupNotifyNextLog !== '-1' && !this.listLoading) {
        this.listLoading = true;
        const list = this.group.groupNotifyList;
        let fakeNextLog: string = '';
        if (list.length > 0) {
          fakeNextLog = list[list.length - 1].id;
        }
        const data = await this.$post(URLS.GET_GROUP_NOTIFY, {
          roomId: this.group.id,
          startId: this.group.groupNotifyNextLog || fakeNextLog, // 请求详情时公告为空则没有nextLog
          number: GET_NOTIFY_COUNT
        });
        if (data) {
          this.group.groupNotifyCount = data.number;
          data.list.forEach((item: any) => {
            if (!list.find((item2) => item2.id === item.logId)) {
              const newAnnounce = new GroupAnnounce({
                id: item.logId,
                msgId: '',
                sendTime: item.datetime,
                senderId: '',
                receiverId: '',
                sender: new Friend({id:'1',name:item.senderName}),
                isSendByMe: false,
                content: item.content
              });
              this.group.groupNotifyList.push(newAnnounce);
            }
          });
          this.group.groupNotifyNextLog = data.nextLog;
          this.$nextTick(() => {
            this.listLoading = false;
          });
        } else {
          this.listLoading = false;
        }
      }
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .notify_wrapper {
    height: 304px;
    overflow: auto;
  }

  .notify {
    padding: 14px 0 14px 18px;
    border-top: var(--common-border);
  }

  .notify:last-child {
    border-bottom: var(--common-border);
  }

  .notify-content {
    padding-right: 10px;
    margin: 0;
    color: var(--font-color-dark);
    font-size: var(--normal-font-size);
    line-height: 20px;
    font-weight: 500;
    word-break: break-word;
  }

  .notify-delete_wrapper {
    right: -18px;
    float: right;
    margin-top: 5px;
    width: 54px;
    height: 32px;
    text-align: center;
    cursor: pointer;
  }

  .notify-delete {
    vertical-align: top;
    margin-top: 9px;
    width: 14px;
  }

  .notify-sender_wrapper {
    display: flex;
    margin-top: 5px;
    color: var(--font-color-light);
    font-size: var(--small-font-size);
    line-height: 32px;
  }

  .notify-sender {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .notify-time {
    white-space: nowrap;
    margin-left: 10px;
  }

  .notify-time_padding {
    padding-right: 10px;
  }
</style>
