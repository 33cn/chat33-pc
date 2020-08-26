<!--
  @Author: yuanzeyu
  @Date: 2018/10/15
  @Desc:
-->
<template>
  <div class="red_count"
       v-show="count > 0"
       :class="{'red_count_grey': isGrey}"
       :style="{'width': count > 9 ? '20px' : '14px'}">
    <i v-if="count > 99" class="iconfont icon-gengduo more_icon"></i>
    <span v-else>{{count}}</span>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class RedCount extends Vue {
    @Prop() private count!: number;
    @Prop({default: true}) private isGrey!: boolean;
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .red_count {
    display: inline-block;
    background: var(--font-color-red);
    border-radius: 7px;
    height: 14px;
    font-size: 10px;
    text-align: center;
    line-height: 14px;
    color: white;
  }

  .red_count_grey {
    background: #8A97A5;
  }

  .more_icon {
    vertical-align: middle;
    font-size: 2px;
    line-height: 14px;
  }
</style>
