<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc: 设置页
-->
<template>
  <div class="set_page">
    <vue-scroll>
      <div class="g-drag_bar" style="left: 80px;"></div>
      <!-- todo 优化整理可拖动区域 -->
      <h2 class="header">设置</h2>
      <div class="set_wrapper set_info">
        <h3>
          <header-uploader class="set_info-avatar" :myInfo="myInfo"></header-uploader>
        </h3>
        <div>
          <text-editor
            class="set_info-name"
            :text="myInfo.name"
            :isBlock="true"
            @onEdited="saveName"
            placeholder="未设置昵称"
            :maxLength="FormLimit.Name"
          >
            <img class="set_info-name-icon" src="../assets/edit.svg" alt="编辑" />
          </text-editor>
          <p class="set_info-uid">UID {{myInfo.uid}}</p>
          <button class="g-btn_active tool-btn" @click="logOff">退出登录</button>
        </div>
      </div>
      <div class="set_wrapper">
        <h3>添加设置</h3>
        <div>
          <common-checkbox
            class="tool-checkbox"
            v-model="myInfo.needCheck"
            @click.native="submitNeedCheck"
            label="加我为好友时需要验证"
          ></common-checkbox>
          <add-set class="set-question" :myInfo="myInfo"></add-set>
        </div>
      </div>
      <div class="set_wrapper">
        <h3>安全管理</h3>
        <div>
          <div class="set_wrapper-version">密聊密码</div>
          <div
            class="set__password_text"
          >密聊密码用于加密聊天消息和聊天文件，更换设备登录时需输入密聊密码才可解密历史加密消息，若忘记密码则无法解密历史加密消息，需设置新的密聊密码加密未来的消息，请自行保管好，防止遗失或泄露导致无法找回历史加密消息！</div>
          <button  class="g-btn_active tool-btn" @click="showUpdateDialog">修改密码</button>
          <!-- 修改密码组件 -->
          <update-password :needUpdate.sync="showUpdatePWModel" ></update-password>
        </div>
      </div>
      <div class="set_wrapper">
        <h3>消息设置</h3>
        <div>
          <common-checkbox
            class="tool-checkbox"
            v-model="bindCheckbox"
            label="新消息声音提醒"
            @click.native="saveSet"
          ></common-checkbox>
        </div>
      </div>
      <div class="set_wrapper">
        <h3>检测更新</h3>
        <div>
          <div class="set_wrapper-version">版本号：{{require('../../package').version}}</div>
          <button v-show="!isChecking" class="g-btn_active tool-btn" @click="selectUpdate">检测更新</button>
          <template v-if="isChecking">
            <img class="set_wrapper-loading_icon" src="../assets/update_checking.svg" alt="检测中" />
            <span class="set_wrapper-loading_label">检测中…</span>
          </template>
        </div>
      </div>
      <update-dialog v-if="updaterShowing" :updateInfo="updateInfo" @onCancel="cancelUpdate"></update-dialog>
    </vue-scroll>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { ipcRenderer } from "electron";
import URLS from "@/config/urls";
import { ErrorMsg, FormLimit } from "@/config/config-enum";
import { AddNeedReply, Bool } from "@/config/const-enums";
import { RouterName } from "@/config/type";
import { UserLoggedInfo } from "@/scripts/object";
import imageViewer from "@/plugins/ImageViewer/index";
import CommonCheckbox from "@/components/common-checkbox.vue";
import TopPop from "@/components/top-pop.vue";
import HeaderUploader from "@/components/header-uploader.vue";
import TextEditor from "@/components/new-text.vue";
import UpdateDialog from "@/components/update-dialog.vue";
import AddSet from "@/views/add-set.vue";
import CommonDialog from "@/components/common-dialog.vue";
import { Mutation, State } from "vuex-class";
import Datasource from "@/scripts/data-source";
import CommonInput from "@/components/common-input.vue";
import { Route } from "vue-router";
import Cryptography from "@/object/targets/Cryptography";
import { watch, Stats } from "fs";
import UpdatePassword from "@/views/update-password.vue";
import MnemonicImport from "@/views/mnemonic-import.vue";

