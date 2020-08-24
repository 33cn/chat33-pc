<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc: tab
-->
<template>
  <div class="tab">
    <div v-for="(item, index) in labels"
         :key="index"
         class="tab-item"
         :class="{'tab-item_active': value===item}"
         @click="emitSelect(item)">
      <span>{{item}}</span>
      <red-count v-if="counts" class="tab-item-count" :count="counts[index]" :isGrey="false"></red-count>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import RedCount from './red-count.vue';

  @Component({
    components: {
      RedCount
    }
  })
  export default class TabBar extends Vue {
    @Prop() private labels!: string[];
    @Prop() private counts!: number[];
    @Prop() private value!: string;
    
    private emitSelect(val: string) {
      this.$emit('input', val);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .tab {
    margin-bottom: 10px;
    text-align: center;
  }

  .tab-item {
    display: inline-block;
    position: relative;
    width: 80px;
    font-weight: 600;
    line-height: 30px;
    text-align: center;
    color: var(--font-color-light);
    cursor: pointer;
  }

  .tab-item-count {
    position: absolute;
    right: 10px;
    top: -6px;
  }

  .tab-item_active {
    background: #32B2F7;
    border-radius: 20px;
    color: #fff;
  }
</style>
