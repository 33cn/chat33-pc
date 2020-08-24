<!--
  @Author: yuanzeyu
  @Date: 2019/1/29
  @Desc: 消息列表底部禁言蒙版
-->
<template>
  <div class="footer-muted">
    <span>禁言中 </span>
    <span v-if="showMutedTime">{{target.myMutedRemainTime | dateCount}}</span>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Group from '@/object/targets/Group';
  import {FOREVER_TIME, MemberMutedSet, MutedSet} from '../config/const-enums';
  import {formatDateCount} from '../scripts/common';

  @Component({
    filters: {
      dateCount(val: number) {
        return formatDateCount(val);
      }
    }
  })
  export default class FooterMuted extends Vue {
    @Prop() public target!: Group;

    public get showMutedTime(): boolean {
      const group = this.target;
      const isBlackMuted = group.mutedSet === MutedSet.BlackList && group.myMutedSet === MemberMutedSet.Black;
      return isBlackMuted && group.myMutedRemainTime < FOREVER_TIME;
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .footer-muted {
    color: #fff;
    line-height: 160px;
    text-align: center;
    background: var(--mask-background);
  }
</style>
