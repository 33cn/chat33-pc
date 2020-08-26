<!--
  @Author: yuanzeyu
  @Date: 2018/12/27
  @Desc: 添加好友
-->
<template>
  <div class="add_wrapper">
    <common-header
      class="info-header"
      :url="group.avatar"
      @click.native="imageViewer(group.avatar)"
    ></common-header>
    <div class="info-text_wrapper info-text_wrapper_dialog">
      <h2 class="info-text-name">{{group.name}}</h2>
      <p class="info-text-id">群号 {{group.markId}}</p>
    </div>
    <div class="hr hr_add"></div>
    <div class="info-item">
      <span class="info-item-label">群成员</span>
      <span>{{group.memberCount}}人</span>
    </div>

    <!-- 验证 -->
    <template v-if="group.joinPermission===JoinGroupAuthority.NeedApproval">
      <div class="counter counter_check">{{checkText.length}}/50</div>
      <label class="check-title theme-title" for="checkInput">你需要发送验证申请，等待对方通过</label>
      <textarea
        id="checkInput"
        class="theme-input check-input"
        v-model="checkText"
        maxlength="50"
        :placeholder="`我是 ${myInfo.name}`"
      ></textarea>
    </template>

    <template v-if="group.isTemp">
      <button
        v-if="group.joinPermission===JoinGroupAuthority.Forbidden"
        class="g-btn_active g-btn_active_disable common-btn btn_dialog"
      >禁止加群</button>
      <button
        v-else
        class="g-btn_active common-btn btn_dialog"
        @click="joinGroup"
      >{{group.joinPermission===JoinGroupAuthority.NeedApproval ? '申请入群' : '进入群聊'}}</button>
    </template>
    <!-- 点击跳转到该群聊天 -->
    <button v-else class="g-btn_active common-btn btn_dialog" @click="emitClickSend">进入群聊</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { UserLoggedInfo, MySocket, GroupMember } from "../../scripts/object";
import Group from "@/object/targets/Group";

import CommonHeader from "../../components/common-header.vue";
import URLS from "../../config/urls";
import Bus from "../../scripts/bus";
import imageViewer from "../../plugins/ImageViewer";
import { JoinGroupAuthority, SourceType, EventType } from "../../config/const-enums";
import { SuccessMsg } from "../../config/config-enum";
import { State } from "vuex-class";
import Cryptography from "@/object/targets/Cryptography";

@Component({
  components: {
    CommonHeader
  }
})
export default class AddGroup extends Vue {
  @Prop() public group!: Group; // 展示的信息
  @State public myInfo!: UserLoggedInfo;
  @State public socket!: MySocket | null;
  @State public groupList!: Group[]

  public imageViewer = imageViewer;
  public checkText: string = "";
  public JoinGroupAuthority = JoinGroupAuthority;
  public crypto = new Cryptography();

  public async joinGroup() {
    const group = this.group;
    if (group.joinPermission === JoinGroupAuthority.Direct) {
      Bus.$emit("directJoinGroup", group.id); // 收到入群socket后直接打开该群
    }
    const data = await this.$post(URLS.APPLY_JOIN_GROUP, {
      roomId: group.id,
      applyReason: this.checkText,
      sourceType: SourceType.Search, // pc只有搜索加入
      sourceId: ""
    });
    if (data) {
      const joinedGroup = this.groupList.find((item:Group) => item.id === group.id);
      let groupmenberKeyObj: Array<Object> = [];
      if(joinedGroup) {
        let list: GroupMember[] = joinedGroup.memberList.filter(
          (item: GroupMember) => {
            // 默认全部，除可能不是成员
            return !item.mayNotMember;
          }
        );
        list.forEach((item:GroupMember) => {
        if (item.id !== this.myInfo.id) {
          groupmenberKeyObj.push({ userId: item.id, key: item.publicKey });
        }
      });
      const publicKey = await this.crypto.getPublicKey();
      const secret = await this.getGroupSecretKeys(groupmenberKeyObj, publicKey); //arr[1]:群成员id和公钥的 对象列表
      const groupSessionObj = {
        eventType: EventType.ActiveChangeGroupKey,
        roomId: group.id,
        fromKey: publicKey,
        secret: secret
      };
      const socket = this.socket as MySocket;
      socket.sendGroupKey(groupSessionObj);
      }
      if (group.joinPermission === JoinGroupAuthority.NeedApproval) {
        this.$notify.success(SuccessMsg.JOIN_GROUP);
      }
      this.$emit("onClose");
    } else {
      // 请求失败则取消等待直接打开该群
      Bus.$emit("directJoinGroupCancel", group.id);
    }
  }

  public async getGroupSecretKeys(menberlist: any[], myPublicKey: string) {
    menberlist.unshift({ userId: this.myInfo.id, key: myPublicKey });
    console.log(menberlist);
    return await this.crypto.generateGroupSecretKeys(menberlist);
  }

  /**
   * 跳转到当前聊天
   */
  public emitClickSend() {
    this.$emit("onClose");
    Bus.$emit("onTrySendMsg", this.group);
  }
}
</script>

<style scoped>
@import "../../styles/var.css";
@import "./common.css";

.info-text_wrapper_dialog {
  margin-left: 10px;
  width: 264px;
}

.info-item {
  margin-bottom: 10px;
  line-height: 20px;
  color: var(--font-color-light);
}

.info-item-label {
  display: inline-block;
  width: 49px;
}

.btn_dialog {
  display: block;
  margin: 30px auto;
}

.theme-title {
  display: block;
  line-height: 17px;
  margin: 30px 0 0 0;
  font-size: var(--small-font-size);
  color: var(--font-color-light);
  font-weight: 500;
}

.counter {
  float: right;
  line-height: 17px;
  font-size: var(--small-font-size);
  color: var(--font-color-light);
  font-weight: 500;
}

.counter_check {
  margin-top: 30px;
}

.theme-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0 10px;
  border-radius: 4px;
  line-height: 20px;
  font-weight: 500;
  font-size: var(--normal-font-size);
  border: none;
  outline: none;
  background: var(--gray-background);
}

.check-input {
  margin-top: 10px;
  padding: 10px;
  height: 60px;
  resize: none;
}
</style>
