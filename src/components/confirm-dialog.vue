<!--
  @Author: yuanzeyu
  @Date: 2018/11/12
  @Desc: 确认弹窗
-->
<template>
  <div id="confirm_dialog" class="confirm_dialog">
    <img class="logo" :src="img" alt="logo">
    <slot></slot>
    <button v-show="showCancel" class="g-btn_default btn btn_cancel" @click="$emit('cancel')">取消</button>
    <button class="g-btn_active btn" @click="$emit('confirm')">确定</button>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import platform from '@/config/platform';

  @Component
  export default class ConfirmDialog extends Vue {
    @Prop({default: true}) public showCancel!: boolean;
    public label: string = '';
    public img = platform.Logo;
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .confirm_dialog {
    z-index: 999;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    padding: 30px 10px 32px 10px;
    width: calc(336px - 20px);
    background: #fff;
    box-shadow: var(--shadow-dialog);
    border-radius: 10px;
    font-size: 14px;
    color: var(--font-color-dark);
    text-align: center;
    line-height: 20px;
    & > div { /* todo 修复 */
      display: table-cell;
      vertical-align: middle;
      height: 80px;
      text-align: left;
      & > span {
        color: var(--icon-active-color);
      }
    }
  }

  .logo {
    float: left;
    width: 80px;
  }

  .btn {
    margin-top: 30px;
    font-weight: bold;
    height: 28px;
    font-size: var(--small-font-size);
    cursor: pointer;
    clear: both;
  }

  .btn_cancel {
    margin-right: 20px;
  }
</style>