@Component({
  components: {
    CommonCheckbox,
    TopPop,
    HeaderUploader,
    TextEditor,
    UpdateDialog,
    AddSet,
    CommonDialog,
    CommonInput,
    UpdatePassword,
    MnemonicImport
  }
})
export default class SetPage extends Vue {
  @State public notifyEnable!: boolean;
  @State public myInfo!: UserLoggedInfo;
  @Mutation public clearStore!: () => void;
  @Mutation public setNotifyEnable!: (enable: boolean) => void;

  public bindCheckbox: boolean = true;
  public imageViewer = imageViewer;
  public FormLimit = FormLimit;
  public isChecking: boolean = false;
  public updaterShowing: boolean = false;
  public updateInfo: any = null;
  public showUpdatePWModel: boolean = false;
  public showCheckPWModel: boolean = false;
  public crypto = new Cryptography();
  public inputedPassword: string = "";
  public checkedPassword: string = "";
  public importStyleObject: Object = { width: "840px", height: "500px" };
  public dialogStyleObject: Object = { width: "460px" };
  public dialogExportStyleObject: Object = { width: "460px", height: "280px" };
  public mnumenicWord: string = "";
  private newErrTag: boolean = false;
  private oldErrTag: boolean = false;
  async created() {
    
  }

  @Watch("notifyEnable")
  public handleNotifyEnableChange(val: boolean) {
    this.bindCheckbox = val;
  }

  public cancelUpdate(): void {
    this.updaterShowing = false;
    this.updateInfo = null;
  }

  public saveSet() {
    this.setNotifyEnable(this.bindCheckbox);
    localStorage.setItem(
      `notifyEnable-${this.myInfo.id}`,
      String(this.bindCheckbox)
    ); // todo 统一到一个键的存json
  }

  public async saveName(val: string) {
    if (!val) {
      return;
    }
    const backUp = this.myInfo.name;
    this.myInfo.name = val;
    const data = await this.$post(URLS.EDIT_USER_NAME, { nickname: val });
    if (!data) {
      this.myInfo.name = backUp;
    }
  }

  /**
   * 提交加好友是否需要验证
   */
  public async submitNeedCheck() {
    const data = await this.$post(URLS.SET_NEED_REPLAY, {
      tp: this.myInfo.needCheck ? AddNeedReply.Yes : AddNeedReply.No
    });
    if (!data) {
      this.myInfo.needCheck = !this.myInfo.needCheck;
    }
  }
  /**
   * 修改密码
   */
  public async showUpdateDialog() {
    this.showUpdatePWModel = true;
  }
  
  /**
   * 点击更新版本
   */
  public selectUpdate() {
    ipcRenderer.on("get-update-available", (event: any, info: any) => {
      this.isChecking = false;
      this.updaterShowing = true;
      this.updateInfo = info;
    });
    ipcRenderer.on("update-error", () => {
      this.isChecking = false;
      this.$notify.fail("检测失败，请重试！");
    });
    ipcRenderer.on("no-update", () => {
      this.isChecking = false;
      this.$toast("当前已是最新版本");
    });
    ipcRenderer.send("check-update");
  }

  public clearElectronEvent() {
    ipcRenderer.removeAllListeners("get-update-available");
    ipcRenderer.removeAllListeners("update-error");
    ipcRenderer.removeAllListeners("no-update");
    ipcRenderer.removeAllListeners("check-update");
  }

  /**
   * 点击退出登录
   */
  public logOff() {
    this.clearStore();
    Datasource.removeInstance(); //销毁数据库单例
    this.$router.push(RouterName.Login);
  }

  public beforeRouteEnter(to: Route, from: Route, next: any): void {
    next((vm: SetPage) => {
      vm.getLogUserInfo();
    });
  }


  /**
   * 确认输入密聊密码
   */
  public async checkConfirm() {
    const password = await this.crypto.getPassword();
    if (password === this.checkedPassword) {
      const mnemonic = await this.crypto.getMnunomic();
      const arr = mnemonic.split("").map((item, index) => {
        if ((index + 1) % 3 === 0) {
          item += "\xa0\xa0";
        }
        return item;
      });
      this.mnumenicWord = arr.join("");
      this.checkedPassword = "";
      this.showCheckPWModel = false;
    } else {
      this.$notify.fail(ErrorMsg.CHART_PASSWORD_WRONG);
    }
  }

