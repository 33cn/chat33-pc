<!--
  @Author: yuanzeyu
  @Date: 2018/12/29
  @Desc: 普通文字消息
-->
<template>
  <div class="friend_select">
    <div class="left">
      <common-input class="left-input" v-model="searchQuery"></common-input>
      <tab-bar v-model="currentTab" :labels="[Tab.latest, Tab.friend, Tab.group]"></tab-bar>

      <div v-show="currentTab===Tab.latest" class="left-list">
        <vue-scroll>
          <div
            class="g-menu-list-item g-menu-list-item_dialog"
            v-for="item in latestList"
            :key="item.id"
          >
            <div
              class="t-check_box"
              :class="{'t-check_box_active': selectedList.includes(item)}"
              @click="switchSelected(item)"
            >
              <i class="iconfont icon-xuanrengou1"></i>
            </div>
            <!--<img class="g-menu-list-item-header" :src="item.avatar" alt="头像">-->
            <common-header class="g-menu-list-item-header" :url="item.avatar"></common-header>
            <div class="menu-list-item-label">{{item.remark || item.name}}</div>
          </div>
        </vue-scroll>
      </div>

      <div v-show="currentTab===Tab.friend" class="left-list">
        <vue-scroll>
          <div v-for="sortItem in sortedFriendList">
            <a class="left-member_letter" :name="sortItem.letter">{{sortItem.letter}}</a>
            <div
              class="g-menu-list-item g-menu-list-item_dialog g-menu-list-item_dialog_left"
              v-for="item in sortItem.list"
              :key="item.id"
            >
              <div
                class="t-check_box"
                :class="{'t-check_box_active': selectedList.includes(item)}"
                @click="switchSelected(item)"
              >
                <i class="iconfont icon-xuanrengou1"></i>
              </div>
              <common-header class="g-menu-list-item-header" :url="item.avatar"></common-header>
              <div class="menu-list-item-label">{{item.remark || item.name}}</div>
            </div>
          </div>
        </vue-scroll>
      </div>
      <letter-selector v-show="currentTab===Tab.friend" :letters="friendLetters"></letter-selector>

      <div v-show="currentTab===Tab.group" class="left-list">
        <vue-scroll>
          <div v-for="sortItem in sortedGroupList">
            <a class="left-member_letter" :name="sortItem.letter">{{sortItem.letter}}</a>
            <div
              class="g-menu-list-item g-menu-list-item_dialog g-menu-list-item_dialog_left"
              v-for="item in sortItem.list"
              :key="item.id"
            >
              <div
                class="t-check_box"
                :class="{'t-check_box_active': selectedList.includes(item)}"
                @click="switchSelected(item)"
              >
                <i class="iconfont icon-xuanrengou1"></i>
              </div>
              <common-header class="g-menu-list-item-header" :url="item.avatar"></common-header>
              <div class="menu-list-item-label">{{item.name}}</div>
            </div>
          </div>
        </vue-scroll>
      </div>
      <letter-selector v-show="currentTab===Tab.group" :letters="groupLetters"></letter-selector>
    </div>
    <div class="right">
      <div class="right-label">
        <span>已选联系人</span>
        <span class="right-label-count">{{selectedList.length}}</span>
      </div>
      <div class="right-list">
        <vue-scroll>
          <div
            class="g-menu-list-item g-menu-list-item_dialog"
            v-for="item in selectedList"
            :key="item.id"
          >
            <div class="t-check_box t-check_box_cancel" @click="switchSelected(item)">
              <i class="iconfont icon-xuanrenchacha"></i>
            </div>
            <common-header class="g-menu-list-item-header" :url="item.avatar"></common-header>
            <div class="menu-list-item-label">{{item.remark || item.name}}</div>
          </div>
        </vue-scroll>
      </div>
      <button class="g-btn_default right-btn_cancel" @click="$emit('onClose')">取消</button>
      <button
        class="g-btn_active"
        :class="{'g-btn_active_disable':selectedList.length<1}"
        :disabled="selectedList.length<1"
        @click="emitConfirm"
      >确定</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Getter, State } from "vuex-class";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import { groupByFirstLetter } from "@/scripts/common";
