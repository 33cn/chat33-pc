<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 聊天消息列表
-->
<template>
  <div class="message_list">
    <!-- 消息列表 -->
    <vue-scroll ref="listBox" @handle-scroll="handleMsgScroll">
      <template v-for="(item, index) in chatTarget.msgHistory">
        <div :key="index">
          <div
            v-if="checkIsNewPeriod(item, index)&& !isNotice(item)"
            class="label_time"
          >{{item.sendTime | filterChatTime}}</div>
          <div class="item_wrapper">
            <message-item v-if="!isSnapMsg(item)" class="l-item" :ref="item.id" :message="item"></message-item>
            <message-snap v-else class="l-item" :message="item" :ref="item.id"></message-snap>
          </div>
        </div>
      </template>
    </vue-scroll>
    <!-- 置顶群公告 -->
    <notice-pop v-if="latestUnreadNotify" :notice="latestUnreadNotify" @onClose="closeNoticePop"></notice-pop>
    <!-- 下侧未读跳转 -->
    <div
      v-show="chatTarget.unreadDownCount"
      class="unread_tip unread_tip_down"
      @click="go2UnreadDown"
    >
      <div class="unread_tip_down-icon">
        <i class="iconfont icon-gokaobei-copy1"></i>
      </div>
      <span>{{chatTarget.unreadDownCount}}条新消息</span>
    </div>

    <div class="unread_tip_top">
      <!-- 上侧未读快捷跳转 -->
      <div v-show="unreadMsgCount" class="unread_tip" @click="go2UnreadUp">
        <i class="iconfont icon-gokaobei-copy1"></i>
        <span>{{unreadMsgCount}}条新消息</span>
      </div>
      <!-- 点赞、打赏列表跳转 -->
      <div
        v-show="chatTarget.unReadLike"
        class="like_tip like_tip_right"
        :class="{'reward_tip':chatTarget.unReadReward >0}"
        @click="goTolikeHis"
      >
        <span>{{chatTarget.unReadLike}}条赞赏</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import { formatChatTime } from "@/scripts/common";
import Bus from "@/scripts/bus";
import { UserLoggedInfo } from "@/scripts/object";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import MessageItem from "@/components/message/message-item.vue";
import MessageSnap from "@/components/message/message-snap.vue";
import NoticePop from "@/components/notice-pop.vue";
import GroupAnnounce from "@/object/messages/GroupAnnounce";
import { MessageType } from "@/object/messages";
import LabelNotice from "@/object/messages/notice/LabelNotice";
import PayNotice from "@/object/messages/notice/PayNotice";
import SnapTextMsg from "@/object/messages/snapMsg/SnapTextMsg";
import SnapImageMsg from "@/object/messages/snapMsg/SnapImageMsg";
import SnapAudioMsg from "@/object/messages/snapMsg/SnapAudioMsg";
import LikeNotice from "@/object/messages/notice/LikeNotice";

@Component({
  components: {
    MessageItem,
    MessageSnap,
    NoticePop
  },
  filters: {
    filterChatTime(val: number): string {
      return formatChatTime(val);
    }
  }
})
export default class MessageList extends Vue {
  @State public chatTarget!: Group | Friend;
  @State public myInfo!: UserLoggedInfo;

  public latestUnreadNotify: GroupAnnounce | null = null; // 最新未读群公告

  @Watch("chatTarget.id")
  public watchTargetId() {
    this.handleChangeTarget();
  }

  @Watch("chatTarget.isTemp")
  public handleChangeTemp() {
    this.scroll2Bottom();
  }

  public get unreadMsgCount(): number {
    return this.chatTarget.msgHistory.reduce((total, item) => {
      return item.isUnread ? total + 1 : total;
    }, 0);
  }

  /**
   * 获取最早的未读消息节点
   */
  public get getUnreadTopDom(): HTMLElement | null {
    const topUnreadDom = this.chatTarget.msgHistory.find(item => item.isUnread);
    if (topUnreadDom) {
      return (this.$refs[topUnreadDom.id] as any[])[0].$el;
    }
    return null;
  }

