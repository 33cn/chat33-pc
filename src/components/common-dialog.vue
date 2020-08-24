<!--
  @Author: yuanzeyu
  @Date: 2018/11/30
  @Desc: 通用弹窗组件，居中，大小固定，有关闭按钮
-->
<template>
  <focus-dialog :show.sync="show" :closeLayer="closeLayer">
    <div class="common-dialog" :style="className">
      <div class="m-title">
        <span>{{title}}</span>
        <div class="m-title-icon_wrapper m-title-icon_wrapper_first">
          <slot name="icon"></slot>
        </div>
        <div v-if="hasCancel" class="m-title-icon_wrapper" @click="emitClose">
          <img class="m-title-icon_close" src="../assets/close.svg" alt="关闭">
        </div>
      </div>
      <div class="m-content">
        <slot></slot>
      </div>
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
  export default class CommonDialog extends Vue {
    @Prop({default: ''}) public title!: string;
    @Prop({default: false}) public hasCancel!: boolean;
    @Prop({default: true}) public showing!: boolean; // sync
    @Prop({default:()=>{ return {}}}) public className!: Object;
    @Prop({default: false}) public closeLayer!: boolean;

    public get show(): boolean {
      return this.showing;
    }

    public set show(val: boolean) {
      if (val) {
        this.$emit('update:showing', true);
      } else {
        this.emitClose();
      }
    }

    public emitClose(): void {
      this.$emit('update:showing', false);
      this.$emit('onClose');
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .common-dialog {
    /*z-index: 2; !* 覆盖border *!*/
    flex-direction: column;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 374px;
    background: #fff;
    border-radius: var(--border-radius-dialog);
  }

  .m-title {
    color: var(--font-color-dark);
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    line-height: 50px;
  }

  .m-title-icon_wrapper {
    position: absolute;
    right: 0;
    top: 0;
    width: 54px;
    height: 50px;
    cursor: pointer;
    & > img {
      width: 14px;
    }
  }

  .m-content {
  }

  .m-title-icon_wrapper_first {
    right: 54px;
  }
</style>
