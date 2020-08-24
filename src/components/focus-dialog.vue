<!--
  @Author: yuanzeyu
  @Date: 2018/12/18
  @Desc: 失焦关闭的弹窗,使用:show.sync
-->
<template>
  <div v-if="show" class="focus_dialog" :class="{'focus_dialog_mask':showMask}" @click="closeDialog" @mousewheel.stop>
    <div @click.stop>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class FocusDialog extends Vue {
    @Prop({default: false}) public closeLayer!: boolean;
    @Prop({default: true}) public show!: boolean;
    @Prop({default: true}) public showMask!: boolean;

    public closeDialog(): void {
      if(this.closeLayer) return;
      this.$emit('update:show', false);
      this.$emit('onClose');
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';
  
  .focus_dialog {
    z-index: 9999;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .focus_dialog_mask {
    background: rgba(36, 55, 78, 0.2);
  }
</style>