import URLS from "@/config/urls";
import { RelayMsgParam, RelayMsg, RelayMsgItem } from "@/config/apiTypings";
import {
  NewChannelType,
  RelayType,
  MsgType,
  ChannelType
} from "@/config/const-enums";
import { checkInclude } from "@/utils/tool";
import CommonInput from "@/components/common-input.vue";
import LetterSelector from "@/components/letter-selector.vue";
import TabBar from "@/components/tab-bar.vue";
import CommonHeader from "@/components/common-header.vue";
import { MySocket } from "@/scripts/object";
import {
  generateSessionKey,
  encryptSymmetric,
  dencryptSymmetric,
  local2ApiMsg,
  formatDateString
} from "@/utils/tool";
import Cryptography from "@/object/targets/Cryptography";
import MultiRelayMsg from "../object/messages/MultiRelayMsg";
import ImageMsg from "@/object/messages/ImageMsg";
import TextMsg from "@/object/messages/TextMsg";
import VideoMsg from "@/object/messages/VideoMsg";
import FileMsg from "@/object/messages/FileMsg";
import { GroupMember, UserLoggedInfo } from "@/scripts/object";
import notify from "@/plugins/NotifyPop";
import { ErrorMsg } from "@/config/config-enum";
import RelayTextMsg from "@/object/messages/singleRelay/RelayTextMsg";
import RelayVideoMsg from "../object/messages/singleRelay/RelayVideoMsg";
import RelayFileMsg from "../object/messages/singleRelay/RelayFileMsg";
import RelayImageMsg from "../object/messages/singleRelay/RelayImageMsg";

enum Tab {
  latest = "最近聊天",
  friend = "好友",
  group = "群聊"
}

@Component({
  components: {
    CommonInput,
    LetterSelector,
    TabBar,
    CommonHeader
  }
})
export default class RelaySelect extends Vue {
  @Prop({ default: null }) public target!: Friend | Group;
  @Prop() public isMultiRelay!: boolean;
  @Prop() public selectMessageIds!: string[];
  @Prop({ default: false }) public isManuelRelay!: boolean; // 是返回上层处理转发
  @Getter public groupListNoTemp!: Group[];
  @Getter public friendListNoTemp!: Friend[];
  @State socket!: MySocket;
  @State public myInfo!: UserLoggedInfo;

  public buttonDisabled: boolean = false;
  public currentTab: string = Tab.latest;
  public selectedList: Array<Friend | Group> = [];
  public searchQuery: string = "";
  public Tab = Tab;
  public crypto: Cryptography = new Cryptography();

  public get searchedFriends() {
    return this.friendListNoTemp.filter(item => {
      const query = this.searchQuery;
      return checkInclude(item.remark, query) || checkInclude(item.name, query);
    });
  }

  public get searchedGroups() {
    return this.groupListNoTemp.filter(item =>
      checkInclude(item.name, this.searchQuery)
    );
  }

  /**
   * 最近聊天列表：有聊天记录、最新消息在上、无临时会话
   */
  public get latestList(): Array<Friend | Group> {
    let all: Array<Friend | Group> = [];
    all = all.concat(this.searchedFriends, this.searchedGroups);
    const targetWithLog = all.filter(item => item.msgHistory.length > 0);
    return targetWithLog.sort((a, b) => {
      const aLatestTime = a.msgHistory[a.msgHistory.length - 1].sendTime;
      const bLatestTime = b.msgHistory[b.msgHistory.length - 1].sendTime;
      return bLatestTime - aLatestTime;
    });
  }

  /**
   * 好友列表首字母排序
   */
  public get sortedFriendList() {
    return groupByFirstLetter(
      this.searchedFriends,
      (item: Friend) => item.remark || item.name
    );
  }

