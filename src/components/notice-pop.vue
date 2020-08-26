<!--
  @Author: yuanzeyu
  @Date: 2019/2/1
  @Desc: 置顶的群公告
-->
<template>
  <div class="notice_pop">
    <h2 class="title">
      <img class="title-close" src="../assets/close_blue.svg" alt="关闭" @click="emitClose">
      <img class="title-icon" src="../assets/alert.svg" alt="公告">
      <span>{{notice.sender.name}}</span>
      <span class="title-time">{{notice.sendTime | formatTime}}</span>
    </h2>
    <p class="content" @click="handleClickLink" v-linkified:options="linkifyOptions">
      {{notice.content}}</p>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {formatShortDate} from '@/scripts/common';
  import {TimeConfig} from '@/config/config-enum';
  import {handleClickLink} from '@/utils/app';
  import GroupAnnounce from '@/object/messages/GroupAnnounce';


  @Component({
    components: {
    },
    filters: {
      formatTime(val: number) {
        return formatShortDate(val, true);
      }
    }
  })
  export default class NoticePop extends Vue {
    @Prop() public notice!: GroupAnnounce;

    public linkifyOptions: any = {
      formatHref: (href: string) => {
        return 'javascript:void(0)';
      }
    };

    public handleClickLink = handleClickLink;

    private timer: any = '';

    public emitClose() {
      this.$emit('onClose');
    }

    public created() {
      this.timer = setTimeout(() => {
        this.emitClose();
      }, TimeConfig.GROUP_NOTIFY_POP);
    }

    public beforeDestroy() {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    }



  }
</script>

<style scoped>
  @import '../styles/var.css';

  .notice_pop {
    background: #C1E9FF;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 0 18px 5px 20px;
  }

  .title {
    margin: 0;
    height: 32px;
    line-height: 32px;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
  }

  .title-close {
    float: right;
    margin-top: 9px;
    width: 14px;
    cursor: pointer;
  }

  .title-icon {
    margin: 7px 10px 0 0;
    vertical-align: top;
    width: 18px;
  }

  .title-time {
    margin-left: 10px;
  }

  .content {
    margin: 5px 0 0 0;
    font-size: var(--normal-font-size);
    color: var(--font-color-dark);
    line-height: 20px;
    font-weight: 500;
  }
</style>