  /**
   * 滚轮滚动事件：滚动到顶部加载更多，事件屏蔽无需滚动、正在加载、已经到达过顶部
   */
  public handleMsgScroll(vertical: any) {
    if (vertical.process === 0) {
      // 滚动到顶部
      const dom = this.getScrollDom();
      const lastScrollHeight = dom.scrollHeight;
      this.chatTarget.loadMsgHistory().then(() => {
        this.$nextTick(() => {
          dom.scrollTop = dom.scrollHeight - lastScrollHeight; // todo 处理加载速度慢时异常
        });
      });
    }
    if (vertical.process === 1) {
      this.clearUnreadDown();
    }
    this.handleUnreadUpScroll();
  }

  /**
   * 是否是阅后即焚消息
   */
  public isSnapMsg(message: MessageType): boolean {
    return (
      message instanceof SnapTextMsg ||
      message instanceof SnapImageMsg ||
      message instanceof SnapAudioMsg
    );
  }

  /**
   * 返回该消息是否和上条消息在五分钟之内
   */
  public checkIsNewPeriod(msg: MessageType, index: number) {
    if (index === 0) {
      return true;
    } else {
      const lastMsg = this.chatTarget.msgHistory[index - 1];
      const FIVE_MINUTE = 5 * 60 * 1000;
      return msg.sendTime - lastMsg.sendTime > FIVE_MINUTE;
    }
  }

  public isNotice(msg: MessageType) {
    return msg instanceof LikeNotice;
  }

  /**
   * 点击滚动到最早的未读消息
   */
  public go2UnreadUp() {
    const dom = this.getUnreadTopDom;
    if (dom) {
      dom.scrollIntoView();
      this.chatTarget.clearUnreadMessage();
    }
  }

  public go2UnreadDown() {
    this.scroll2Bottom();
  }

  /**
   * 关闭置顶群公告弹窗
   */
  public closeNoticePop() {
    this.latestUnreadNotify = null;
  }

  public mounted() {
    this.handleChangeTarget();
    Bus.$on("onEnterNewsPage", () => {
      this.scroll2Bottom();
    });
    Bus.$on("onMultiChatMsg", (targetList: string[]) => {
      // 收到多条消息滚动一次
      if (targetList.includes(this.chatTarget.id)) {
        this.scroll2Bottom();
      }
    });
    Bus.$on("onChatMsg", ({ targetId, message }: any) => {
      const target = this.chatTarget;
      if (targetId === target.id) {
        // 当前聊天收到消息，且当前列表靠近底部，则滚动到底部
        const isBottom = this.keepBottom();
        if (message instanceof GroupAnnounce) {
          // 收到当前聊天的公告
          message.isUnread = false; // 作为已读
        } else if (
          !(message instanceof LabelNotice || message instanceof PayNotice)
        ) {
          if (!isBottom && !message.isSendByMe) {
            target.unreadDownCount += 1; // 该消息未滚动到可视区且不是我发送的消息，底部未读加1
          }
          // 成员不在本地群成员中不再查询memberInfo
        }
      }
    });
    Bus.$on("onSendingMsg", () => {
      this.scroll2Bottom();
    });
  }

  public beforeDestroy() {
    Bus.$off("onChatMsg");
    Bus.$off("onEnterNewsPage");
    Bus.$off("onMultiChatMsg");
    Bus.$off("onSendingMsg");
  }

  /**
   * 置顶显示未读群公告并定时隐藏
   */
  private handleNotifyPop() {
    const list = this.chatTarget.msgHistory;
    let result: GroupAnnounce | null = null;
    for (let i = list.length; i--; ) {
      const item = list[i];
      if (item instanceof GroupAnnounce) {
        if (item.isUnread) {
          if (!result) {
            // 最新未读公告
            result = item;
          }
          item.isUnread = false; // 所有都标为已读
        }
      }
    }
    if (result) {
      this.latestUnreadNotify = result;
    }
  }

  /**
   * 获取消息实际滚动的盒子dom
   */
  private getScrollDom() {
    return (this.$refs.listBox as any).$el.children[0];
  }

