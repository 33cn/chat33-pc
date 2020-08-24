<!--
  @Author: yuanzeyu
  @Date: 2018/10/18
  @Desc:
-->
<template>
  <div class="text_editor">
    <template v-if="!multiLine">
      <div v-if="!editing"
           class="text_box"
           :class="{'text_input_disable':disabled,'text_input_holder':!text}"
           @click="showInput">
        {{text || placeholder}}
      </div>
      <input v-else
             class="text_input"
             :style="`width:${inputWidth}`"
             type="text"
             v-model="bindValue"
             ref="inputDom"
             :maxlength="maxLength"
             @keydown.enter="$event.target.blur()"
             @blur="emitSave">
      <div class="icon_box" v-show="!editing" @click="showInput">
        <slot></slot>
        <img v-if="showIcon&&!disabled" src="../assets/edit.svg" alt="编辑">
      </div>
    </template>
    <template v-else>
      <div v-if="!editing"
           ref="multiInput"
           class="text_box_multiLine"
           :class="{'text_input_disable':disabled}" @click="showInput"
           :style="`max-width:${inputWidth}`">
        {{text || placeholder}}
        <img v-if="showIcon&&!disabled" src="../assets/edit.svg" alt="编辑">
      </div>
      <textarea v-else
                v-model="bindValue"
                class="text_input_multiLine"
                :style="`width:${inputWidth};height:${multiInputHeight}px`"
                ref="inputDom"
                :maxlength="maxLength"
                @keydown.enter="$event.target.blur()"
                @blur="emitSave">
      </textarea>
    </template>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component
  export default class TextEdit extends Vue { // todo 优化文字编辑
    @Prop() public text!: string;
    @Prop({default: ''}) public placeholder!: string;
    @Prop() public maxLength!: number;
    @Prop({default: false}) public disabled!: boolean;
    @Prop({default: '100%'}) public inputWidth!: string;
    @Prop({default: false}) public showIcon!: boolean;
    @Prop({default: false}) public multiLine!: boolean;

    public editing: boolean = false;
    public bindValue: string = '';
    public multiInputHeight: number = 20;

    public showInput() {
      if (this.disabled) {
        return;
      }
      if (this.multiLine) {
        const dom = this.$refs.multiInput as Element;
        this.multiInputHeight = dom.clientHeight;
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
  @import '../styles/var.css';

  .text_editor {
    position: relative;
    display: inline-block;
  }

  .text_box {
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    cursor: pointer;
    word-break: break-word;
  }

  .text_box_multiLine {
    cursor: pointer;
    word-break: break-word;
  }

  .text_input_disable {
    cursor: initial;
  }

  .text_input_holder {
    color: var(--font-color-light);
  }

  .text_input {
    font-size: inherit;
    color: inherit;
    text-align: inherit;
    outline: none;
    font-weight: inherit;
    border: none;
    padding: 0;
  }

  .text_input_multiLine {
    display: block;
    font-size: inherit;
    color: inherit;
    text-align: inherit;
    line-height: inherit;
    outline: none;
    font-weight: inherit;
    border: none;
    padding: 0;
    resize: none;
  }

  .icon_box {
    position: absolute;
    left: 100%;
    top: 0;
    cursor: pointer;
    padding-left: 10px;
  }
</style>
