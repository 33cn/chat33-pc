<!--
  @Author: yuanzeyu
  @Date: 2019/2/14
  @Desc: 编辑电话备注
-->
<template>
  <div class="tel_editor">
    <transition-group class="list" :name="transitionActive?'list':''" tag="ul">
      <li v-for="(item, index) in telList" class="item" :key="item.key">
        <img class="item-icon" :src="telDel" alt="删除" @click="removeItem(index)">
        <div class="item-input_label_wrapper">
          <input type="text" class="item-input item-input_label" v-model="item.label" maxlength="6">
          <div class="item-input_label_wrapper-count">{{item.label.length}}/6</div>
        </div>
        <div class="hr"></div>
        <input type="text"
               class="item-input item-input_value"
               v-model="item.value"
               maxlength="20"
               placeholder="输入电话号码"
               @input="limitNumber(item)">
      </li>
    </transition-group>
    <div v-show="telList.length<FormLimit.NoteTel">
      <img class="item-icon"
           :src='telAdd'
           alt="添加"
           @click="addItem">
      <div class="item-add" @click="addItem">添加电话</div>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {FormLimit} from '@/config/config-enum';
  import {NoteTel} from '@/config/type';

  @Component
  export default class TelEditor extends Vue {
    @Prop() public telList!: NoteTel[];
    @Prop() public transitionActive!: boolean;
    public FormLimit = FormLimit;
    private telDel = "../assets/tel_del.svg";
    private telAdd = "../assets/tel_add.svg";

    public limitNumber(item: NoteTel) {
      item.value = item.value.replace(/[^0-9]/g, '');
    }

    public addItem() {
      this.telList.push({
        label: '手机',
        value: '',
        key: String(Math.random())
      });
    }

    public removeItem(index: number) {
      this.telList.splice(index, 1);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .item {
    display: block;
    overflow: hidden;
    height: calc(32px + 10px);
  }

  .item-add {
    display: inline-block;
    padding: 0 10px;
    width: calc(316px - 20px);
    height: 32px;
    background: var(--gray-background);
    color: var(--common-blue);
    border-radius: 4px;
    line-height: 32px;
    cursor: pointer;
  }

  .item-icon {
    vertical-align: middle;
    margin-right: 4px;
    cursor: pointer;
  }

  .item-input {
    padding: 0 10px;
    border: none;
    outline: none;
    height: 32px;
    background: var(--gray-background);
    border-radius: 4px;
    box-sizing: border-box;
    font-weight: 500;
    font-size: var(--normal-font-size);
  }

  .item-input_label_wrapper {
    display: inline-block;
    position: relative;
  }

  .item-input_label_wrapper-count {
    position: absolute;
    top: 0;
    right: 4px;
    line-height: 32px;
    color: var(--font-color-light);
    font-size: var(--small-font-size);
  }

  .item-input_label {
    width: 120px;
  }

  .hr {
    display: inline-block;
    height: 2px;
    width: 6px;
    background: var(--gray-background);
    vertical-align: middle;
  }

  .item-input_value {
    width: 190px;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }
  }

  .list-enter-active, .list-leave-active {
    transition: all 0.3s;
  }
  .list-enter, .list-leave-to
    /* .list-leave-active for below version 2.1.8 */ {
    opacity: 0;
    /*transform: translateY(32px);*/
    height: 0;
  }
</style>
