<!--
  @Author: zhoudi
  @Date: 2019/9/12
  @Desc: 设置密码
-->
<template>
  <div>
    <template v-if="isShow">
        <div class="update-password_wrapper">
          <span></span>
          <label class="set-title" for="oldPassword">旧密码</label>
          <input
            type="password"
            class="set-password-input"
            id="oldPassword"
            placeholder="请输入旧密码"
            pattern="^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$"
            v-model="oldPassword"
          />
        </div>
        <div class="update-password_wrapper">
          <label class="set-title" for="newPassword">设置新密码</label>
          <input
            type="password"
            class="set-password-input"
            id="newPassword"
            placeholder="请设置8——16位数字、字母或符号组合"
            pattern="^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$"
            v-model="newPassword"
          />
        </div>
        <button class="g-btn_active set-add-btn" @click="submitUpdate">确定修改</button>
        <button class="g-btn-pack" @click="packUp">收起</button>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import Cryptography from "@/object/targets/Cryptography";
import { ErrorMsg, SuccessMsg } from "@/config/config-enum";
import { MySocket, UserLoggedInfo } from "@/scripts/object";
import { Getter, Mutation, State } from "vuex-class";
import URLS from "../config/urls";
import { funcChina, checkRate, checkPassword } from "@/utils/tool";

@Component({
  components: {}
})
export default class UpdatePassword extends Vue {
  @State public myInfo!: UserLoggedInfo;
  @Prop() public needUpdate!: boolean;
  public crypto = new Cryptography();

  public oldPassword: string = "";
  public newPassword: string = "";
  get isShow() {
    return this.needUpdate;
  }

  /**
   * 提交修改
   */
  public async submitUpdate() {
    const mnenomicWord = await this.crypto.getMnunomic();
    const result = await this.crypto.decryptoMnemonicWord(
      mnenomicWord,
      this.oldPassword
    );
    if (!funcChina(result)) {
      this.$notify.fail(ErrorMsg.CHART_OLD_PASSWORD_WRONG);
      return;
    }
    if (this.newPassword.length < 8 || this.newPassword.length > 16 || !checkPassword(this.newPassword)) {
      this.$notify.fail(ErrorMsg.CHECK_NEW_PASSWORD_WRONG);
      return;
    }
    
    await this.createNewNmumonic(this.newPassword);

    const success = await this.crypto.setPassword(this.newPassword);
    if (success) {
      const password = await this.crypto.getPassword();
      if (password) {
        this.$notify.success(SuccessMsg.UPDATE_CHART_PASSWORD);
        this.$emit("update:needUpdate", false);
        this.oldPassword = "";
        this.newPassword = "";
      }
    }
  }

  notifyError() {
    this.$notify.fail(ErrorMsg.ERROR_PASSWORD_STRUCTURE);
  }
  public async createNewNmumonic(password: string): Promise<void> {
    await this.crypto.createAndUpdateMnemonic(this.myInfo.account, password);
    await this.crypto.setPassword(password);

    const encedMnemonicKey = await this.crypto.getMnunomic();
    const locolPublicKey: any = await this.crypto.getPublicKey();
    this.$post(URLS.UPLOAD_SECRET_KEY, {
      publicKey: locolPublicKey,
      privateKey: encedMnemonicKey
    });
  }

  public packUp() {
    this.oldPassword = "";
    this.newPassword = "";
    this.$emit("update:needUpdate", false);
  }
}
</script>

<style scoped>
@import "../styles/var.css";
.update-password_wrapper {
  position: relative;
  margin-top: 10px;
  width: 340px;
  font-size: var(--small-font-size);
  font-weight: 500;
  line-height: 17px;
  color: var(--font-color-light);
}
.set-password-input {
  margin-top: 10px;
  box-sizing: border-box;
  width: 100%;
  padding: 6px 10px;
  border-radius: 4px;
  line-height: 20px;
  font-weight: 500;
  font-size: var(--normal-font-size);
  border: none;
  outline: none;
  background: var(--gray-background);
}
.g-btn-pack {
  color: var(--common-blue);
  background: white;
  border: 0;
  margin-left: 30px;
  font-size: var(--normal-font-size);
}
.set-add-btn {
  margin-top: 20px;
  width: 90px;
  height: 30px;
}
.set-title {
  width: 36px;
  height: 17px;
  line-height: 17px;
}
.forgetPwd {
  position: absolute;
  margin-top: 18px;
  margin-left: -70px;
  font-size: var(--normal-font-size);
  background: transparent;
  border: 0;
  color: var(--common-blue);
}
.error {
  color: red;
}
</style>