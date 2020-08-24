<!--
  @Author: yuanzeyu
  @Date: 2018/12/24
  @Desc: 黑色toast
-->
<template>
  <div class="l-toast toast"><span>{{text}}</span><div class="like_wrap"><img src="../../assets/likeToast.svg"/><span>+1</span></div></div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {TimeConfig} from '../../config/config-enum';

  @Component
  export default class NotifyToast extends Vue {
    public text: string = '';
    public isLike: boolean = false;

    public mounted() {
      setTimeout(() => {
        this.closePop();
      }, TimeConfig.NOTIFY_POP_TIME);
    }

    private closePop() {
      document.body.removeChild(this.$el);
      this.$destroy();
    }
  }
</script>

<style scoped>
  .l-toast {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translateX(-50%);
    margin-top: -30px;
  }
  .toast {
    display: flex;
    justify-content: center;
    padding: 20px;
    max-width: calc(380px - 20px - 20px);
    line-height: 22px;
    font-size: 16px;
    font-weight: bold;
    background: #262B31;
    color: #fff;
    border-radius: 8px;
  }
  .like_wrap {
    display: inline-block;
  }

</style>