  public get friendLetters() {
    return this.sortedFriendList.map((item: any) => item.letter);
  }

  /**
   * 群列表首字母排序
   */
  public get sortedGroupList() {
    return groupByFirstLetter(this.searchedGroups, (item: Group) => item.name);
  }

  public get groupLetters() {
    return this.sortedGroupList.map((item: any) => item.letter);
  }

  public switchSelected(item: Friend | Group) {
    const index = this.selectedList.indexOf(item);
    if (index > -1) {
      this.selectedList.splice(index, 1);
    } else {
      this.selectedList.push(item);
    }
  }

  public async emitConfirm() {
    if(this.buttonDisabled) return
    this.buttonDisabled = true

    if (this.isManuelRelay) {
      this.$emit("onSelected", {
        selectedGroupIds: this.selectedList
          .filter(item => item instanceof Group)
          .map(item => item.id),
        selectedFriendIds: this.selectedList
          .filter(item => item instanceof Friend)
          .map(item => item.id)
      });
      this.$emit("onClose");
      return;
    }
    const encryptArr = this.selectedList;

    if (this.isMultiRelay) {
      let relayMsgArr: Array<RelayMsgItem> = [];
      for (const msgItem of this.target.selectedItems) {
        let msg: any = null;
        switch (msgItem.msgType) {
          case undefined: {
            break;
          }
          case MsgType.Text: {
            msg = {
              content:(msgItem as TextMsg).content
              }
            break;
          }
          case MsgType.Picture: {
            msg = {
              imageUrl: (msgItem as ImageMsg).url,
              height: (msgItem as ImageMsg).height,
              width: (msgItem as ImageMsg).width
            }
            break;
          }
          case MsgType.Video: {
            msg = {
              mediaUrl: (msgItem as VideoMsg).url,
              width: (msgItem as VideoMsg).width,
              height: (msgItem as VideoMsg).height,
              time: (msgItem as VideoMsg).duration
            }
            break;
          }
          case MsgType.File: {
            msg = {
              fileUrl:(msgItem as FileMsg).url,
              name: (msgItem as FileMsg).fileName,
              size: (msgItem as FileMsg).size,
              md5: (msgItem as FileMsg).md5
            }
            break;
          }
          default: {
            msg = {};
          }
        }
        let relayMsgItem:RelayMsgItem = {
          msgType: msgItem.msgType || 1,
          datetime: msgItem.sendTime,
          logId: msgItem.id,
          msg: msg,
          senderInfo: msgItem.senderInfo || {nickname:'',avatar:''}
        }
        relayMsgArr.push(relayMsgItem);
      }
      const multiRelayMsg: RelayMsg = {
        channelType:
          this.target instanceof Group ? ChannelType.Group : ChannelType.Friend,
        forwardType: RelayType.Multi,
        fromId: this.target.id,
        fromName: this.target.name,
        forwardUserName: this.myInfo.name,
        data: relayMsgArr
      };

      const roomLogs = await Promise.all(
        encryptArr
          .filter(item => item instanceof Group)
          .map(async group => {
            const resultMsg = (group as Group).encrypt === 1 ? await this.encryptGroupMessage(
              JSON.stringify(multiRelayMsg),
              group as Group
            ) : multiRelayMsg;
            return {
              messages: [
                {
                  msg: resultMsg,
                  msgType: MsgType.RelayMsg
                }
              ],
              targetId: group.id
            };
          })
      );

      const userLogs = await Promise.all(
        encryptArr
          .filter(item => item instanceof Friend)
          .map(async friend => {
            const encryptedMsg = await this.encryptFriendMessage(
              JSON.stringify(multiRelayMsg),
              friend as Friend
            );
            return {
              messages: [
                {
                  msg: encryptedMsg,
                  msgType: MsgType.RelayMsg
                }
              ],
              targetId: friend.id
            };
          })
      );

      const data = await this.$post(URLS.RELAY_ENC_MSG, {
        roomLogs,
        type: RelayType.Multi,
        userLogs
      });
      if (data) {
       this.buttonDisabled = false
        this.$emit("onClose");
      }else{
       this.buttonDisabled = false
      }
    } else {
      const relayMsgconfig = {
        forwardType: RelayType.Single,
        fromId: this.target.id,
        fromName: this.target.name,
        channelType:
          this.target instanceof Group ? ChannelType.Group : ChannelType.Friend
      };
      const messageArr: Array<any> = [];
      for (const msgItem of this.target.selectedItems) {                       
        let message: any = null;
        switch (msgItem.msgType) {
          case MsgType.Text:
            message = {
              msg: Object.assign({}, relayMsgconfig, {
                  content: (msgItem as TextMsg).content
                }),
              msgType: msgItem.msgType
            };
            break;
          case MsgType.Picture:
            message = {
              msg: Object.assign({}, relayMsgconfig, {
                  imageUrl: (msgItem as ImageMsg).url,
                  height: (msgItem as ImageMsg).height,
                  width: (msgItem as ImageMsg).width
                }),
              msgType: msgItem.msgType
            };
            break;
          case MsgType.Video:
            message = {
              msg: Object.assign({}, relayMsgconfig, {
                  mediaUrl: (msgItem as VideoMsg).url,
                  width: (msgItem as VideoMsg).width,
                  height: (msgItem as VideoMsg).height,
                  time: (msgItem as VideoMsg).duration
                }),
              msgType: msgItem.msgType
            };
            break;
          case MsgType.File:
            message = {
              msg: Object.assign({}, relayMsgconfig, {
                  fileUrl: (msgItem as FileMsg).url,
                  name: (msgItem as FileMsg).fileName,
                  size: (msgItem as FileMsg).size,
                  md5: (msgItem as FileMsg).md5
                }),
              msgType: msgItem.msgType
            };
            break;
           case MsgType.Packet:
             message = {
               msg: Object.assign({}, relayMsgconfig, {
                  content: msgItem.getListLabel(msgItem instanceof Group)
                }),
              msgType: MsgType.Text
             };
             break;
           default: {
             message = {
              msg: Object.assign({},relayMsgconfig),
              msgType: msgItem.msgType
             }
          } 
        }
        messageArr.push(message);
      }
      const roomLogs = await Promise.all(
        encryptArr
          .filter(item => item instanceof Group)
          .map(async group => {
            
            const emcmessageArr = await Promise.all(
              messageArr.map(async message => {
                const msg = (group as Group).encrypt === 1 ?  await this.encryptGroupMessage(
                  JSON.stringify(message.msg),
                  group as Group
                ): message.msg;
                return {
                  msg,
                  msgType: message.msgType
                };
              })
            );
            return {
              messages: emcmessageArr,
              targetId: group.id
            };
          })
      );

      const userLogs = await Promise.all(
        encryptArr
          .filter(item => item instanceof Friend)
          .map(async friend => {
            const emcmessageArr = await Promise.all(
              messageArr.map(async message => {
                const msg = await this.encryptFriendMessage(
                  JSON.stringify(message.msg),
                  friend as Friend
                );
                return {
                  msg,
                  msgType: message.msgType
                }
              })
            );
            return {
              messages: emcmessageArr,
              targetId: friend.id
            };
          })
      );

      const data = await this.$post(URLS.RELAY_ENC_MSG, {
        roomLogs,
        type: RelayType.Single,
        userLogs
      });
      if (data) {
        this.buttonDisabled = false
        this.$emit("onClose");
      } else {
        this.buttonDisabled = false
      }
    }
  }

