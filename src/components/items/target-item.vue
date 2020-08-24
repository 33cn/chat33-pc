<!--
  @Author: yuanzeyu
  @Date: 2019/1/15
  @Desc: 联系人页的列表项、搜索结果列表项、选取弹窗列表项（边距不同） todo 提出字母分类列表组件
-->
<template>
  <div class="target_item" :class="{'target_item_active':active}">
    <common-header class="header" :url="target.avatar"></common-header>
    <span :title="target.remark || target.name">{{target.remark || target.name}}</span>
    <slot></slot>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import CommonHeader from '../common-header.vue';

  @Component({
    components: {
      CommonHeader
    }
  })
  export default class TargetItem extends Vue {
    @Prop() public target!: Group | Friend;
    @Prop() public active!: boolean;
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .target_item {
    padding: 11px 10px;
    height: 30px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .header {
    margin-right: 10px;
    vertical-align: middle;
    width: 30px;
    height: 30px;
  }

  .target_item_active {
    background: var(--contact-active-background);
  }
</style>
