<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc: 群/好友聊天列表窗口 不要组件化
-->
<template>
  <div id="main_chat" class="main_chat">
    <!-- 标题栏 -->
    <chat-header @clickInfo="showInfo=true" @clickFile="showFile=true"></chat-header>
    <!-- 消息列表相关 -->
    <message-list class="main" @showlikeHis="likeHisPageShowing=true"></message-list>
    <!-- 底部输入框/多选操作栏/发送图片 -->
    <chat-footer
      v-show="!chatTarget.isTemp"
      :target="chatTarget"
      @onRelay="clickRelay"
      @onDelete="deleteSelectMsg"
      @onCancel="cancelMultiSelect"
    ></chat-footer>
    <!-- 右栏 -->
    <focus-dialog :show.sync="showInfo" :showMask="false">
      <transition appear name="slide">
        <div class="right_pop" :style="isWin?'top:80px':''">
          <group-info v-if="isGroup" :group="chatTarget" :friendList="friendList"></group-info>
          <friend-info v-else :friend="chatTarget" @close="showInfo=false"></friend-info>
        </div>
      </transition>
    </focus-dialog>

    <focus-dialog :show.sync="showFile" :showMask="false">
      <transition appear name="file">
        <div class="right_pop" :style="isWin?'top:80px':''">
          <chat-file></chat-file>
        </div>
      </transition>
    </focus-dialog>

    <focus-dialog :show.sync="showLikeDetail" :showMask="false">
      <transition appear name="like">
        <div class="right_pop" :style="isWin?'top:80px':''">
          <like-page @addLike="addLike"></like-page>
        </div>
      </transition>
    </focus-dialog>

    <focus-dialog :show.sync="likeHisPageShowing" :showMask="false">
      <transition appear name="likehis">
        <div class="right_pop" :style="isWin?'top:80px':''">
          <like-his></like-his>
        </div>
      </transition>
    </focus-dialog>

    <focus-dialog :show.sync="groupFriendPageShowing" :showMask="false">
      <transition appear name="friendPage">
        <div class="right_pop" :style="isWin?'top:80px':''">
          <group-member-page :group="chatTarget"></group-member-page>
        </div>
      </transition>
    </focus-dialog>

    <common-dialog :showing.sync="selectMutedTimeShowing" title="选择禁言时间">
      <time-selector v-model="selectedMutedTime" class="mute_dialog-selector"></time-selector>
      <div class="mute_dialog-btn_wrapper">
        <button class="g-btn_default" @click="selectMutedTimeShowing = false">取消</button>
        <button class="g-btn_active" @click="submitMutedMember">确定</button>
      </div>
    </common-dialog>

    <!-- 转发目标选择弹窗 -->
    <focus-dialog class="relay_selector" :show.sync="relaySelectorShowing">
      <relay-selector
        :target="chatTarget"
        :isMultiRelay="isMultiRelay"
        :selectMessageIds="selectedMsgIdArr"
        @onClose="closeRelaySelector"
      ></relay-selector>
    </focus-dialog>
  </div>
</template>

<script lang="ts">
import { Prop, Component, Vue, Watch } from "vue-property-decorator";
import { State, Mutation, namespace, Action } from "vuex-class";
import Bus from "@/scripts/bus";
import { GroupMember, UserLoggedInfo } from "@/scripts/object";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import { FOREVER_TIME } from "@/config/const-enums";
import URLS from "@/config/urls";
import { ShowMessageSelectEventParam } from "@/config/type";
import showMessageSelect from "@/utils/app/showMessageSelect";
import TimeSelector from "@/components/time-selector.vue";
import CommonDialog from "@/components/common-dialog.vue";
import RightDialog from "@/components/right-dialog.vue";
import FocusDialog from "@/components/focus-dialog.vue";
import RelaySelector from "@/views/relay-selector.vue";
import ChatFooter from "@/views/chat-footer.vue";
import MessageList from "@/views/message-list.vue";
import GroupInfo from "@/views/group-info.vue";
import FriendInfo from "@/views/friend-info.vue";
import ChatFile from "@/views/chat-file.vue";
import ChatHeader from "./chat-header.vue";
import LikePage from "@/views/like-page.vue";
import LikeHis from "@/views/likeHis-page.vue";
import ImageMsg from "@/object/messages/ImageMsg";
import GroupMemberPage from "@/views/group-member-page.vue";

