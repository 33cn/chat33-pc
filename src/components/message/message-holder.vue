<!--
  @Author: yuanzeyu
  @Date: 2018/12/29
  @Desc: 消息通用的头像昵称等布局
-->
<template>
  <div class="message_holder" :class="{'message_holder_mine': isMine}">

    <div v-if="chatTarget&&message&&chatTarget.selectorShow&&!message.isSnap" class="selector-wrapper">
      <select-button v-if="chatTarget.selectorShow"
                     :active="chatTarget.selectedItems.includes(message)"
                     @click.native="chatTarget.switchSelect(message)">
      </select-button>
    </div>
    <common-header class="header"
                   :class="{'header-select':chatTarget&&!chatTarget.selectorShow}"
                   :url="header"
                   @click.native="handleClickAvatar"
                   @contextmenu.native.prevent="addNameToTextField()"
                   >
    </common-header>
    <h2 class="nickname">{{nameLabel}}</h2>
    <div class="content" :class="{'content_focused':focused}" @contextmenu.prevent="showRightSelect">
      <div v-if="message&&message.sendStatus!==MessageStatus.Success" class="status">
        <img v-if="message.sendStatus===MessageStatus.Sending" class="status-loading" src="../../assets/loading.svg">
        <i v-else class="iconfont icon-fasongshibai1 status-fail"></i>
      </div>
      <slot></slot>
    </div>
    <template v-if="message">
      <div v-if="showRelay"
           class="relay_tip_wrapper">
        <div v-if="message.isRelayFromGroup" class="relay_tip">
          转发：群聊[{{message.singleRelayFromName}}]的聊天
        </div>
        <div v-else class="relay_tip">转发：我和[{{message.singleRelayFromName}}]的聊天</div>
      </div>
      <!-- 头像弹窗 -->
      <right-dialog v-if="rightDialogShowing" :show.sync="rightDialogShowing" :mouseEvent="rightDialogEvent"
                    width="440px">
        <friend-dialog :user="clickDialogTarget"
                       :chatTarget="chatTarget"
                       @onClickBtn="rightDialogShowing=false">
        </friend-dialog>
      </right-dialog>
    </template>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import CommonHeader from '@/components/common-header.vue';
  import RightDialog from '@/components/right-dialog.vue';
  import FriendDialog from '@/views/infoViewers/friend-dialog.vue';
  import {getImgHeight} from '@/scripts/common';
  import {defaultImage, MessageStatus} from '@/config/config-enum';
  import {GroupMember, UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {State, namespace} from 'vuex-class';
  import URLS from '@/config/urls';
  import Bus from '@/scripts/bus';
  import {ShowMessageSelectEventParam} from '@/config/type';
  import SelectButton from '@/components/select-button.vue';
  import {MessageType} from '@/object/messages';
  import RelayTextMsg from '@/object/messages/singleRelay/RelayTextMsg';
  import RelayImageMsg from '@/object/messages/singleRelay/RelayImageMsg';
  import RelayVideoMsg from '@/object/messages/singleRelay/RelayVideoMsg';
  import RelayFileMsg from '@/object/messages/singleRelay/RelayFileMsg';

  const addressSign = namespace("addressSign");

  @Component({
    components: {
      CommonHeader,
      RightDialog,
      FriendDialog,
      SelectButton
    }
  })
  /**
   * todo 支持转发弹窗
   */
  export default class MessageHolder extends Vue {
    // 自定义
    @Prop() public avatar!: string;
    @Prop() public name!: string;
    // 或Message对象
    @Prop() public message!: MessageType;
    @Prop({default: false}) public isMine!: boolean; // todo 改为内部判断
    @Prop({default: false}) public headerDisable!: boolean;

    @State public chatTarget!: Group | Friend; // todo 可能为空?
    @State public myInfo!: UserLoggedInfo;
    @State public friendList!: Friend[];

    @addressSign.Mutation("setAitInfoList") setAitInfoList!: (
    payload:any
  ) => void;
  //   @addressSign.Mutation("setAddressPersonId") setAddressPersonId!: (
  //   addressPersonId: string
  // ) => void;
    
    public rightDialogShowing: boolean = false;
    public rightDialogEvent: MouseEvent | null = null; // 点击右键弹窗的鼠标事件
    public clickDialogTarget: Friend | UserLoggedInfo | null = null;
    public focused: boolean = false; // 右键选中

    public getImgHeight = getImgHeight;
    public MessageStatus = MessageStatus;

    public get showRelay() {
      const msg = this.message;
      if (!msg) {
        return false;
      }
      const isRelay = (msg instanceof RelayTextMsg) || (msg instanceof RelayImageMsg)
        || (msg instanceof RelayVideoMsg) || (msg instanceof RelayFileMsg);
      return this.message.isSendByMe && isRelay;
    }

    public get header() {
      let url = '';
      if (this.avatar) {
        url = this.avatar;
      } else if (this.message) {
        url = this.message.sender ? this.message.sender.avatar:''
      }
      return url || defaultImage.Friend;
    }

    /**
     * 昵称标签
     */
    public get nameLabel() { // todo 优化Message sender
      // 优先自定义昵称
      if (this.name) {
        return this.name;
      }
      const target = this.chatTarget;
      const sender = this.message.sender;
      const senderId = sender.id;
      const sendByMe = senderId === this.myInfo.id;
      // 好友聊天优先好友昵称
      if (target instanceof Friend) {
        return sendByMe ? this.myInfo.name : (target.remark || sender.name);
      }
      // 自己优先显示群昵称
      if (sendByMe) {
        const myMember = target.memberList.find((item) => item.id === this.myInfo.id);
        if (myMember) {
          return myMember.nameInGroup || this.myInfo.name;
        }
      }
      // 群内好友优先好友备注
      const friendExist = this.friendList.find((item) => item.id === senderId);
      if (friendExist && friendExist.remark) { // 避免sender未指向好友
        return friendExist.remark;
      }
      // 普通成员优先群昵称
      return (sender as GroupMember).nameInGroup || sender.name;
    }

    /**
     * 点击头像获取对应friend,显示信息弹窗
     */
    public handleClickAvatar(e: MouseEvent) {
      if (this.message && !this.headerDisable) {
              console.log(this.headerDisable);

        const sender = this.message.sender;
        let result = null;
        const isFriendChat = this.chatTarget instanceof Friend;
        const isMyAvatar = sender.id === this.myInfo.id;
        if (isFriendChat) {
          result = sender as Friend | UserLoggedInfo;
        } else if (isMyAvatar) {
          result = this.myInfo;
        } else { // 群聊中别人的头像
          const member = sender as GroupMember; // todo 优化发送者
          const friendExist = this.friendList.find((item) => item.id === member.id);
          if (friendExist) {
            result = friendExist;
          } else {
            result = new Friend({id:member.id, name:member.name, avatar:member.avatar});
            result.isTemp = true;
          }
          if (!result.uid) { // 非好友时未保存uid
            this.setUserUID(result);
          }
        }
        this.showSenderInfoPop(result, e);
      }
    }

    /**
     * 添加被@姓名到会话框
     */
     public addNameToTextField(e: MouseEvent){
       if(this.isMine) return;
      //  aitInfo.name = '↵'+'@'+this.nameLabel;
       this.setAitInfoList({aitInfo:this.message.sender});
     }
     
    /**
     * 显示右键菜单
     */
    public showRightSelect(e: MouseEvent) { // todo 优化
      if (this.message) {
        const param: ShowMessageSelectEventParam = {
          message: this.message,
          event: e,
          isRelayDialog: this.headerDisable
        };
        Bus.$emit('showMessageSelect', param);
      }
    }

    /**
     * 掉接口获取uid
     * @desc todo 优化uid获取
     */
    private async setUserUID(target: Friend): Promise<void> {
      const data = await this.$post(URLS.GET_USER_INFO, {id: target.id});
      target.uid = data.uid;
    }

    /**
     * 显示信息弹窗
     */
    private showSenderInfoPop(info: Friend | UserLoggedInfo, e: any) {
      this.rightDialogEvent = e;
      this.clickDialogTarget = info;
      this.rightDialogShowing = true;
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .message_holder {
    width: 100%;
  }

  .selector-wrapper {
    float: left;
    width: 20px;
    height: 20px;
    margin: 5px 10px 0 20px;
  }

  .header {
    float: left;
    margin-right: 10px;
    margin-left: 0;
    width: 30px;
    height: 30px;
  }

  .header-select {
    margin-left: 20px;
  }

  .nickname {
    margin: 0;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 17px
  }

  .message_holder_mine {
    & > .header {
      float: right;
      margin-right: 20px;
      margin-left: 10px;
    }

    & > .nickname {
      text-align: right;
    }

    & > .content {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  }
  /**不是自己的消息内容 */
  .content {
    display: flex;
    align-items: center;
    margin-top: 4px;

    /* & > * {
      display: inline-block;
      vertical-align: middle;
    } */
  }

  .relay_tip_wrapper::after, .relay_tip_wrapper::before {
    content: '';
    display: block;
    clear: both;
  }

  .relay_tip {
    margin: 4px 40px 0 0;
    float: right;
    max-width: 296px;
    font-size: var(--small-font-size);
    line-height: 17px;
    color: var(--font-color-light);
  }

  .status {
    /*position: absolute;*/
    /*top: 50%;*/
    /*left: -30px;*/
    margin-right: 10px;
    /*margin-top: -10px;*/
    color: var(--font-color-red);
  }

  .status-loading {
    display: block;
    animation: rotating 2s linear infinite;
  }

  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(1turn);
    }
  }

  .status-fail {
    font-size: 20px;
  }
</style>
