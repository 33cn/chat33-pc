<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc:
-->
<template>
    <div class="common-switch" :class="{'common-switch_active': value}" @click="doSwitch">
      <div class="spot"></div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';

    @Component
    export default class CommonSwitch extends Vue {
      @Prop() private value!: boolean;

      private doSwitch() {
        const newValue = !this.value;
        this.$emit('changed', newValue);
        this.$emit('input', newValue);
      }
    }
</script>

<style scoped>
  @import '../styles/var.css';

  .common-switch {
    display: inline-block;
    padding: 1px;
    border: 1px solid var(--font-color-light);
    width: calc(36px - 2px - 2px);
    height: calc(18px - 2px - 2px);
    border-radius: 14px;
    cursor: pointer;
  }

  .common-switch_active {
    background: var(--icon-active-color);
    border: 1px solid var(--icon-active-color);
    & > .spot {
      float: right;
      background: #fff;
    }
  }

  .spot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--font-color-light);
  }
</style>
