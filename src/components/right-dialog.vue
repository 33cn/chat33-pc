<!--
  @Author: yuanzeyu
  @Date: 2018/10/18
  @Desc: 右键位置弹窗
-->
<template>
  <focus-dialog :show.sync="showing" :showMask="false">
    <div class="main_box g-dialog"
         :style="`left:${dialogX}px;top:${dialogY}px;width:${width};height:${height};`"
         ref="mainContent">
      <slot></slot>
    </div>
  </focus-dialog>
</template>

<script lang="ts">
  import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
  import FocusDialog from '../components/focus-dialog.vue';

  @Component({
    components: {
      FocusDialog
    }
  })
  export default class RightDialog extends Vue {
    @Prop() public show!: boolean;
    @Prop() public mouseEvent!: MouseEvent;
    @Prop({default: 'auto'}) public width!: string;
    @Prop({default: 'auto'}) public height!: string;
    public showing: boolean = this.show;
    public dialogX: number = 0;
    public dialogY: number = 0;
    public doShow: boolean = false;

    @Watch('show')
    public syncShowing(val: boolean) {
      this.showing = val;
      if (val) { // 显示时确定位置
        this.$nextTick(() => {
          const el = this.$refs.mainContent as Element;
          this.setPosition(this.mouseEvent, el.clientWidth, el.clientHeight);
          this.$nextTick(() => {
            this.doShow = true;
          });
        });
      } else {
        this.doShow = false;
      }
    }

    @Watch('showing')
    public emitShowing(val: boolean) {
      this.$emit('update:show', val);
    }

    public setPosition(e: MouseEvent, width: number, height: number) {
      const DOM_SIZE = {
        w: width,
        h: height // todo 不支持显示职位时固定
      };
      const clickPoint = {
        x: e.clientX,
        y: e.clientY
      };
      const client = {
        w: document.body.offsetWidth,
        h: document.body.offsetHeight
      };
      const space = {
        right: client.w - clickPoint.x,
        bottom: client.h - clickPoint.y
      };
      const showPoint = {
        x: clickPoint.x,
        y: clickPoint.y
      };
      if (space.right < DOM_SIZE.w && clickPoint.x > space.right) { // 如果右侧空间不足且左侧空间更多
        showPoint.x = clickPoint.x - DOM_SIZE.w;
      }
      if (space.bottom < DOM_SIZE.h && clickPoint.y > space.bottom) {
        showPoint.y = clickPoint.y - DOM_SIZE.h;
      }
      this.dialogX = showPoint.x;
      this.dialogY = showPoint.y;
    }

    public created() {
      this.syncShowing(true);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .main_box {
    position: absolute;
    background: #fff;
    overflow: hidden;
    visibility: visible;
  }
</style>
