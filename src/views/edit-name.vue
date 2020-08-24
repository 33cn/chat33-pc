<!--
  @Author: yuanzeyu
  @Date: 2018/11/30
  @Desc: 首次登录显示编辑昵称
-->
<template>
  <common-dialog title="修改昵称">
    <div class="m-wrapper">
      <div class="m-wrapper-count">{{name.length}}/{{maxLength}}</div>
      <input class="m-wrapper-input" type="text" v-model="name" maxlength="20">
      <div class="m-wrapper-btn_wrapper">
        <button class="g-btn_default" @click="emitCloseEditor">取消</button>
        <button class="g-btn_active" :class="{'g-btn_active_disable': name.length < 1}" @click="saveEditedName">确定</button>
      </div>
    </div>
  </common-dialog>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {UserLoggedInfo} from '../scripts/object';
  import {FormLimit} from '../config/config-enum';
  import CommonDialog from '../components/common-dialog.vue';
  import URLS from '../config/urls';
  import {State} from 'vuex-class';

  @Component({
    components: {
      CommonDialog
    }
  })
  export default class EditName extends Vue {
    @State public myInfo!: UserLoggedInfo;

    public maxLength = FormLimit.Name;
    public name: string = '';
    public showing: boolean = true;

    /**
     * 保存编辑昵称
     */
    public async saveEditedName(): Promise<void> {
      const newName = this.name;
      if (!newName) {
        return;
      }
      if (newName !== this.myInfo.name) {
        const data = await this.$post(URLS.EDIT_USER_NAME, {nickname: newName});
        if (data) {
          this.myInfo.name = newName;
          this.emitCloseEditor();
        }
      }
    }

    /**
     * 关闭该弹窗
     */
    public emitCloseEditor(): void {
      this.$emit('update:showing', false);
    }

    public created() {
      this.name = this.myInfo.name;
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
    line-height: 20px;
  }

  .m-wrapper-input {
    margin-top: 20px;
    width: 100%;
    outline: none;
    border: none;
    color: var(--font-color-dark);
    font-weight: 500;
    line-height: 20px;
    font-size: var(--normal-font-size);
  }

  .m-wrapper-btn_wrapper {
    margin: 182px 0 30px 0;
    text-align: center;
    & > button:last-child {
      margin-left: 20px;
    }
  }
</style>
