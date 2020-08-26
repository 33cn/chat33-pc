<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc:
-->
<template>
  <input class="input"
         type="text"
         :placeholder="placeholder"
         :value="value"
         @input="emitInput"
         @keydown.enter="handleEnter"
         @blur="emitEdited">
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class CommonInput extends Vue {
    @Prop() public value!: string;
    @Prop({default: '搜索'}) public placeholder!: string;

    public emitInput(e: any) {
      this.$emit('input', e.target.value);
    }

    public emitEdited(e: any) {
      this.$emit('edited', e.target.value);
    }

    public handleEnter(e: any) {
      e.target.blur();
      this.$emit('onEnter', e.target.value);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .input {
    box-sizing: border-box;
    padding-left: 34px;
    height: 24px;
    outline: none;
    background: var(--input-background) url("../assets/search.svg") no-repeat 10px 5px;
    background-size: 14px;
    border: none;
    border-radius: 12px;
    font-size: var(--small-font-size);
  }
</style>
