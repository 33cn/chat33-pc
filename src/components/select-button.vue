<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 单个原型勾选框
-->
<template>
  <div class="select_button"
       :class="{'select_button_active': value || active}"
       @click="emitChanged">
    <i v-show="value || active" class="iconfont icon-xuanrengou1"></i>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class SelectButton extends Vue {
    @Prop({default: false}) public value!: boolean;
    @Prop({default: false}) public active!: boolean;

    public emitChanged() {
      this.$emit('input', !this.value); // 仅用于v-model
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .select_button {
    display: inline-block;
    box-sizing: border-box;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid var(--font-color-light);
    cursor: pointer;
  }

  .select_button_active {
    background: var(--common-blue);
    border: none;
    text-align: center;
    line-height: 19px;
    color: #fff;
    & > i {
      font-size: 10px;
    }
  }
</style>
