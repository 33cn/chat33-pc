<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 群公告消息项
-->
<template>
  <div class="group_notify_wrapper">
    <select-button class="selector"
                   v-if="chatTarget.selectorShow"
                   :active="chatTarget.selectedItems.includes(notice)"
                   @click.native="chatTarget.switchSelect(notice)"></select-button>

    <div class="group_notify" @contextmenu.prevent="showRightSelect">
      <h2 class="title">
        <img class="title-icon" src="../../assets/alert.svg" alt="公告">
        <span>公告</span>
      </h2>
      <p class="content"
         @click="handleClickLink"
         v-linkified:options="linkifyOptions">
        {{notice.content}}
      </p>
      <div class="info_wrapper">
        <div class="info-name">{{notice.sender.name}}</div>
        <div class="info-time">{{notice.sendTime | formatTime}}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {handleClickLink} from '@/utils/app';
  import {formatShortDate} from '@/scripts/common';
  import {ShowMessageSelectEventParam} from '@/config/type';
  import Bus from '@/scripts/bus';
  import SelectButton from '@/components/select-button.vue';
  import {State} from 'vuex-class';
  import GroupAnnounce from '@/object/messages/GroupAnnounce';

  @Component({
    components: {
      SelectButton
    },
    filters: {
      formatTime(val: number) {
        return formatShortDate(val, true);
      }
    }
  })
  export default class NoticeItem extends Vue {
    @Prop() public notice!: GroupAnnounce;
    @State public chatTarget!: Group | Friend;

    public handleClickLink = handleClickLink;

    public linkifyOptions: any = {
      formatHref: (href: string) => {
        return 'javascript:void(0)';
      }
    };

    public showRightSelect(e: MouseEvent) {
      const param: ShowMessageSelectEventParam = {
        message: this.notice,
        event: e,
        isRelayDialog: false
      };
      Bus.$emit('showMessageSelect', param);
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .group_notify_wrapper {
    position: relative;
  }

  .selector {
    position: absolute;
    top: 50%;
    left: 20px;
    margin-top: -10px;
  }

  .group_notify {
    margin: 0 auto;
    width: calc(380px - 24px - 20px);
    padding: 14px 24px 8px 20px;
    background: var(--input-background);
    border-radius: var(--common-border-radius);
  }

  .title {
    margin: 0;
    height: 22px;
    line-height: 22px;
    font-weight: 500;
    text-align: center;
    font-size: var(--normal-font-size);
  }

  .title-icon {
    margin-right: 10px;
    width: 22px;
    vertical-align: top;
  }

  .content {
    margin: 24px 0 0 0;
    line-height: 20px;
  }

  .info_wrapper {
    display: flex;
    margin-top: 17px;
    color: var(--font-color-light);
    font-size: var(--small-font-size);
  }

  .info-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .info-time {
    margin-left: 10px;
    white-space: nowrap;
  }
</style>
