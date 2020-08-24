<!--
  @Author: zhoudi
  @Date: 2019/10/29
  @Desc: 密码设置组件
-->
<template>
  <div>
    <div class="content__please">请设置密聊密码 (8--16位数字、字母或符号组合)</div>
    <div class="content__input">
      <input
        type="password"
        class="content_password"
        placeholder="请设置密码"
        pattern="^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$"
        oninvalid="setCustomValidity('请输入8-16位字母与数字组合')"
        v-model="password"
      />
    </div>
    <div class="content__input">
      <input
        type="password"
        class="content_password"
        placeholder="请重复密码"
        pattern="^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$"
        oninvalid="setCustomValidity('请输入8-16位字母与数字组合')"
        v-model="confirmPassword"
      />
    </div>
    <div>
      <button class="content__button" @click="commit">确定</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ErrorMsg } from "../config/config-enum";
import { Getter, Mutation, State } from "vuex-class";
import { MySocket, UserLoggedInfo, GroupMember } from "@/scripts/object";
import Cryptography from "@/object/targets/Cryptography";
import URLS from "../config/urls";
import { funcChina, checkRate, checkPassword } from "@/utils/tool";
import Group from "../object/targets/Group";
import { EventType, Encrypt } from "@/config/const-enums";
import Bus from "@/scripts/bus";
import { crashReporter, remote } from "electron";

@Component
export default class PasswordSetup extends Vue {
  @State public myInfo!: UserLoggedInfo;
  @State public socket!: MySocket;
  @State public groupList!: Group[];
  @Prop({ type: String, default: "set" }) type!: string;

  public password: string = "";
  public confirmPassword: string = "";
  public codeValue: string = "";
  public cryptography: Cryptography = new Cryptography();

  private async commit(): Promise<void> {
    if (
      !(this.password && this.confirmPassword) ||
      !checkPassword(this.password) ||
      !checkPassword(this.confirmPassword)
    ) {
      this.$notify.fail(ErrorMsg.CHECK_NEW_PASSWORD_WRONG);
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.$notify.fail(ErrorMsg.PASSWORD_INCONSISTENT);
      return;
    }

    if (this.type === "set") {
      await this.createNewNmumonic(this.confirmPassword, this.type);
    } else if (this.type === "forget" && this.myInfo.privateKey) {
      await this.createNewNmumonic(this.confirmPassword, this.type);
    } else if (this.type === "forget") {
      await this.cryptoOldNmunonic(this.confirmPassword);
      Bus.$emit("onInitSocket");
    }
  }

  public async createNewNmumonic(
    password: string,
    type: string
  ): Promise<void> {
    if (type === "set") {
      await this.cryptography.create(this.myInfo.account, password);
      await this.haddleProduct();
      Bus.$emit("onInitSocket");
    } else {
      await this.cryptography.createAndUpdateMnemonic(
        this.myInfo.account,
        password
      );
      Bus.$emit("onInitSocket");
      //更新所有的群密钥
      await this.updateGroupKeys();
      await this.haddleProduct();
    }
    this.$emit("update:show", false);
  }

  public async haddleProduct() {
    await this.cryptography.setPassword(this.confirmPassword);
    const encedMnemonicKey = await this.cryptography.getMnunomic();
    const locolPublicKey: any = await this.cryptography.getPublicKey();
    this.$post(URLS.UPLOAD_SECRET_KEY, {
      publicKey: locolPublicKey,
      privateKey: encedMnemonicKey
    });
  }

  created(){
    // const logger = remote.getGlobal('log');
  }

  public async updateGroupKeys() {
    try {
      const publicKey = await this.cryptography.getPublicKey();
      const socket = this.socket as MySocket;
      const _this = this;
      const _publicKey = publicKey;
      const _socket = socket;
      await (async function loop() {
        for (let i = 0; i < _this.groupList.length; i++) {
          const group = _this.groupList[i];
          await group.getMembers();

          let list: GroupMember[] = group.memberList.filter(
            (item: GroupMember) => {
              // 默认全部，除可能不是成员
              return !item.mayNotMember;
            }
          );
          let groupmenberKeyObj: Array<Object> = [];
          list.forEach(item => {
            if (item.id !== _this.myInfo.id) {
              groupmenberKeyObj.push({ userId: item.id, key: item.publicKey });
            }
          });
          const secret = await _this.getGroupSecretKeys(
            groupmenberKeyObj,
            _publicKey
          ); //arr[1]:群成员id和公钥的 对象列表
          const groupSessionObj = {
            eventType: EventType.ActiveChangeGroupKey,
            roomId: _this.groupList[i].id,
            fromKey: _publicKey,
            secret: secret
          };
          _socket.sendGroupKey(groupSessionObj);
        }
      })();
    } catch (error) {
      console.log(error.message);
    }
  }

  public async getGroupSecretKeys(menberlist: any[], myPublicKey: string) {
    menberlist.unshift({ userId: this.myInfo.id, key: myPublicKey });
    console.log(menberlist);
    return await this.cryptography.generateGroupSecretKeys(menberlist);
  }

  //对未加密的助记词加密并上传
  public async cryptoOldNmunonic(password: string): Promise<void> {
    const uencedMnemonicKey = await this.cryptography.getMnunomic();
    const encedMnemonicKey = await this.cryptography.cryptoMnemonicWord(
      uencedMnemonicKey,
      password
    );

    await this.cryptography.setPassword(this.confirmPassword);
    const locolPublicKey: any = await this.cryptography.getPublicKey();

    await this.cryptography.saveMnemonic("1", encedMnemonicKey);

    this.$post(URLS.UPLOAD_SECRET_KEY, {
      publicKey: locolPublicKey,
      privateKey: encedMnemonicKey
    });
    
    this.$emit("update:show", false);
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
  color: rgba(50, 178, 247, 1);
}
</style>