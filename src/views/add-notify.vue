<!--
  @Author: yuanzeyu
  @Date: 2018/10/18
  @Desc: 发布群公告
-->
<template>
  <common-dialog title="发布公告" @onClose="emitCloseDialog">
    <div class="m-wrapper">
      <div class="m-wrapper-count">{{notify.length}}/{{maxLength}}</div>
      <textarea class="m-wrapper-input" v-model="notify" :maxlength="maxLength" placeholder="点击编辑公告内容"></textarea>
      <div class="m-wrapper-btn_wrapper">
        <button class="g-btn_default" @click="emitCloseDialog">取消</button>
        <button class="g-btn_active" :class="{'g-btn_active_disable': notify.length < 1}" @click="submitNotify">确定</button>
      </div>
    </div>
  </common-dialog>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import CommonDialog from '../components/common-dialog.vue';
  import URLS from '../config/urls';
  import {FormLimit} from '../config/config-enum';

  @Component({
    components: {
      CommonDialog
    }
  })
  export default class TextEdit extends Vue { // todo 与edit-base
    @Prop() public id!: string;

    public notify: string = '';
    public maxLength = FormLimit.GroupNotify;

    public emitCloseDialog(): void {
      this.$emit('update:showing', false);
    }

    public async submitNotify(): Promise<void> {
      const data = await this.$post(URLS.ADD_GROUP_NOTIFY, {
        roomId: this.id,
        content: this.notify
      });
      if (data) {
        this.emitCloseDialog();
      }
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';
  .m-wrapper {
    padding: 0 17px;
    font-size: 0;
  }

  .m-wrapper-count {
    font-size: var(--normal-font-size);
    color: var(--font-color-light);
    font-weight: 500;
  }

  .m-wrapper-input {
    margin-top: 20px;
    width: 100%;
    height: 70px;
    outline: none;
    border: none;
    color: var(--font-color-dark);
    font-weight: 500;
    line-height: 20px;
    font-size: var(--normal-font-size);
    resize: none;
  }

  .m-wrapper-btn_wrapper {
    margin-top: calc(186px - 50px);
    text-align: center;
    margin-bottom: 30px;
    & > button {
      width: 90px;
      height: 30px;
    }
    & > button:last-child {
      margin-left: 20px;
    }
  }
</style>
