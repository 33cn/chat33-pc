<!--
  @Author: yuanzeyu
  @Date: 2018/9/30
  @Desc: 新消息页
-->
<template>
  <div class="news_page">
    <div class="menu">
      <search-bar flag="news"></search-bar>
      <tab-bar :labels="['群聊消息', '好友消息']" :counts="[groupsUnread, friendsUnread]" v-model="tabActive"></tab-bar>


      <div class="menu-list_wrapper">
        <vue-scroll>
          <div class="menu-list" v-show="tabActive === '群聊消息'">
            <news-item v-for="item in groups"
                       :key="item.id"
                       :target="item"
                       :selected="chatTarget===item"
                       @click="selectTarget(item)"
                       @contextmenu.native.prevent="showContextMenu(item, $event)">
            </news-item>
          </div>

          <div class="menu-list" v-show="tabActive === '好友消息'">
            <news-item v-for="item in friends"
                       :key="item.id"
                       :target="item"
                       :selected="chatTarget===item"
                       @click="selectTarget(item)"
                       @contextmenu.native.prevent="showContextMenu(item, $event)">
            </news-item>
            <!-- 右键查看资料弹窗 -->
            <focus-dialog v-if="infoDialogShowing" :show.sync="infoDialogShowing" :showMask="false">
              <friend-dialog :user="infoTarget"
                             class="menu-list-item_dialog"
                             :style="{top:`${infoDialogHeight}px`}"
                             @onClickBtn="infoDialogShowing=false">
              </friend-dialog>
            </focus-dialog>
          </div>
        </vue-scroll>
      </div>


    </div>
    <div class="main">
      <main-chat v-if="chatTarget"></main-chat>
      <empty-banner v-if="!chatTarget" :type="emptyType" :friendList="friendList"></empty-banner>
    </div>
    <confirm-dialog v-show="deleteChatTarget" @cancel="deleteChatTarget = null" @confirm="doDeleteChat">
      <div>确定删除 <span>{{deleteChatTarget ? deleteChatTarget.remark || deleteChatTarget.name : ''}}</span> 的聊天吗？</div>
    </confirm-dialog>
    <confirm-dialog v-if="currentBannedGroup" :showCancel="false" @confirm="currentBannedGroup=null">
      <div v-if="currentBannedGroup.banEndTime===FOREVER_TIME">
        该群聊已被永久查封，如需解封可联系客服：{{customerServer}}
      </div>
      <div v-else>
        该群聊已被查封至
        <span>{{currentBannedGroup.banEndTime | formatDateString}}</span>
        ，如需解封可联系客服：{{customerServer}}
      </div>
    </confirm-dialog>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {Route} from 'vue-router';
  import {Mutation, State} from 'vuex-class';
  import MainChat from '@/views/main-chat.vue';
  import {MySocket, UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import Bus from '@/scripts/bus';
  import {Muted, TopStatus, FOREVER_TIME} from '@/config/const-enums';
  import {RouterName} from '@/config/type';
  import URLS from '@/config/urls';
  import {sortTargetList} from '@/utils/app';
  import showContextMenu from '@/plugins/ContextMenu';
  import EmptyBanner from '@/components/empty-banner.vue';
  import ConfirmDialog from '@/components/confirm-dialog.vue';
  import FocusDialog from '@/components/focus-dialog.vue';
  import SearchBar from '@/components/search-bar.vue';
  import TabBar from '@/components/tab-bar.vue';
  import NewsItem from '@/components/items/news-item.vue';
  import FriendDialog from '@/views/infoViewers/friend-dialog.vue';
  import {SocketEvent} from '@/config/config-enum';
  import PlatformConfig from '@/config/platform';
  import {formatDateString} from '@/utils/tool';

  @Component({
    components: {
      SearchBar,
      TabBar,
      MainChat,
      EmptyBanner,
      ConfirmDialog,
      FocusDialog,
      FriendDialog,
      NewsItem
    },
    filters: {
      formatDateString(val: number): string {
        return formatDateString(val);
      }
    }
  })
  export default class NewsPage extends Vue {
    @State public myInfo!: UserLoggedInfo;
    @State public groupList!: Group[];
    @State public friendList!: Friend[];
    @State public chatTarget!: Group | Friend | null;
    @State public socket!: MySocket;
    @Mutation public removeTarget!: (target: Group | Friend) => void;
    @Mutation public setChatTarget!: (target: Group | Friend | null) => void;
    // status

    public tabActive: string = '群聊消息';
    public waitingOpenGroupId: string = ''; // 等待收到添加socket时直接打开的群id
    public infoTarget: Friend | null = null; // 好友会话列表查看资料展示弹窗的id
    public infoDialogShowing: boolean = false; // 好友会话右键查看资料显示
    public infoDialogHeight: number = 0;
    public deleteChatTarget: Group | Friend | null = null; // 点击删除会话的对象
    public currentBannedGroup: Group | null = null; // 当前会话群被封弹窗显示
    public customerServer = PlatformConfig.CustomerServer;
    public FOREVER_TIME = FOREVER_TIME;

    // computed
    public get groups(): Group[] { // todo 优化会话列表绑定computed，避免频繁执行？
      const groupList = this.groupList.filter((item) => {
        return (item.msgHistory.length > 0 || item.ready4Send) && item.banEndTime === 0;
      });
      
      groupList.sort(sortTargetList);
      return groupList;
    }

    public get friends(): Friend[] {
      const friendList = this.friendList.filter((item) => item.msgHistory.length > 0 || item.ready4Send);
      friendList.sort(sortTargetList);
      return friendList;
    }

    public get groupsUnread(): number {
      return this.groupList.reduce((total: number, item: Group) => {
        return item.muted ? total : total + item.unReadCount;
      }, 0);
    }

    public get friendsUnread(): number {
      return this.friendList.reduce((total: number, item: Friend) => {
        return item.muted ? total : total + item.unReadCount;
      }, 0);
    }

    public get emptyType(): string {
      if (this.tabActive === '群聊消息') {
        return this.groups.length > 0 ? 'unselected' : 'groupNewsEmpty';
      } else {
        return this.friends.length > 0 ? 'unselected' : 'friendNewsEmpty';
      }
    }

    // event
    // 列表选中；加载聊天记录/群详情->滚动到底部
    public selectTarget(target: Friend | Group) {
      const oldTarget = this.chatTarget;
      this.setChatTarget(target);
      target.unReadCount = 0;
      // 未请求过群详情和个人在群内的信息，则请求，点击头像需是否能添加好友信息
      if (target instanceof Group) {
        if (!target.alreadyGetDetail && !target.isTemp) { // 首次打开该群，加载群详情和所有群成员
          target.getGroupDetail();
          target.getMembers();
        }
      }
      // target.sortMsgList();
      this.$nextTick(() => {
        if (oldTarget) {
          // oldTarget.limitMsgLength();
        }
      });
    }

    public showContextMenu(target: Group | Friend, e: MouseEvent) {
      const items = [
        {
          label: target.isTop ? '取消置顶' : '置顶聊天',
          onClick: () => {
            if (target instanceof Group) {
              this.setGroupTop(target as Group);
            } else {
              this.setFriendTop(target as Friend);
            }
          }
        }, {
          label: '删除聊天',
          onClick: () => { // todo 提出清除消息到target
            this.deleteChatTarget = target;
          }
        }, {
          label: target.muted ? '取消免打扰' : '消息免打扰',
          onClick: () => {
            if (target instanceof Group) {
              this.setGroupMuted(target as Group);
            } else {
              this.setFriendMuted(target as Friend);
            }
          }
        }
      ];
      if (target instanceof Friend) {
        items.push({
          label: '查看资料',
          onClick: () => {
            this.showInfoTarget(target as Friend, e);
          }
        });
      }
      showContextMenu(items, e, false);
    }

    public doDeleteChat() {
      const target = this.deleteChatTarget as Group | Friend;
      if (this.chatTarget === target) {
        this.setChatTarget(null);
      }
      if (target.isTemp) { // 是删除临时会话：直接删除
        this.removeTarget(target);
      } else { // 仅清空聊天记录(从会话列表删除)
        target.msgHistory = []; // todo vuex
        target.alreadyGetLogs = false;
        target.nextMsgId = '';
        target.ready4Send = false;
      }
      this.deleteChatTarget = null;
    }

    private showInfoTarget(target: Friend, e: MouseEvent) {
      this.infoTarget = target;
      this.$nextTick(() => {
        let expectTop = e.clientY + 36 - 154;
        if (expectTop < 0) {
          expectTop = 0;
        } else if (expectTop + 308 > document.body.clientHeight) {
          expectTop = document.body.clientHeight - 308;
        }
        this.infoDialogHeight = expectTop;
        this.infoDialogShowing = true;
      });
    }

    // 注册Bus事件
    private InitBusEvent() {
      Bus.$on('onLoadChatMsg', ({target, senderId, countUnread, message}: any) => { // todo 声明
        if (countUnread && this.chatTarget !== target && senderId !== this.myInfo.id) { // 不是当前聊天且非自己发送：未读+1
          target.unReadCount += 1;
          message.isUnPlayed = true;
        }
      });
      Bus.$on('onGroupsLoaded', () => { // 群列表和本地消息加载完成
        if (this.groups.length > 0) {
          this.selectTarget(this.groups[0]);
        }
      });
      Bus.$on('onTrySendMsg', this.handleTrySend);
      Bus.$on('directJoinGroup', (id: string) => {
        this.waitingOpenGroupId = id;
        const exist = this.groupList.find((item: Group) => item.id === id);
        if (exist) {
          this.selectTarget(exist);
          this.waitingOpenGroupId = '';
        }
      });
      Bus.$on('directJoinGroupCancel', (id: string) => {
        if (this.waitingOpenGroupId === id) {
          this.waitingOpenGroupId = '';
        }
      });
      Bus.$on('onAddGroup', (group: Group) => { //
        if (group.id === this.waitingOpenGroupId) {
          Bus.$emit('onTrySendMsg', group);
          this.waitingOpenGroupId = '';
        }
      });
    }

    private clearBusEvent(): void {
      Bus.$off('onLoadChatMsg');
      Bus.$off('onGroupsLoaded');
      Bus.$off('onTrySendMsg');
      Bus.$off('directJoinGroup');
      Bus.$off('onAddGroup');
      Bus.$off('directJoinGroupCancel');
    }

    // 筛选、联系人信息等点击发送消息： 切换到对应tab并选中
    public handleTrySend(target: Friend | Group) {
      const nameMap: any = {
        friend: '好友消息',
        group: '群聊消息'
      };
      this.tabActive = target instanceof Friend ? nameMap['friend'] : nameMap['group'];
      this.selectTarget(target);
    }

    private async setGroupTop(target: Group) { // 和群/好友信息栏提出
      const data = await this.$post(URLS.SET_GROUP_TOP, {
        roomId: target.id,
        stickyOnTop: target.isTop ? TopStatus.No : TopStatus.Yes // 切换置顶状态
      });
      if (data) {
        target.isTop = !target.isTop;
      }
    }

    private async setFriendTop(target: Friend) {
      const data = await this.$post(URLS.SET_FRIEND_TOP, {
        id: target.id,
        stickyOnTop: target.isTop ? TopStatus.No : TopStatus.Yes // 切换置顶状态
      });
      if (data) {
        target.isTop = !target.isTop;
      }
    }

    private async setGroupMuted(target: Group) {
      const data = await this.$post(URLS.SET_GROUP_MUTED, {
        roomId: target.id,
        setNoDisturbing: target.muted ? Muted.No : Muted.YES
      });
      if (data) {
        target.muted = !target.muted;
      }
    }

    private async setFriendMuted(target: Friend) {
      const data = await this.$post(URLS.SET_FRIEND_MUTED, {
        id: target.id,
        setNoDisturbing: target.muted ? Muted.No : Muted.YES
      });
      if (data) {
        target.muted = !target.muted;
      }
    }

    // life cycle
    private created() {
      this.initSocketEvent();
      this.InitBusEvent();
    }

    private beforeDestroy() {
      this.clearBusEvent();
    }

    private beforeRouteEnter(to: Route, from: Route, next: any): void {
      next((vm: MainChat) => {
        if (to.name !== RouterName.Login) { // todo 优化滚动通知
          Bus.$emit('onEnterNewsPage');
        }
      });
    }

    private initSocketEvent() {
      if (this.socket) {
        this.socket.listen(SocketEvent.BanGroup, (groupId: string, endTime: number) => {
          if (this.chatTarget instanceof Group && this.chatTarget.id === groupId) {
            this.handleCurrentChatBanned();
          }
        });
      } else {
        throw new Error('消息页创建时socket未创建？');
      }
    }

    /**
     * 处理当前会话群被封
     * @desc 删除该会话，弹窗提示
     */
    private handleCurrentChatBanned() {
      this.currentBannedGroup = this.chatTarget as Group;
      this.setChatTarget(null);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .news_page {
    display: flex;
    height: 100%;
  }

  .menu {
    position: relative;
    display: flex;
    flex-direction: column;
    width: var(--menu-width);
    box-shadow: var(--shadow-border);
    z-index: 1;
  }

  .menu-list_wrapper {
    flex: 1;
    overflow: auto;
  }

  .menu-list {
    width: 260px;
  }

  .menu-list-item_dialog {
    position: absolute;
    left: 340px;
    top: 0;
    width: 440px;
    overflow: hidden;
  }

  .main {
    flex: 1;
  }
</style>