  public beforeDestroy() {
    this.clearElectronEvent();
  }

  /**
   * 获取登录用户信息，获取/更新:加好友设置信息/基本信息
   */
  private async getLogUserInfo() {
    const myInfo = this.myInfo;
    const data = await this.$post(URLS.GET_USER_INFO, { id: myInfo.id });
    if (data) {
      const avatar = data.avatar;
      if (avatar) {
        myInfo.name = avatar;
      }
      myInfo.name = data.name;
      myInfo.needCheck = data.needConfirm === Bool.Yes;
      myInfo.needAnswer = data.needAnswer === Bool.Yes;
      myInfo.addQuestion = data.question;
      myInfo.addAnswer = data.answer;
      myInfo.verified = data.verified;
      myInfo.userLevel = data.userLevel;
      myInfo.account = data.account;
    }
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.set_page {
  position: relative;
  padding-left: 40px;
  box-shadow: var(--shadow-border);
  height: 100%;
  overflow: auto;
}

.header {
  margin: 0;
  padding-top: 20px;
  font-size: 24px;
  font-weight: 600;
  line-height: 33px;
}

.set_wrapper {
  margin-top: 30px;
  display: flex;
  & > h3 {
    display: inline-block;
    width: 124px;
    margin: 0;
    font-size: 16px;
    line-height: 22px;
  }
  & > div {
    display: inline-block;
    padding-top: 1px;
    line-height: 20px;
    flex: 1;
  }
}

.set_info {
  & > div {
    padding-top: 0;
  }
}

.g-btn-wrap {
  margin-top: 10px;
}

.set_info-avatar {
  display: block;
  width: 80px;
  height: 80px;
}

.set_info-name {
  width: 90%;
  margin: 0;
  font-size: 24px;
  line-height: 33px;
  font-weight: 600;
  height: 33px;
}

.set_info-name-icon {
  vertical-align: top;
  margin-top: 10px;
}

.set_info-uid {
  margin: 10px 0;
  color: var(--font-color-light);
  line-height: 20px;
}

.set-question {
  margin-top: 10px;
}

.set_wrapper-version {
  margin-bottom: 10px;
}

.set_wrapper-loading_icon {
  vertical-align: top;
  width: 30px;
  animation: rotating 2s linear infinite;
}

.set_wrapper-loading_label {
  margin-left: 10px;
  font-size: 16px;
  font-weight: bold;
  color: var(--common-blue);
  line-height: 30px;
}

.tool-btn {
  width: 90px;
  height: 30px;
  margin-right: 20px;
}

.tool-checkbox {
  margin-right: 10px;
}

.set__password_text {
  width: 500px;
  height: 51px;
  font-size: 12px;
  font-weight: 400;
  color: rgba(138, 151, 165, 1);
  line-height: 17px;
  margin-bottom: 10px;
}

.table_wrap {
  width: 100%;
  display: table;
}

.set_g_input {
  width: 100%;
  display: table-cell;
  height: 160px;
  text-align: center;
  vertical-align: middle;
}

.s-input {
  box-sizing: border-box;
  padding-left: 34px;
  width: 300px;
  height: 32px;
  outline: none;
  background: var(--input-background) no-repeat 10px 5px;
  background-size: 14px;
  border: none;
  border-radius: 4px;
  font-size: var(--small-font-size);
  color: #8a97a5;
}

.g-btngroup {
  margin-top: 30px;
}

.g_marin_top {
  margin-top: 30px;
}

.export_table_wrap {
  width: 100%;
}
.promp {
  width: 400px;
  margin: 10px auto 20px;
  text-align: left;
  font-size: 12px;
  color: rgba(207, 70, 70, 1);
  line-height: 17px;
}

.numenic_word {
  width: 400px;
  height: 60px;
  margin: 0 auto;
  background: rgba(234, 246, 255, 1);
  border-radius: 4px;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  color: rgba(50, 178, 247, 1);
  line-height: 60px;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(1turn);
  }
}
</style>
