<!--
  @Author: yuanzeyu
  @Date: 2019/1/29
  @Desc: 最左侧菜单栏及用户头像
-->
<template>
  <div class="page-menu g-tool-drag" id="page-menu">
    <common-header class="header g-tool-no_drag" :url="myInfo.avatar" @click="handleClickHeader"></common-header>
    <router-link :to="RouterPath.Chat" class="item" tag="div">
      <i class="iconfont icon-xiaoxi item-icon_chat"></i>
      <red-count class="item-count" :count="newsCount" :isGrey="false"></red-count>
    </router-link>
    <router-link :to="RouterPath.Contact" class="item" tag="div">
      <i class="iconfont icon-lianxiren item-icon_contact"></i>
      <red-count class="item-count" :count="applyCount" :isGrey="false"></red-count>
    </router-link>
    <router-link :to="RouterPath.Set" class="item item_bottom" tag="div">
      <i class="iconfont icon-shezhi item-icon_set"></i>
    </router-link>
    <!-- 显示我的信息弹窗 -->
    <right-dialog class="info_dialog" v-if="myInfoShowing" :show.sync="myInfoShowing" :mouseEvent="rightDialogEvent">
      <friend-dialog :user="myInfo" @onClickBtn="myInfoShowing=false"></friend-dialog>
    </right-dialog>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {State} from 'vuex-class';
  import {UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {RouterPath, RouterName} from '@/config/type';
  import {getUnreadCount} from '@/utils/app';
  import CommonHeader from '@/components/common-header.vue';
  import RedCount from '@/components/red-count.vue';
  import RightDialog from '@/components/right-dialog.vue';
  import FriendDialog from '@/views/infoViewers/friend-dialog.vue';

  @Component({
    components: {
      CommonHeader,
      RedCount,
      RightDialog,
      FriendDialog
    }
  })
  export default class PageMenu extends Vue {
    @State public myInfo!: UserLoggedInfo;
    @State public groupList!: Group[];
    @State public friendList!: Friend[];
    @State public applyCount!: number;

    public rightDialogEvent: MouseEvent | null = null;
    public myInfoShowing: boolean = false; // 显示我的信息（点击头像）
    public RouterPath = RouterPath;

    public get newsCount(): number {
      return getUnreadCount(this.groupList, this.friendList);
    }

    /**
     * 点击左上角头像：显示弹窗(在非设置页)
     */
    public handleClickHeader(e: MouseEvent): void {
      if (this.$route.name !== RouterName.Set) {
        this.rightDialogEvent = e;
        // this.myInfoShowing = true;
      }
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .page-menu {
    position: fixed;
    width:  calc(var(--left-bar-width) - 4px);
    left: 0;
    top:0;
    bottom:0;
    margin: 2px 2px; /* 留出空间在win下可拖动 */
    text-align: center;
    font-size: 0;
  }

  .header {
    margin-top: calc(74px - 2px);
    width: 44px;
    height: 44px;
  }

  .item {
    position: relative;
    height: 30px;
    margin-top: 40px;
    line-height: 30px;
    width: 100%;
    color: var(--icon-default-color);
    cursor: pointer;
    -webkit-app-region: no-drag;
  }

  .item_bottom {
    position: absolute;
    bottom: calc(20px - 2px);
  }

  .item-icon_chat {
    font-size: 22px;
  }

  .item-icon_contact {
    font-size: 21px;
  }

  .item-icon_set {
    font-size: 24px;
  }

  .item-count {
    position: absolute;
    top: -6px;
    right: 16px;
  }

  .info_dialog {
    text-align: left;
    font-size: var(--normal-font-size);
  }
</style>

<style>
  @import '../styles/var.css';

  #page-menu {
    & .item.router-link-active  {
      color: var(--icon-active-color);
    }
  }
</style>
