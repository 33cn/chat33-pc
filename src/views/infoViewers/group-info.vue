<!--
  @Author: yuanzeyu
  @Date: 2018/12/26
  @Desc: 联系人页的群信息
-->
<template>
  <div class="group_info">
    <base-info :target="group"></base-info>
    <div class="hr"></div>
    <ul class="list">
      <li class="item">
        <div class="item-key">群成员</div>
        <div>共{{group.memberCount}}人</div>
      </li>
      <li class="item">
        <div class="item-key">来源</div>
        <div class="item-value">{{group.source}}</div>
      </li>
    </ul>
    <base-btn class="l-btn" :target="group"></base-btn>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Group from '@/object/targets/Group';
  import BaseBtn from './base-btn.vue';
  import BaseInfo from './base-info.vue';

  @Component({
    components: {
      BaseBtn,
      BaseInfo
    }
  })
  export default class GroupInfo extends Vue {
    @Prop() public group!: Group;
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .group_info {
    box-sizing: border-box;
    height: 100vh;
    padding: 40px 40px 0 40px;
    position: relative;
  }

  .hr {
    margin-top: 30px;
    width: 100%;
    border-bottom: var(--common-border);
  }

  .list { /* todo 提出  */
    list-style: none;
    margin: 20px 0 0 0;
    padding: 0;
    line-height: 20px;
  }

  .item {
    display: flex;
    &:not(:last-child) {
      margin-bottom: 10px;
    }
  }

  .item-key {
    width: 70px;
    color: var(--font-color-light);
  }

  .item-value {
    flex: 1;
  }

  .l-btn {
    position: absolute;
    right: 0;
    bottom: 30px;
    left: 0;
  }
</style>