  /**
   * 个人加密
   */
  public async encryptFriendMessage(
    msg: string,
    target: Friend
  ): Promise<object> {
    let encryptedMsgObj: object = {};
    const privateKey = await this.crypto.getPrivateKey();
    const publicKey = await this.crypto.getPublicKey();
    const sessionKey = generateSessionKey(privateKey, target.publicKey);
    const encryptedmsg = encryptSymmetric(sessionKey, msg);
    encryptedMsgObj = {
      encryptedMsg: encryptedmsg,
      fromKey: publicKey,
      toKey: target.publicKey
    };
    return encryptedMsgObj;
  }

  /**
   * 群聊加密
   */
  public async encryptGroupMessage(msg: string, target: Group) {
    let encryptedMsgObj: object = {};
    const groupKeyObj = await this.crypto.getLatestGroupKey(target.id);
    if (groupKeyObj) {
      const encryptedmsg = encryptSymmetric(groupKeyObj.key, msg);
      encryptedMsgObj = { encryptedMsg: encryptedmsg, kid: String(groupKeyObj.kid) };
      return encryptedMsgObj;
    } else {
      notify.fail({
        text: ErrorMsg.LOST_GROUPKEY,
        isUnique: true
      });
    }
  }

  //todo不加密群转发接口暂时禁用
  public async filterEncrypt() {
    const unencryptArr = this.selectedList.filter(
      item => item instanceof Group && item.encrypt === 2
    );
    if (unencryptArr.length > 0)
      await this.sendUnencryptedGroup(unencryptArr as Group[]);

    const encryptArr = this.selectedList.filter(
      item => !(item instanceof Group && item.encrypt === 2)
    );
    return encryptArr;
  }

