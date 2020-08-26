<!--
  @Author: yuanzeyu
  @Date: 2018/10/9
  @Desc: 上方弹出窗口 todo remove top-pop
-->
<template>
  <focus-dialog :show.sync="popShowing">
    <div class="top_pop">
      <slot></slot>
    </div>
  </focus-dialog>

</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import FocusDialog from '../components/focus-dialog.vue';

    @Component({
      components: {
        FocusDialog
      }
    })
    export default class TopPop extends Vue {

      private popShowing: boolean = false;
      
      // 父组件调用
      public showPop() {
        this.popShowing = true;
      }

      public hindPop() {
        this.popShowing = false;
      }
    }
</script>

<style scoped>
  @import '../styles/var.css';
  .top_pop {
    z-index: 99;
    position: fixed;
    top: var(--pop-top);
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    border-radius: var(--border-radius-dialog);
  }
</style>
