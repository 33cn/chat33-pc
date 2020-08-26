<!--
  @Author: yuanzeyu
  @Date: 2018/9/30
  @Desc: 联系人页
-->
<template>
  <div class="friend_page">
    <div class="menu">
      <search-bar></search-bar>
      <div class="menu-new_friends" @click="selectPage('新朋友')">
        <img class="menu-new_friends-icon" src="../assets/more.svg" alt="查看">
        <red-count class="menu-new_friends-count" :count="applyCount" :isGrey="false"></red-count>
        <span>新的朋友</span>
      </div>
      <tab-bar :labels="['好友', '群聊']" :counts="[0, 0]" v-model="tabActive"></tab-bar>

      <!-- todo 优化层级 -->
      <div class="menu-list_wrapper" v-show="tabActive==='好友'">
        <div class="menu-list">
          <vue-scroll>
            <div v-for="(sortItem, index) in sortedFriendList" :key="index">
              <a class="member-letter_title" :name="`friend${sortItem.letter}`">{{sortItem.letter}}</a>
              <target-item v-for="item in sortItem.list"
                           class="menu-list-item"
                           @click.native="selectTarget(item)"
                           :target="item"
                           :active="currentTarget.id === item.id"
                           :key="item.id">
              </target-item>
            </div>
          </vue-scroll>
        </div>
        <letter-selector :letters="friendLetters" flag="friend"></letter-selector>
      </div>

      <div class="menu-list_wrapper" v-show="tabActive==='群聊'">
        <div class="menu-list">
          <vue-scroll ref="groupScroll">
            <div v-for="(sortItem, index) in sortedGroupList" :key="index">
              <a class="member-letter_title" :name="`group${sortItem.letter}`">{{sortItem.letter}}</a>
              <target-item v-for="item in sortItem.list"
                           class="menu-list-item"
                           @click.native="selectTarget(item)"
                           :target="item"
                           :active="currentTarget.id === item.id"
                           :key="item.id">
              </target-item>
            </div>
          </vue-scroll>
        </div>
        <letter-selector :letters="groupLetters" flag="group"></letter-selector>
      </div>

    </div>

    <div class="main">
      <div class="g-drag_bar"></div>
      <template v-if="currentTargetExist">
        <common-info v-show="currentTargetExist instanceof Friend" :target="currentTargetExist"></common-info>

        <group-info v-show="currentTargetExist instanceof Group" :group="currentTargetExist"></group-info>
        <div class="main-group_ban_mask" v-if="currentTargetExist&&currentTargetExist.banEndTime">
          <div class="main-group_ban_mask-text" v-if="currentTargetExist.banEndTime===FOREVER_TIME">
            该群聊已被永久查封，如需解封可联系客服：{{customerServer}}
          </div>
          <div v-else class="main-group_ban_mask-text">
            该群聊已被查封至
            {{currentTargetExist.banEndTime | formatDateString}}
            ，如需解封可联系客服：
            {{customerServer}}
          </div>
        </div>
      </template>
      <empty-banner v-if="!currentTargetExist" :type="emptyType" :friendList="friendListNoTemp"></empty-banner>
      <apply-log v-show='currentPage ==="新朋友"' @onNewApply="handleNewApply"></apply-log>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {State, Getter, Mutation} from 'vuex-class';
  import {RouterName} from '@/config/type';
  import {MySocket, UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import Bus from '@/scripts/bus';
  import {groupByFirstLetter} from '@/scripts/common';
  import SearchBar from '@/components/search-bar.vue';
  import TabBar from '@/components/tab-bar.vue';
  import RedCount from '@/components/red-count.vue';
  import EmptyBanner from '@/components/empty-banner.vue';
  import LetterSelector from '@/components/letter-selector.vue';
  import TargetItem from '@/components/items/target-item.vue';
  import CommonInfo from './infoViewers/common-info.vue';
  import GroupInfo from './infoViewers/group-info.vue';
  import ApplyLog from './apply-log.vue';
  import PlatformConfig from '@/config/platform';
  import {formatDateString} from '@/utils/tool';
  import {FOREVER_TIME} from '@/config/const-enums';


  @Component({
    components: {
      SearchBar,
      TabBar,
      ApplyLog,
      RedCount,
      EmptyBanner,
      LetterSelector,
      GroupInfo,
      TargetItem,
      CommonInfo
    },
    filters: {
      formatDateString(val: number): string {
        return formatDateString(val);
      }
    }
  })
  export default class FriendPage extends Vue {

    @State public myInfo!: UserLoggedInfo;
    @State public socket!: MySocket | null;
    @State public applyCount!: number;
    @Getter public groupListNoTemp!: Group[];
    @Getter public friendListNoTemp!: Friend[];
    @Mutation public addApplyCount!: () => void;
    @Mutation public setApplyCount!: (count: number) => void;

    public tabActive: '好友' | '群聊' = '好友';
    public currentTarget: Friend | Group = new Friend({id:'1'});
    public currentPage: '联系人信息' | '新朋友' = '联系人信息';
    public Friend = Friend;
    public Group = Group;
    public customerServer = PlatformConfig.CustomerServer;
    public FOREVER_TIME = FOREVER_TIME;

    /**
     * 当前好友（已被删除时返回null）
     */
    public get currentTargetExist(): Friend | Group | null {
      const list: Array<Friend | Group> = this.currentTarget instanceof Friend ? this.friendListNoTemp : this.groupListNoTemp;
      return list.find((item: Friend | Group) => item.id === this.currentTarget.id && !item.isTemp) || null;
    }

    public get emptyType(): string {
      if (this.tabActive === '群聊') {
        return this.groupListNoTemp.length > 0 ? 'unselected' : 'groupEmpty';
      } else {
        return this.friendListNoTemp.length > 0 ? 'unselected' : 'friendEmpty';
      }
    }

    public get sortedFriendList() {
      return groupByFirstLetter(this.friendListNoTemp, (item: Friend) => item.remark || item.name);
    }

    public get sortedGroupList() {
      return groupByFirstLetter(this.groupListNoTemp, (item: Group) => item.name);
    }

    public get friendLetters() {
      return this.sortedFriendList.map((item: any) => item.letter);
    }

    public get groupLetters() {
      return this.sortedGroupList.map((item: any) => item.letter);
    }

    public selectPage(val: '联系人信息' | '新朋友') {
      this.currentPage = val;
      if (val === '新朋友') {
        this.currentTarget = new Friend({id:'1'});
        this.setApplyCount(0);
      }
    }

    public selectTarget(target: Friend | Group) {
      this.currentTarget = target;
      if (target instanceof Group) {
        target.getGroupDetail();
        if (!target.source) {
          target.getSource(this.myInfo.id);
        }
      } else {
        target.getFriendDetail();
      }
      this.currentPage = '联系人信息';
    }

    public handleNewApply(): void {
      const isInApplyLog = this.$route.name === RouterName.Contact && this.currentPage === '新朋友';
      if (!isInApplyLog) {
        this.addApplyCount();
      }
    }


    public created() {
      if (this.friendListNoTemp.length > 0) {
        this.currentTarget = this.friendListNoTemp[0];
      }
      // 点击开始聊天跳转到该页时打开显示好友列表
      Bus.$on('onOpenChat', () => {
        this.tabActive = '好友';
      });
    }

    public beforeDestroy() {
      Bus.$off('onOpenChat');
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .friend_page {
    display: flex;
  }

  .menu {
    position: relative;
    display: flex;
    height: 100vh;
    flex-direction: column;
    width: var(--menu-width);
    box-shadow: var(--shadow-border);
    z-index: 1;
  }

  .menu-new_friends {
    margin-bottom: 10px;
    padding: 0 10px;
    height: 30px;
    color: var(--font-color-light);
    line-height: 30px;
    cursor: pointer;
    box-shadow: var(--shadow-border);
  }

  .menu-new_friends-count {
    float: right;
    margin: 8px 10px 0 0;
  }

  .menu-new_friends-icon {
    float: right;
    margin-top: 8px;
  }

  .menu-list_wrapper {
    position: relative;
    flex: 1;
    min-height: 0; /* 避免overflow无效 */
  }

  .menu-list {
    overflow: auto;
    height: 100%;
  }

  .menu-list-item {
    width: calc(260px - 16px - 10px - 10px - 10px);
  }

  .member-letter_title {
    line-height: 20px;
    padding-left: 20px;
    color: var(--font-color-light);
    font-size: var(--small-font-size);
  }

  .main {
    height: 100vh;
    flex: 1;
    position: relative;
  }

  .main-group_ban_mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(255, 255, 255, 0.9);
  }

  .main-group_ban_mask-text {
    color: #CF4646;
    line-height: 20px;
    font-weight: 500;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 324px;
  }
</style>