  public async sendUnencryptedGroup(groupList: Group[]) {
    const param: RelayMsgParam = {
      sourceId: this.target.id,
      type: NewChannelType.Group,
      forwardType: this.isMultiRelay ? RelayType.Multi : RelayType.Single,
      logArray: this.selectMessageIds.sort(),
      targetRooms: groupList.map(item => item.id),
      targetUsers: []
    };
    const data = await this.$post(URLS.RELAY_MSG, param);
    if (data) {
      const count = data.failsNumber;
      if (count > 0) {
        this.$toast(
          `转发的好友/群聊中包含${count}个禁言的群或被解除关系的好友，无法收到转发的消息`
        );
      }
      this.$emit("onClose");
    }
  }
}
</script>

<style scoped>
/* todo 更新样式和muted-set同步 */
@import "../styles/var.css";

.friend_select {
  position: fixed;
  top: var(--pop-top);
  left: 50%;
  margin-left: -320px;
  width: 640px;
  height: 500px;
  background: #fff;
  border-radius: var(--border-radius-dialog);
}

.left,
.right {
  vertical-align: top;
  display: inline-block;
  width: 50%;
  height: 100%;
}

.left {
  position: relative;
}

.left-list {
  height: calc(500px - 60px - 30px - 10px - 28px);
  overflow: auto;
}

.left-input {
  margin: 18px 0 18px 20px;
  width: 280px;
}

.left-member_letter {
  line-height: 20px;
  padding-left: 20px;
  color: var(--font-color-light);
  font-size: var(--small-font-size);
}

.right-label {
  margin: 18px 0 24px 24px;
  line-height: 18px;
  font-size: 13px;
  color: var(--font-color-light);
}

.right-label-count {
  margin-left: 10px;
}

.right-list {
  margin-bottom: 8px;
  height: calc(500px - 60px - 66px);
  overflow: auto;
}

.t-check_box {
  float: right;
  margin-top: 5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #8a97a5;
  cursor: pointer;
  text-align: center;
  line-height: 15px;

  & > i {
    font-size: 10px;
    color: #fff;
    display: none;
  }
}

.t-check_box_active {
  background: var(--icon-active-color);
  border: 1px solid var(--icon-active-color);

  & > i {
    display: initial;
  }
}

.t-check_box_cancel {
  background: var(--font-color-light);

  & > i {
    display: initial;
  }
}

.right-btn_cancel {
  margin-left: 100px;
  margin-right: 20px;
}

.menu-list-item-label {
  /* 避免使用span挡住右侧float */
  display: inline-block;
  width: 200px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  vertical-align: middle;
  line-height: 20px;
}
</style>

