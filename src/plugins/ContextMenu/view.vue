<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc: 右键菜单
-->
<template>
  <focus-dialog @onClose="closeMenu" :showMask="false">
    <ul ref="menu_dom" class="context_menu" :style="{'left':`${myPointX}px`,'top':`${pointY}px`,visibility:showFlag?'visible':'hidden'}">
      <li v-for="(item, index) in itemList"
          class="context_menu-item"
          :class="{'context_menu-item_disabled': item.disabled}"
          :key="index"
          @click="emitClick(item)">{{item.label}}</li>
    </ul>
  </focus-dialog>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import FocusDialog from '../../components/focus-dialog.vue';

  @Component({
    components: {
      FocusDialog
    }
  })
  export default class ContextMenu extends Vue {
    public itemList: any[] = [];
    public pointX: number = 0;
    public pointY: number = 0;
    public onCloseMenu: (() => void) | null = null;
    public showFlag: boolean = false; // 避免获取宽度时抖动
    public isLeft: boolean = false; // 强制点击左侧显示
    public doLeft: boolean = false; // 显示在了左侧

    public get myPointX() {
      return this.pointX + (this.doLeft ? -3 : 3); // 增加间距避免默认hover第一项
    }

    public emitClick(item: any) {
      if (item.disabled) {
        return;
      }
      if (item.onClick) {
        item.onClick();
      }
      this.closeMenu(); // 选中时也关闭
    }

    /**
     * 关闭该右键菜单
     */
    public closeMenu() {
      if (this.onCloseMenu) {
        this.onCloseMenu();
      }
      this.$destroy();
    }

    public beforeDestroy() {
      document.body.removeChild(this.$el);
    }

    public mounted() {
      setTimeout(() => {
        const dom = this.$refs.menu_dom as any;
        if (this.isLeft || document.body.clientWidth - this.pointX < dom.clientWidth) { // 显示在左侧
          this.pointX = this.pointX - dom.clientWidth;
          this.doLeft = true;
          this.$nextTick(() => {
            this.showFlag = true;
          });
        } else {
          this.showFlag = true;
        }

      }, 0);

    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';
  .context_menu {
    /*z-index: 10001;*/
    position: fixed;
    left: 0;
    top: 0;
    box-shadow: var(--shadow-select);
    border-radius: var(--common-border-radius);
    line-height: 34px;
    background: #fff;
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: center;
  }

  .context_menu-item {
    padding: 0 16px;
    min-width: calc(110px - 32px);
    cursor: pointer;
    white-space: nowrap;
    &:not(.context_menu-item_disabled):hover {
      background: var(--gray-background);
    }
  }

  .context_menu-item:not(:last-child) {
    border-bottom: var(--common-border);
  }

  .context_menu-item_disabled {
    color: var(--font-color-light);
    cursor: not-allowed;
  }
</style>
