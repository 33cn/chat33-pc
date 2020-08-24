<template>
  <div>
    <div class="common_checkbox" @click="emitChanged">
      <i v-show="value" class="iconfont icon-zhucedenglugou checkbox-icon"></i>
    </div>
    <span class="checkbox-label">{{label}}</span>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  @Component
  export default class CommonCheckbox extends Vue {
    @Prop() public value!: boolean;
    @Prop() public label!: string;

    public emitChanged() {
      this.$emit('input', !this.value);
    }
  }
</script>

<style scoped>
  .common_checkbox {
    margin: 3px 10px 0 0;
    vertical-align: top;
    width: 14px;
    height: 14px;
    background: #E7F3F9;
    display: inline-block;
    border-radius: 2px;
    line-height: 12px;
    text-align: center;
  }

  .checkbox-icon {
    color: #32B2F7;
    font-size: 8px;
    vertical-align: middle;
  }

  .checkbox-label {
    line-height: 20px;
  }
</style>
