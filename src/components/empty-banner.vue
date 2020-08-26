<!--
  @Author: yuanzeyu
  @Date: 2018/11/29
  @Desc:
-->
<template>
  <div class="empty_banner">
    <div class="g-drag_bar"></div>
    <main class="main_wrapper">
      <img
        class="main_wrapper-banner"
        :class="{'banner_small': type === 'unselected'}"
        :src="typeMap[type].img"
      />
      <p v-show="typeMap[type].label" class="main_wrapper-label">{{typeMap[type].label}}</p>
      <button
        v-show="typeMap[type].btn"
        class="main_wrapper-btn"
        @click="clickBtn"
      >{{typeMap[type].btn}}</button>
    </main>
    <top-pop ref="createPop">
      <friend-select
        :candidates="friends"
        @onConfirm="submitCreateGroup"
        @onCancel="closeCreateGroup"
      ></friend-select>
    </top-pop>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import Bus from "../scripts/bus";
import TopPop from "../components/top-pop.vue";
import FriendSelect from "../components/friend-select.vue";
import URLS from "../config/urls";
import { SuccessMsg } from "../config/config-enum";
import Friend from "@/object/targets/Friend";
import Cryptography from "@/object/targets/Cryptography";
import { Getter, State } from "vuex-class";
import { MySocket, UserLoggedInfo } from "@/scripts/object";

import platform from "@/config/platform";
import { EventType, Encrypt } from "@/config/const-enums";
@Component({
  components: {
    TopPop,
    FriendSelect
  }
})
export default class CommonInput extends Vue {
  @State public myInfo!: UserLoggedInfo;
  @State public socket!: MySocket | null;

  @Prop() public type!: string;
  @Prop() public friendList!: Friend[];
  public crypto = new Cryptography();

  public get friends(): Friend[] {
    // todo 提出通用组件
    return this.friendList.filter((item: Friend) => !item.isTemp);
  }

  public typeMap: any = {
    groupNewsEmpty: {
      img: require("../assets/group-newes-empty.svg"),
      label: "暂无群聊消息",
      btn: "创建群聊"
    },
    friendNewsEmpty: {
      img: require("../assets/friend-news-empty.svg"),
      label: "暂无好友消息",
      btn: "开启聊天"
    },
    friendEmpty: {
      img: require("../assets/friend-empty.svg"),
      label: "暂无好友"
    },
    groupEmpty: {
      img: require("../assets/group-empty.svg"),
      label: "暂无群聊",
      btn: "创建群聊"
    },
    unselected: {
      img: platform.LogoUnSelect
    },
    starFriendEmpty: {
      img: require("../assets/star-friend-empty.svg"),
      label: "暂无常用联系人",
      btn: "设置常用联系人"
    }
  };

  public clickBtn() {
    const btn = this.typeMap[this.type].btn;
    if (btn === "创建群聊") {
      (this.$refs.createPop as any).showPop();
    } else if (btn === "开启聊天") {
      Bus.$emit("onOpenChat");
    }
  }

  public async submitCreateGroup(selectedIds: any[]) {
    const data = await this.$post(URLS.CREATE_GROUP, {
      roomName: "",
      roomAvatar: "",
      users: selectedIds[0],
      encrypt: Encrypt.YES //默认加密
    });
    if (data) {
      const publicKey = await this.crypto.getPublicKey();
      const secret = await this.getGroupSecretKeys(selectedIds[1], publicKey); //arr[1]:群成员id和公钥的 对象列表
      const groupSessionObj = {
        eventType: EventType.ActiveChangeGroupKey,
        roomId: data.id,
        fromKey: publicKey,
        secret: secret
      };
      const socket = this.socket as MySocket;
      socket.sendGroupKey(groupSessionObj);
      this.$notify.success(SuccessMsg.CREATE_GROUP);
      this.closeCreateGroup();
    }
  }

  public async getGroupSecretKeys(menberlist: any[], myPublicKey: string) {
    menberlist.unshift({ userId: this.myInfo.id, key: myPublicKey });
    return await this.crypto.generateGroupSecretKeys(menberlist);
  }
  public closeCreateGroup() {
    if (this.$refs.createPop) {
      (this.$refs.createPop as any).hindPop();
    }
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.empty_banner {
  height: 100%;
  position: relative;
}

.main_wrapper {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  text-align: center;
  font-size: 0;
}

.main_wrapper-banner {
  width: 200px;
}

.banner_small {
  width: initial;
  height: 110px;
}

.main_wrapper-label {
  margin: 20px 0 30px 0;
  font-size: var(--small-font-size);
  color: var(--font-color-light);
}

.main_wrapper-btn {
  width: 120px;
  height: 30px;
  border: 1px solid var(--button-background);
  color: var(--button-background);
  border-radius: 15px;
  font-size: var(--small-font-size);
  font-weight: bold;
  min-width: 120px;
  outline: none;
  cursor: pointer;
  background: #fff; /* 避免windows颜色错误 */
}
</style>
