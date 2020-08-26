<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc: tab
-->
<template>
  <div class="l-notify_pop t-notify_pop g-dialog" @mousedown.stop>
    <div class="wrapper">
      <div>
        <img class="wrapper-img" v-if="isSuccess" src="../../assets/success.svg" alt="成功">
        <img class="wrapper-img" v-else src="../../assets/fail.svg" alt="失败">
      </div>
      <div class="wrapper-text" :class="{'wrapper-text_success': isSuccess}">{{text}}</div>
    </div>
    <div class="icon_close_wrapper" @click="clickClose">
      <i class="iconfont icon-guanbi icon_close"></i>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {TimeConfig} from '../../config/config-enum';

  @Component
  export default class NotifyPop extends Vue {
    public isSuccess: boolean = true;
    public text: string = '';
    private callback: null | (() => void) = null;
    private timer: number = 0;
    private time: number = TimeConfig.NOTIFY_POP_TIME;

    public mounted() {
      this.timer = window.setTimeout(() => {
        this.closePop();
      }, this.time);
    }

    public clickClose() {
      this.closePop();
    }

    private closePop() {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      if (this.callback) {
        this.callback();
      }
      document.body.removeChild(this.$el);
      this.$destroy();
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';
  .l-notify_pop {
    z-index: 9999;
    position: fixed;
    top: var(--pop-top);
    left: 50%;
    transform: translateX(-50%);
  }

  .t-notify_pop {
    padding: 25px 60px 25px 20px;
    width: calc(380px - 60px - 20px);
    max-width: 80%;
    background: #fff;
  }

  .wrapper {
    display: table-row;
    & > div {
      display: table-cell;
      vertical-align: middle;
    }
  }

  .wrapper-img {
    margin-right: 12px;
    width: 44px;
    height: 44px;
    vertical-align: middle;
  }

  .wrapper-text {
    font-size: 14px;
    color: #F06666;
    line-height: 20px;
  }

  .wrapper-text_success {
    color: #6CB4FC;
  }

  .icon_close_wrapper {
    position: absolute;
    top: 0;
    right: 0;
    bottom:0;
    width: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .icon_close {
    color: #8A97A5;
    font-size: 10px;
  }

  .wrapper-text-btn {
    float: right;
    margin-top: 5px;
    width: 48px;
    height: 16px;
    line-height: 16px;
    font-size: 10px;
    background: #8A97A5;
    border-radius: 4px;
    text-align: center;
    color: #fff;
  }

  .wrapper-text-btn:after {
    content: '';
    display: block;
    clear: both;
  }
</style>