const likeReward = namespace("likeReward");
const addressSign = namespace("addressSign");

@Component({
  components: {
    GroupInfo,
    FriendInfo,
    TimeSelector,
    CommonDialog,
    RightDialog,
    FocusDialog,
    RelaySelector,
    ChatFooter,
    MessageList,
    ChatHeader,
    ChatFile,
    LikePage,
    LikeHis,
    GroupMemberPage
  }
})
export default class MainChat extends Vue {
  @State public isWin!: boolean;
  @State public myInfo!: UserLoggedInfo;
  @State public groupList!: Group[];
  @State public friendList!: Friend[];
  @State public chatTarget!: Group | Friend;
  @likeReward.State("showLikeView") showLikeView!: boolean;
  @likeReward.State("showLikeHis") showLikeHis!: boolean;
  @likeReward.Mutation("setShowing") setShowing!: (
    paran: any
  ) => void;
  @likeReward.Mutation("setShowLikeHis") setShowLikeHis!: (
    showLikeHis: boolean
  ) => void;
  @likeReward.Mutation("setPara") setPara!: (
    param:any
  ) => void;
  @addressSign.State("showFriendList") showFriendList!: boolean;
  @addressSign.Mutation("setPageShowing") setFriendPageShowing!: (payload: any) => void;

  @Action public clickLike!: (param: any) => Promise<void>;

  public showInfo: boolean = false;
  public showFile: boolean = false;
  public selectMutedTimeShowing: boolean = false; // 单个禁言选择时间弹窗
  public relaySelectorShowing: boolean = false; // 转发目标选择弹窗显示
  public isMultiRelay: boolean = false; // 点击的是合并转发

  public selectedMutedTime: number = FOREVER_TIME; // 选中的禁言时间
  public selectMutedMember: GroupMember | null = null; // 右键禁言的成员id

  public get selectedMsgIdArr(): string[] {
    return this.chatTarget.selectedItems.map(item => item.id);
  }

  public get showLikeDetail(): boolean {
    return this.showLikeView;
  }

  public set showLikeDetail(param) {
    console.log(param);
    this.setShowing({showLikeView:param});
  }

  public get likeHisPageShowing(): boolean {
    return this.showLikeHis;
  }

  public set likeHisPageShowing(param) {
    this.setShowLikeHis(param);
  }

  public get groupFriendPageShowing(): boolean {
    console.log(this.showFriendList);
    return this.showFriendList;
  }

  public set groupFriendPageShowing(param) {
    this.setFriendPageShowing({showFriendList:param});
  }
  /**
   * 当前是群会话
   */
  public get isGroup(): boolean {
    return this.chatTarget instanceof Group;
  }

  @Watch("chatTarget.id")
  public watchTargetId() {
    this.cancelMultiSelect(); // 切换则取消多选状态
  }

  public created() {}
  /**
   * 提交禁言，并刷新该成员信息，关闭弹窗
   */
  public async submitMutedMember(): Promise<void> {
    const group = this.chatTarget as Group;
    const target = this.selectMutedMember as GroupMember;
    const isForever = this.selectedMutedTime === FOREVER_TIME;
    const endTime = isForever
      ? FOREVER_TIME
      : Date.now() + this.selectedMutedTime;
    const data = await this.$post(URLS.SET_SINGLE_MUTED, {
      roomId: this.chatTarget.id,
      userId: target.id,
      deadline: endTime
    });
    if (data) {
      target.mutedEndTime = endTime;
      this.selectMutedTimeShowing = false;
      group.getGroupDetail();
      group.getMemberInfo(target.id);
      this.$notify.success("禁言成功");
    }
  }

