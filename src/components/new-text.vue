<!--
  @Author: yuanzeyu
  @Date: 2018/10/18
  @Desc: 临时新版文字编辑，todo 更新统一其他编辑
-->
<template>
  <div class="text_editor" :class="{'text_editor_block':isBlock}">
    <div class="text_box" v-show="!editing" @click="showInput" ref="textBox">
      <span>{{text || placeholder}}</span>
    </div>
    <div class="icon_box" v-show="!editing" @click="showInput">
      <slot></slot>
    </div>
    <input v-show="editing"
           class="text_input"
           type="text"
           v-model="bindValue"
           ref="inputDom"
           :maxlength="maxLength"
           @keydown.enter="$event.target.blur()"
           @blur="emitSave">
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class NewText extends Vue {
    @Prop() public text!: string;
    @Prop({default: ''}) public placeholder!: string;
    @Prop() public maxLength!: number;
    @Prop({default: false}) public disabled!: boolean;
    @Prop({default: false}) public isBlock!: boolean;

    public editing: boolean = false;
    public bindValue: string = '';

    public showInput() {
      if (this.disabled) {
        return;
      }
      this.editing = true;
      this.bindValue = this.text;
      this.$nextTick(() => {
        const dom: any = this.$refs.inputDom;
        dom.focus();
      });
    }

    public emitSave() {
      const newValue = this.bindValue.trim();
      if (newValue !== this.text) {
        this.$emit('onEdited', newValue);
      }
      this.editing = false;
    }
  }
</script>

<style scoped>
  .text_editor {
    display: inline-block;
  }

  .text_editor_block {
    display: block;
  }

  .text_box {
    position: relative;
    max-width: 100%;
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .text_input {
    width: 100%;
    font-size: inherit;
    color: inherit;
    text-align: inherit;
    font-weight: inherit;
    outline: none;
    border: none;
    padding: 0;
  }

  .icon_box {
    display: inline-block;
    cursor: pointer;
    padding-left: 10px;
    vertical-align: top;
  }
</style>
