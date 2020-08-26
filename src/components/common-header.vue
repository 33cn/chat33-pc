<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc:
-->
<template>
  <div class="common_header" :style="`background-image:url(${url})`" @click="$emit('click', $event)">
    <slot></slot>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class CommonHeader extends Vue {
    @Prop() public url!: string;
  }
</script>

<style scoped>
  .common_header {
    border-radius: 4px;
    display: inline-block;
    cursor: pointer;
    background-size: cover;
    background-position: center;
  }
</style>
