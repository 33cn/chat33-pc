<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc:
-->
<template>
  <div class="letter_selector">
    <div class="letters_wrapper">
      <a v-for="item in letters" :href="`#${flag}${item}`">{{item}}</a>
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class LetterSelector extends Vue {
    @Prop() public letters!: string[];
    @Prop({default: ''}) public flag!: string;
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .letter_selector {
    position: absolute;
    top: 0;
    right: 10px;
    bottom: 0;
    width: 16px;
  }

  .letters_wrapper {
    position: absolute;
    top: 50%;
    width: 16px;
    max-height: 100%;
    overflow: auto;
    transform: translateY(-50%);
    font-size: 10px;
    line-height: 14px;
    & > a {
      display: inline-block;
      width: 100%;
      text-align: center;
      cursor: pointer;
      text-decoration: none;
      color: var(--font-color-light);
    }
  }
</style>
