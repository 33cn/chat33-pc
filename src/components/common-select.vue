<!--
  @Author: yuanzeyu
  @Date: 2018/10/18
  @Desc: 简易选项弹窗，父元素点击显示，父元素点击阻止了默认冒泡
-->
<template>
  <div class="common_select" @mousedown.stop @click.stop>
    <ul v-show="showing" class="common_select-ul">
      <li v-for="item in options" :key="item.key" @click="selectItem(item.key)">
        <div>{{item.label}}</div>
        <div class="item-tip" v-if="item.tip">{{item.tip}}</div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';

    interface Option {
      label: string;
      tip?: string;
      key: string | number;
    }

    @Component
    export default class CommonSelect extends Vue {
      @Prop() private value!: string | number;
      @Prop() private options!: Option[];
      @Prop() private emitAnyway!: boolean;

      private showing: boolean = false;

      private selectItem(key: string | number) {
        if (this.emitAnyway || this.value !== key) { // 修改了值
          const old = this.value;
          this.$emit('input', key);
          this.$emit('changed', {key, old});
        }
        this.hindSelect();
      }

      private hindSelect() {
        this.showing = false;
        document.body.removeEventListener('mousedown', this.hindSelect);
      }

      private mounted() {
        const parent: any = this.$el.parentNode;
        parent.onclick = () => {
          this.showing = true;
          this.$nextTick(() => {
            document.body.addEventListener('mousedown', this.hindSelect);
          });
        };
      }
    }
</script>

<style scoped>
  @import '../styles/var.css';

  .common_select {
    display: inline-block;
    color: var(--font-color-dark);
    text-align: right;
  }

  .common_select-ul {
    margin: 0;
    padding: 0;
    background: #fff;
    box-shadow: var(--shadow-select);
    border-radius: var(--common-border-radius);
    & > li {
      padding: 7px 16px;
      list-style: none;
      line-height: 20px;
      & > .item-tip {
        font-size: var(--small-font-size);
        color: var(--font-color-light);
        line-height: 17px;
        height: 15px;
      }
    }
    & > li:not(:first-child) {
      border-top: var(--common-border);
    }
  }

</style>
