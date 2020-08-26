<!--
  @Author: yuanzeyu
  @Date: 2019/1/21
  @Desc: 登录chat33，登录中loading状态
-->
<template>
  <div class="login_loading">
    <div class="icon_wrapper">
      <img class="icon-logo" :src="platform.LogoLoading" :alt="platform.name">
      <img class="icon-loading" src="../assets/round-loading.svg" alt="登录中">
    </div>
    <h2 class="tip">正在登录…</h2>
    <button class="g-btn_default btn_cancel" @click="cancel">取消</button>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import platform from '@/config/platform';

  @Component
  export default class LoginLoading extends Vue {
    public platform = platform;
    public cancel(): void {
      // if (this.cancelSource) {
      //   this.cancelSource.cancel();
      // }
      this.$emit('cancel');
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .login_loading {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #fff;
    text-align: center;
  }

  .icon_wrapper {
    display: inline-block;
    margin-top: 79px;
    position: relative;
    width: 182px;
    height: 182px;
    line-height: 182px;
    text-align: center;
  }

  .icon-logo {
    vertical-align: middle;
    height: 160px;
  }

  .icon-loading {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    animation: rotating 2s linear infinite;
  }

  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(1turn);
    }
  }

  .tip {
    margin: 30px 0 0 0;
    font-size: 20px;
    color: var(--common-blue);
    line-height: 28px;
  }

  .btn_cancel {
    margin-top: 70px;
    width: 140px;
    height: 40px;
    border-radius: 20px;
  }

</style>