  /**
   * 切换聊天对象时，按需加载聊天记录、滚动到底部
   */
  private async handleChangeTarget() {
    const target = this.chatTarget;
    if (!target.alreadyGetLogs && target.msgHistory.length < 25) {
      // 首次且消息不足一页 原:this.getScrollDom().scrollTop === 0
      await target.loadMsgHistory(); // 请求聊天记录
    }
    setTimeout(() => {
      // 避免从短列表切换到长列表滚动无效
      this.scroll2Bottom(() => {
        this.checkUnreadUpCount(); // 左走未读已在可视区：清除上方未读
      });
    }, 0);
    this.closeNoticePop(); // 切换后关闭原置顶公告
    if (target instanceof Group) {
      this.handleNotifyPop();
    }
  }

  /**
   * 当消息列表接近底部时，滚动到底部,保持在最底部
   * @return 是否保持在底部
   */
  private keepBottom(): boolean {
    // 当前聊天收到消息，且当前列表靠近底部，则滚动到底部
    const dom = this.getScrollDom();
    const RANGE = 120;
    // 内容小于一页或接近触底(可视区底部<120px)
    if (dom.scrollHeight - dom.scrollTop - dom.clientHeight < RANGE) {
      this.scroll2Bottom();
      return true;
    }
    return false;
  }

  /**
   * 滚动到最底部,清空底部未读计数
   */
  private scroll2Bottom(cb?: () => void) {
    this.$nextTick(() => {
      const list = this.$refs.listBox;
      if (list) {
        (list as any).scrollTo(
          {
            y: "100%"
          },
          false
        );
        this.clearUnreadDown();
        if (cb) {
          cb();
        }
      }
    });
  }

  /**
   * 下方未读数清零:滚动到底部/切换到该聊天
   */
  private clearUnreadDown() {
    this.chatTarget.unreadDownCount = 0;
  }

  /**
   * 滚动：翻2页/翻到最早未读清除上方未读
   */
  private handleUnreadUpScroll() {
    const scrollBox = this.getScrollDom();
    const targetDom = this.getUnreadTopDom;
    if (scrollBox && targetDom) {
      const over2page =
        scrollBox.scrollHeight - scrollBox.scrollTop >
        scrollBox.clientHeight * 3; // 底部不可见大于两页
      if (over2page || this.checkIsInView(targetDom)) {
        this.chatTarget.clearUnreadMessage();
      }
    }
  }

  /**
   * 检测消息是否可见
   */
  private checkIsInView(dom: HTMLElement) {
    return dom.offsetTop > this.getScrollDom().scrollTop;
  }

  /**
   * 最早未读已经在可视区：清空上方未读数量
   */
  private checkUnreadUpCount() {
    const dom = this.getUnreadTopDom;
    if (dom && this.checkIsInView(dom)) {
      // 最早未读已经在可视区
      this.chatTarget.clearUnreadMessage();
    }
  }

  public goTolikeHis() {
    this.$emit("showlikeHis");
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.message_list {
  position: relative;
  overflow: auto;
}

.label_time {
  margin-bottom: 20px;
  text-align: center;
  font-size: var(--small-font-size);
  color: var(--font-color-light);
  line-height: 17px;
}

.l-item {
  flex: 1;
}

.item_wrapper {
  display: flex;
  margin: 0 20px 20px 20px;
}

.unread_tip {
  width: 138px;
  height: 32px;
  line-height: 32px;
  background: #eaf6ff;
  color: var(--common-blue);
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  margin-bottom: 10px;
  & > span {
    margin-left: 9px;
  }
}

.unread_tip_top {
  position: absolute;
  top: 30px;
  right: 0;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
}

.unread_tip_down {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 19px;
}

.unread_tip_down-icon {
  display: inline-block;
  transform: rotate(180deg);
}

.like_tip {
  width: 90px;
  height: 32px;
  line-height: 32px;
  background: #eaf6ff;
  color: var(--common-blue);
  text-align: center;
  border-radius: 100px 0px 0px 100px;
  cursor: pointer;
}

.reward_tip {
  background: #fcf3e2;
  color: var(--font-color-yellow);
}
</style>
