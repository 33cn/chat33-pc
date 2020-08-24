<!--
  @Author: yuanzeyu
  @Date: 2018/12/5
  @Desc: 禁言时间选择器
-->
<template>
  <ul class="time_selector">
    <li :class="{'active': value === FOREVER_TIME}" @click="emitSelect(FOREVER_TIME)">永远</li>
    <li :class="{'active': value === 86400000}" @click="emitSelect(86400000)">24小时</li>
    <li :class="{'active': value === 36000000}" @click="emitSelect(36000000)">10小时</li>
    <li :class="{'active': value === 7200000}" @click="emitSelect(7200000)">2小时</li>
    <li :class="{'active': value === 1800000}" @click="emitSelect(1800000)">30分钟</li>
    <li :class="{'active': value === 600000}" @click="emitSelect(600000)">10分钟</li>
  </ul>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {FOREVER_TIME} from '../config/const-enums';

  @Component
  export default class TimeSelector extends Vue {
    @Prop() public value!: number;

    public FOREVER_TIME = FOREVER_TIME;

    public emitSelect(val: number) {
      this.$emit('input', val);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .time_selector {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    & > li {
      width: 50px;
      height: 52px;
      display: inline-block;
      text-align: center;
      line-height: 52px;
      cursor: pointer;
    }
  }

  .time_selector > .active {
    color: var(--common-blue);
    font-size: var(--normal-font-size);
  }
</style>
