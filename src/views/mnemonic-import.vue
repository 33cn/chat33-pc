<template>
  <common-dialog
    title="导入助记词"
    :showing.sync="showing"
    :hasCancel="canClose"
    :class-name="className"
    :closeLayer="closeLayer"
  >
    <div class="mumenic_wrap">
      <div class="mumenic_title">请输入中文助记词，以3个字为一组</div>
      <div>
        <input
          type="text"
          ref="cInput"
          class="code-input"
          @keyup="changeCode"
          @blur="clearFocus"
          v-model="codeValue"
          :maxlength="codeLength"
        />
        <div class="code-content flex-around" @click="onFocus()">
          <div
            :class="['codeCount',{'marginRight':((index + 1) %3)===0},{'go-on': (index === showCode.length)&&focus }]"
            v-for="(item,index) in codeLength"
            :key="index"
          >
            <span :class="{'span-password':true}" v-show="showCode[index]">{{showCode[index]}}</span>
          </div>
        </div>
      </div>

      <div class="password_title">请设置密聊密码（8—30位数字、字母或符号组合）</div>
      <div>
        <input type="password" class="g_password" placeholder="请设置密码" v-model="password" />
      </div>
      <div>
        <input type="password" class="g_password" placeholder="请重复密码" v-model="confirmPassword" />
      </div>
      <div>
        <button class="g-btn_active tool-btn" @click="importNmumonic">开始导入</button>
      </div>
      <div v-if="hasOneKey">
        <div>
          <button class="g-btn_active tool-btn" @click="createNewNmumonic">一键创建新助记词</button>
        </div>
        <div class="g_prompt">一键创建新助记词后无法查看历史加密消息</div>
        <div class="g_numenic_introduce">
          助记词用于保护加密聊天消息，一键创建新助记词后请前往设置—导出助记词，抄下助记词并存放至安全的地方；
          <br />若助记词丢失，重装或换设备登录时将无法查看历史加密消息！并无法重置密聊密码！若助记词被他人获取，将可能获取你的加密消息内容！
        </div>
      </div>
    </div>
  </common-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import CommonDialog from "@/components/common-dialog.vue";
import CommonInput from "@/components/common-input.vue";
import { ErrorMsg } from "../config/config-enum";
import Cryptography from "@/object/targets/Cryptography";
import { MySocket, UserLoggedInfo } from "@/scripts/object";
import { Getter, Mutation, State } from "vuex-class";
import { bar } from 'vuescroll/types/Config';

@Component({
  components: {
    CommonDialog,
    CommonInput
  }
})
export default class MnemonicImport extends Vue {
  @State public myInfo!: UserLoggedInfo;
  @State public socket!: MySocket;
  @Prop({ default: true }) public show!: boolean;
  @Prop() public className!: Object;
  @Prop({ type: Number, default: 15 }) codeLength!: number;
  @Prop({ default: false }) public canClose!: boolean;
  @Prop({ default: false }) public closeLayer!: boolean;
  @Prop({ default: true }) public hasOneKey!:boolean;

  public codeValue: string = "";
  public showCode: string[] = [];
  public focus: boolean = false;
  public password: string = "";
  public confirmPassword: string = "";
  get showing() {
    return this.show;
  }

  set showing(val: boolean) {
    if (val) {
      this.$emit("update:show", true);
    } else {
      this.emitClose();
    }
  }

  public emitClose(): void {
    this.password = "";
    this.confirmPassword = "";
    this.codeValue = "";
    this.showCode = [];
    this.$emit("update:show", false);
    this.$emit("onClose");
  }

  public async importNmumonic(): Promise<void> {
     if(this.codeValue.length <15) {
         this.$notify.fail(ErrorMsg.MNUMONIC_WORD_ERROE);
      return;
     }
     if (this.password.length <8){
      this.$notify.fail(ErrorMsg.CHECK_OLD_PASSWORD_WRONG);
      return
    } 
    if (!(this.password && this.confirmPassword)) {
      this.$notify.fail(ErrorMsg.CHECK_NEW_PASSWORD_WRONG);
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.$notify.fail(ErrorMsg.PASSWORD_INCONSISTENT);
      return;
    }
    const cryptography = new Cryptography();
    this.showing = false;
  }

  changeCode() {
    if (this.codeValue.length > this.codeLength) {
      return;
    }
    this.showCode = [...this.codeValue];
  }

  public onFocus() {
    let cInput: any = this.$refs["cInput"];
    cInput.focus();
    this.focus = true;
  }

  public clearFocus() {
    this.focus = false;
  }
}
</script>

<style scoped>
.code-input {
  position: fixed;
  top: -9999px;
}
.mumenic_title {
  width: 191px;
  height: 17px;
  font-size: 12px;
  font-weight: 400;
  color: rgba(138, 151, 165, 1);
  line-height: 17px;
}
.code-content {
  width: 580px;
  height: 100px;
  background: rgba(241, 244, 246, 1);
  border-radius: 8px;
  margin-bottom: 30px;
}
.flex-around {
  display: flex;
  justify-content: center;
  align-items: center;
}
.password_title {
  width: 278px;
  height: 17px;
  font-size: 12px;
  font-family: PingFangSC;
  font-weight: 400;
  color: rgba(87, 91, 114, 1);
  line-height: 17px;
  margin-bottom: 10px;
}
.codeCount {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 28px;
  border-radius: 1px;
  border-bottom: 1px solid rgba(138, 151, 165, 1);
  margin: 0 4px;
}
.marginRight {
  margin-right: 30px;
}
.span-password {
  font-size: 20px;
  font-weight: 400;
  color: rgba(36, 55, 78, 1);
  line-height: 28px;
}
.go-on {
  animation: heart 0.6s ease-out infinite alternate;
}
@keyframes heart {
  0% {
    border-left: 3px solid rgba(241, 244, 246, 1);
  }
  100% {
    border-left: 3px solid rgba(250, 50, 0, 1);
  }
}

.g_password {
  width: 300px;
  height: 32px;
  background: rgba(241, 244, 246, 1);
  border-radius: 4px;
  margin-bottom: 10px;
  border: 0;
  padding-left: 12px;
  box-sizing: border-box;
}
.tool-btn {
  width: 300px;
  height: 40px;
  margin-top: 20px;
}
.g_prompt {
  width: 244px;
  height: 17px;
  font-size: 12px;
  font-family: PingFangSC;
  font-weight: 400;
  color: rgba(221, 95, 95, 1);
  line-height: 17px;
  margin-top: 10px;
}
.mumenic_wrap {
  margin-left: 60px;
}
.g_numenic_introduce {
  margin-top: 10px;
  font-size: 12px;
  font-family: PingFang-SC;
  font-weight: 500;
  color: rgba(36, 55, 78, 1);
  line-height: 17px;
}
</style>