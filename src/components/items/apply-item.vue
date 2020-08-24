<!--
  @Author: yuanzeyu
  @Date: 2019/1/18
  @Desc: 新朋友页申请项
-->
<template>
  <div class="apply_item" @click="emitClick">
    <common-header class="avatar" :url="infoShowingAvatar"></common-header>
    <div v-if="apply.status===ApplyStatus.Waiting&&!applyByMe" class="status status_wait">
      <img src="../../assets/close_round.svg" alt="拒绝" @click="handleApply(false)" />
      <img src="../../assets/confirm_round.svg" alt="确认" @click="handleApply(true)" />
    </div>
    <div v-else class="status">{{applyStatusLabel}}</div>
    <h2 class="nickname" :title="infoShowing.name">{{infoShowing.name}}</h2>
    <div class="source">{{apply.source}}</div>
    <p v-if="apply.applyReason" class="reason">验证申请：{{apply.applyReason}}</p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import CommonHeader from "../common-header.vue";
import { ApplyItem, ApplyUserInfo } from "../../config/apiTypings";
import { UserLoggedInfo, MySocket, GroupMember } from "../../scripts/object";
import { State } from "vuex-class";
import {
  AgreeEnum,
  ApplyStatus,
  NewChannelType
} from "../../config/const-enums";
import { defaultImage } from "../../config/config-enum";
import URLS from "../../config/urls";
import Group from "@/object/targets/Group";
import Cryptography from "@/object/targets/Cryptography";
import {
  EventType, Encrypt,
} from '@/config/const-enums';

@Component({
  components: {
    CommonHeader
  }
})
export default class ApplyItemVue extends Vue {
  @Prop() public apply!: ApplyItem;
  @State public myInfo!: UserLoggedInfo;
  @State public groupList!: Group[];
  @State public socket!: MySocket | null;

  public ApplyStatus = ApplyStatus;
  public crypto = new Cryptography();

  public get infoShowing(): ApplyUserInfo {
    return this.applyByMe ? this.apply.receiveInfo : this.apply.senderInfo;
  }

  public get infoShowingIsGroup(): boolean {
    // 显示的是群
    return this.apply.type === NewChannelType.Group && this.applyByMe;
  }

  public get infoShowingAvatar() {
    return (
      this.infoShowing.avatar ||
      (this.infoShowingIsGroup ? defaultImage.Group : defaultImage.Friend)
    );
  }

  public get applyByMe() {
    return this.apply.senderInfo.id === this.myInfo.id;
  }

  public get applyStatusLabel(): string {
    switch (this.apply.status) {
      case ApplyStatus.Waiting:
        return "等待验证";
      case ApplyStatus.Pass:
        return "已添加";
      case ApplyStatus.Reject:
        return "已拒绝";
      default:
        return "异常";
    }
  }

  public emitClick(e: MouseEvent): void {
    this.$emit("click", {
      apply: this.apply,
      id: this.infoShowing.id,
      e,
      isGroup: this.infoShowingIsGroup
    });
  }

  public handleApply(pass: boolean): void {
    if (this.apply.type === NewChannelType.Group) {
      this.handleGroupApply(pass);
    } else {
      this.handleFriendApply(pass);
    }
  }

  /**
   * 同意或拒绝加群申请
   */
  public async handleGroupApply(pass: boolean) {
    const apply = this.apply;
    const data = await this.$post(URLS.REPLY_JOIN_GROUP, {
      userId: apply.senderInfo.id,
      roomId: apply.receiveInfo.id,
      agree: pass ? AgreeEnum.Pass : AgreeEnum.Reject
    });
    if (data) {
      apply.status = pass ? ApplyStatus.Pass : ApplyStatus.Reject;
      if (pass) {
        const group = this.groupList.find((item:Group) => item.id === apply.receiveInfo.id);
        if (group) {
          await group.getMembers();
          const senderData = await this.$post(URLS.GET_USER_INFO, {id: apply.senderInfo.id});
          let list: GroupMember[] = group.memberList.filter(
          (item: GroupMember) => {
            // 默认全部，除可能不是成员
            return !item.mayNotMember;
          }
        );
          let groupmenberKeyArr: Array<Object> = [];
          list.forEach(item => {
            if (item.id !== this.myInfo.id&&item.id !== apply.senderInfo.id) {
              groupmenberKeyArr.push({ userId: item.id, key: item.publicKey });
            }
          });
          groupmenberKeyArr.push({ userId: apply.senderInfo.id, key: senderData.publicKey});
          const publicKey = await this.crypto.getPublicKey();
          const secret = await this.getGroupSecretKeys(
            groupmenberKeyArr,
            publicKey
          ); //arr[1]:群成员id和公钥的 对象列表
          const groupSessionObj = {
            eventType: EventType.ActiveChangeGroupKey,
            roomId: group.id,
            fromKey: publicKey,
            secret: secret
          };
          const socket = this.socket as MySocket;
          socket.sendGroupKey(groupSessionObj);
        }
      }
    }
  }

  public async getGroupSecretKeys(menberlist: any[],myPublicKey:string) {
    menberlist.unshift({userId:this.myInfo.id,key:myPublicKey}); 
    console.log(menberlist);
    return await this.crypto.generateGroupSecretKeys(menberlist);
  }

  /**
   * 同意或拒绝加好友申请
   */
  public async handleFriendApply(pass: boolean) {
    const apply = this.apply;
    const data = await this.$post(URLS.ADD_FRIEND_REPLY, {
      id: apply.senderInfo.id,
      agree: pass ? AgreeEnum.Pass : AgreeEnum.Reject
    });
    if (data) {
      apply.status = pass ? ApplyStatus.Pass : ApplyStatus.Reject;
      if (pass) {
        // 有互加时,两条都设置为已同意,source统一
        this.$emit("onPassFriendApply");
      }
    }
  }
}
</script>

<style scoped>
@import "../../styles/var.css";

.apply_item {
  padding: 18px 20px;
  border: 1px solid rgb(241, 244, 246);
  border-radius: 4px;
}

.status {
  float: right;
  line-height: 44px;
  font-size: var(--small-font-size);
  color: var(--common-blue);
}

.status_wait {
  & > img {
    vertical-align: middle;
    margin-left: 10px;
    cursor: pointer;
  }
}

.avatar {
  margin-right: 10px;
  float: left;
  width: 44px;
  height: 44px;
}

.nickname {
  margin: 2px 0 0 0;
  font-size: var(--normal-font-size);
  font-weight: 400;
  line-height: 20px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.source {
  margin: 4px 0 0 54px;
  line-height: 17px;
  font-size: var(--small-font-size);
  color: var(--font-color-light);
}

.reason {
  margin: 10px 0 0 0;
  font-size: var(--small-font-size);
  line-height: 17px;
}
</style>