  /**
   * 多选删除
   */
  public deleteSelectMsg() {
    if (this.chatTarget.selectedItems.length === 0) {
      this.$notify.fail("请选择要删除的消息");
      return;
    }
    const target = this.chatTarget;
    target.selectedItems.forEach(item => {
      target.deleteLocalMessage(item.id, target instanceof Group);
    });
    this.cancelMultiSelect();
  }

  /**
   * 点击转发
   * @param isMulti 是否是合并转发
   */
  public clickRelay(isMulti: boolean) {
    if (this.chatTarget.selectedItems.length === 0) {
      this.$notify.fail("请选择要转发的消息");
      return;
    }
    this.isMultiRelay = isMulti;
    this.relaySelectorShowing = true;
  }

  /**
   * 关闭选择对象弹窗
   */
  public closeRelaySelector(): void {
    this.relaySelectorShowing = false;
    this.isMultiRelay = false;
    this.cancelMultiSelect(); // 关闭多选状态
  }
  public mounted(): void {
    Bus.$on(
      "showMessageSelect",
      ({ message, event, isRelayDialog }: ShowMessageSelectEventParam) => {
        if (this.chatTarget.selectorShow) {
          // 多选时禁止右键
          return;
        }
        showMessageSelect({
          message,
          myId: this.myInfo.id,
          event,
          target: this.chatTarget,
          isRelayDialog,
          onMultiSelect: () => {
            this.chatTarget.selectorShow = true;
          },
          onRelay: () => {
            this.chatTarget.selectedItems.push(message);
            this.clickRelay(false);
          },
          onMuted: () => {
            const group = this.chatTarget as Group;
            const senderMember = group.memberList.find(
              item => item.id === message.senderId
            );
            if (senderMember) {
              this.selectedMutedTime = FOREVER_TIME;
              this.selectMutedMember = senderMember;
              this.selectMutedTimeShowing = true;
            }
          },
          onClose: () => {
            // todo 支持isMenuSelect
          }
        });
      }
    );
    // 从查看大图中转发聊天图片消息
    Bus.$on("relayChatPicture", (src: string) => {
      const message = this.chatTarget.msgHistory.find(item => {
        return item instanceof ImageMsg && item.url === src;
      });
      if (message) {
        this.chatTarget.selectedItems = [message];
        this.clickRelay(false);
      }
    });
  }

  public async addLike(param: any) {
    await this.clickLike(param);
    this.showLikeDetail = false;
    this.$nextTick(() => {
      this.showLikeDetail = true;
    });
  }

  public beforeDestroy() {
    Bus.$off("showMessageSelect");
    Bus.$off("relayChatPicture");
  }

  /**
   * 关闭多选
   */
  private cancelMultiSelect() {
    this.chatTarget.selectorShow = false;
    this.chatTarget.selectedItems = [];
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.main_chat {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafbfc;
}

.main {
  flex: 1;
}

.right_pop {
  position: absolute;
  top: 60px;
  right: 0;
  bottom: 0;
  background: #fff;
  box-shadow: var(--shadow-border);
  overflow: auto;
}

.mute_dialog-selector {
  margin: 20px 0 18px 0;
  text-align: center;
}

.mute_dialog-btn_wrapper {
  margin-bottom: 30px;
  text-align: center;

  & > button {
    width: 90px;
    height: 30px;
  }

  & > button:last-child {
    margin-left: 20px;
  }
}

.relay_selector {
  z-index: 10000; /* todo 移除 > 查看大图 */
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(1turn);
  }
}

@keyframes voice {
  0% {
    width: 4px;
  }
  33% {
    width: 4px;
  }
  34% {
    width: 10px;
  }
  66% {
    width: 10px;
  }
  67% {
    width: 22px;
  }
  100% {
    width: 22px;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s;
}

.slide-enter,
.slide-leave-to {
  transform: translateX(284px);
}

.file-enter-active,
.file-leave-active {
  transition: all 0.3s;
}

.file-enter,
.file-leave-to {
  transform: translateX(400px);
}
</style>

<style>
#main_chat {
  & a {
    text-decoration: none;
    color: #0d73ad;
  }
}
</style>
