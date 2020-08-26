<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 消息多选操作栏
-->
<template>
  <div class="selector_menu">
    <div class="item_wrapper" @click="$emit('onRelay',false)">
      <img src="../assets/singleRelay.svg" alt="逐条转发">
      <p class="item-title">逐条转发</p>
    </div>
    <div class="item_wrapper" @click="$emit('onRelay',true)">
      <img src="../assets/multiRelay.svg" alt="合并转发">
      <p class="item-title">合并转发</p>
    </div>
    <div class="item_wrapper" @click="$emit('onDelete')">
      <img src="../assets/multiDelete.svg" alt="删除">
      <p class="item-title">删除</p>
    </div>
    <img class="icon_close" src="../assets/close_blue.svg" alt="关闭" @click="$emit('onCancel')">
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';

  @Component
  export default class SelectorMenu extends Vue {
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .selector_menu {
    padding: 45px 123px;
    background: #fff;
    text-align: center;
  }

  .item_wrapper {
    display: inline-block;
    width: 48px;
    cursor: pointer;
  }

  .item_wrapper:not(:last-child) {
    margin-right: 22px;
  }

  .item-title {
    margin: 12px 0 0 0;
    font-size: var(--small-font-size);
    color: var(--font-color-dark);
    font-weight: 400;
  }

  .icon_close {
    position: absolute;
    top: 69px;
    right: 68px;
    width: 20px;
    cursor: pointer;
  }
</style>
