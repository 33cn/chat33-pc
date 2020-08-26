<!--
  @Author: yuanzeyu
  @Date: 2019/2/24
  @Desc: 饼状进度图
-->
<template>
  <div class="pie" :class="{'pie_square':square}" :style="{background:isTransWait?'transparent':localProcessColor,width:size,height:size}">
    <div class="pie_wrapper">
      <div class="pie-inner-wrapper">
        <div class="pie-inner" :style="`transform: rotate(${leftRotate}deg)`">
          <div class="left" :style="{background:isTransWait?localProcessColor:'transparent'}"></div>
          <div class="right" :style="{background:isTransWait?'transparent':localWaitingColor}"></div>
        </div>
      </div>
      <div class="pie-inner-wrapper pie-inner-wrapper_right">
        <div class="pie-inner" :style="`transform: rotate(${rightRotate}deg)`">
          <div class="left" :style="{background:isTransWait?'transparent':localWaitingColor}"></div>
          <div class="right" :style="{background:isTransWait?localProcessColor:'transparent'}"></div>
        </div>
      </div>
      <slot></slot>
    </div>
  </div>

</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class PieLoading extends Vue {
    @Prop() public current!: number;
    @Prop() public total!: number;
    @Prop() public percent!: number; // 当前比例，存在则current\total无效
    @Prop({default: 'transparent'}) public processColor!: string;
    @Prop({default: '#000'}) public waitingColor!: string;
    @Prop({default: '300px'}) public size!: string;
    @Prop({default: false}) public reverse!: boolean; // 逆时针
    @Prop({default: false}) public square!: boolean; // 是正方形

    /**
     * 等待中颜色是透明
     */
    public get isTransWait(): boolean {
      return this.localWaitingColor === 'transparent';
    }

    /**
     * 当前进度比例
     */
    public get localPercent(): number {
      const result = this.percent || this.current / this.total;
      return this.reverse ? 1 - result : result;
    }

    /**
     * 左侧半圆旋转度数（用于生成右侧进度）
     */
    public get leftRotate(): number {
      return this.localPercent > 0.5 ? 180 : this.localPercent * 360;
    }

    public get localProcessColor() {
      return this.reverse ? this.waitingColor : this.processColor;
    }

    public get localWaitingColor() {
      return this.reverse ? this.processColor : this.waitingColor;
    }

    /**
     * 右侧半圆旋转度数（用于生成左侧进度）
     */
    public get rightRotate(): number {
      const rotatePercent = this.localPercent - 0.5;
      return rotatePercent > 0 ? rotatePercent * 360 : 0;
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .pie {
    background: transparent;
    border-radius: 50%;
    overflow: hidden;
    font-size: 0;
  }

  .pie_wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .pie_square {
    border-radius: 0;
  }

  .pie-inner-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    left: 50%;
    bottom: 0;
    overflow: hidden;
    & > .pie-inner {
      position: absolute;
      top: -100%;
      right: -100%;
      bottom: -100%;
      left: -200%;
      & > div {
        display: inline-block;
      }
      & > .left {
        width: 50%;
        height: 100%;
      }

      & > .right {
        width: 50%;
        height: 100%;
      }

    }
  }

  .pie-inner-wrapper_right {
    right: 50%;
    left: 0;
    & > .pie-inner {
      right: -200%;
      left: -100%;
    }
  }
</style>
