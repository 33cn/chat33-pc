<!--
  @Author: zhoudi
  @Date: 2019/10/29
  @Desc: 输入密码组件
-->
<template>
  <div>
      <div class="content__please">请输入密聊密码</div>
      <div class="content__input">
        <input
          type="password"
          class="content_password"
          placeholder="请输入密码"
          pattern="^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$"
          v-model="password"
        />
      </div>
      <div>
        <button class="content__button" @click="submit">确定</button>
      </div>
      <div>
        <button class="content__forget" @click="onForget">忘记密码</button>
      </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ErrorMsg } from "../config/config-enum";
import { Getter, Mutation, State } from "vuex-class";
import { MySocket, UserLoggedInfo } from "@/scripts/object";
import Cryptography from "@/object/targets/Cryptography";
import { EncPasswd, SeedEncKey, SeedDecKey, checkPassword } from "@/utils/tool";
import { resolve } from "url";
import URLS from "../config/urls";
import { toStandardHex, funcChina } from "@/utils/tool";
import Bus from "@/scripts/bus";

const path = require("path");

@Component
export default class PasswordEnter extends Vue {
  @State public myInfo!: UserLoggedInfo;
  @State public socket!: MySocket;
  @Prop({ type: String, default: "remoteExist" }) type!: string;
  @Prop({ default: true }) show!: boolean;

  password: string = "";
  codeValue: string = "";

  get showing() {
    return this.show;
  }

  set showing(val: boolean) {
    if (val) {
      this.$emit("update:show", true);
    } else {
      this.$emit("update:show", false);
    }
  }

  private async submit(): Promise<void> {
    if (this.password.length < 8 || this.password.length > 16 || !checkPassword(this.password)) {
      this.$notify.fail(ErrorMsg.CHECK_OLD_PASSWORD_WRONG);
      return;
    }
    const crypo = new Cryptography();
    const mnenomicWord =
      toStandardHex(this.myInfo.privateKey) || (await crypo.getMnunomic());
    const result = await crypo.decryptoMnemonicWord(
      mnenomicWord,
      this.password
    );
    console.log(result);
    if (funcChina(result)) {
      if (this.myInfo.privateKey) {
        //解密的助记词生成公私钥并保存
        await crypo.createPrK(mnenomicWord, result, this.myInfo.account);
      } else {
        //上传助记词
        const encedMnemonicKey = await crypo.getMnunomic();
        const locolPublicKey: any = await crypo.getPublicKey();
        this.$post(URLS.UPLOAD_SECRET_KEY, {
          publicKey: locolPublicKey,
          privateKey: encedMnemonicKey
        });
      }
      Bus.$emit("onInitSocket");
      this.showing = false;
    } else {
      this.$notify.fail(ErrorMsg.CHART_PASSWORD_WRONG);
      return;
    }
  }

  // const worker = new Worker(path.resolve(__dirname,'../utils/work/js'));
  // worker.onmessage = function(event) {
  //   console.log(event.data);
  // };
  // worker.postMessage(password);

  onForget(): void {
    this.$emit("update:type", "forget");
  }
}
</script>

<style scoped>
.content_password {
  width: 300px;
  height: 32px;
  background: rgba(241, 244, 246, 1);
  border-radius: 4px;
  margin-bottom: 10px;
  border: 0;
  padding-left: 12px;
  box-sizing: border-box;
  text-align: right;
  padding-right: 100px;
}
.content_password::placeholder {
  text-align: left;
}
.content__please {
  width: 278px;
  height: 17px;
  line-height: 17px;
  font-size: 12px;
  margin-bottom: 10px;
}
.content__input {
  margin-bottom: 10px;
}
.content__button {
  width: 140px;
  height: 40px;
  background: rgba(50, 178, 247, 1);
  border-radius: 20px;
  color: white;
  border: none;
}
.content__forget {
  width: 140px;
  height: 40px;
  border-radius: 20px;
  background: transparent;
  color: rgba(50, 178, 247, 1);
  border: none;
}
</style>