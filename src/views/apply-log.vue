<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc: 加群/好友申请记录
-->
<template>
  <div class="new_friends" :style="`top:${isWin?30:20}px`">
    <vue-scroll @handle-scroll="handleScrollDom">
      <div class="wrapper">
        <template v-for="(item, index) in applyListSort">
          <div class="date" v-if="index===0||(shortDate(item.datetime)!==shortDate(applies[index-1].datetime)&&item.datetime !== 0)">
            {{shortDate(item.datetime)}}
          </div>
          <apply-template class="apply"
                          :apply="item"
                          @click="handleClickItem"
                          @onPassFriendApply="syncSameApply(item)">
          </apply-template>
        </template>
      </div>
    </vue-scroll>
    <right-dialog v-if="clickDialogShowing" :show.sync="clickDialogShowing" :mouseEvent="rightDialogEvent">
      <friend-dialog v-if="clickDialogTarget&&clickDialogTarget.type==='friend'"
                     :user="clickDialogTarget"
                     :noSource="true"
                     @onClickBtn="clickDialogShowing=false">
      </friend-dialog>
      <group-dialog v-if="clickDialogTarget&&clickDialogTarget.type==='group'"
                    :group="clickDialogTarget"
                    @onClickBtn="clickDialogShowing=false">
      </group-dialog>
    </right-dialog>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {MySocket, UserLoggedInfo} from '../scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {ApplyStatus, Muted, NewChannelType, NO_NEXT_LOG, TopStatus} from '../config/const-enums';
  import {SocketEvent} from '../config/config-enum';
  import URLS from '../config/urls';
  import Bus from '../scripts/bus';
  import RightDialog from '../components/right-dialog.vue';
  import FriendDialog from './infoViewers/friend-dialog.vue';
  import GroupDialog from './infoViewers/group-dialog.vue';
  import {Action, Getter, Mutation, State} from 'vuex-class';
  import {ApplyItem, ApplyList} from '../config/apiTypings';
  import ApplyTemplate from '../components/items/apply-item.vue';
  import {EmitApplyClick} from '../config/type';

  function shortDate(val: number) {
    const date = new Date(val);
    return `${date.getFullYear()}/${date.getMonth() + 1}`;
  }

  @Component({
    components: {RightDialog, FriendDialog, GroupDialog, ApplyTemplate}
  })
  export default class ApplyLog extends Vue {
    @State public isWin!: boolean;
    @State public myInfo!: UserLoggedInfo;
    @State public socket!: MySocket | null;
    @Getter public groupListNoTemp!: Group[];
    @Getter public friendListNoTemp!: Friend[];
    @Mutation public addApplyCount!: () => void;
    @Action public addFriendById!: (id: string) => void;

    public applies: ApplyItem[] = [];
    public nextApplyId: string = '';
    // 信息弹窗
    public clickDialogShowing: boolean = false;
    public rightDialogEvent: MouseEvent | null = null;
    public clickDialogTarget: Friend | Group | null = null;


    public get applyListSort() { // 列表按编辑的时间排序
      return this.applies.sort((a, b) => b.datetime - a.datetime);
    }

    public shortDate = shortDate;

    /**
     * 点击列表跳转逻辑处理
     */
    public async handleClickItem(params: EmitApplyClick): Promise<void> {
      const apply = params.apply;
      const clickId = params.id;
      const isSendByMe = apply.senderInfo.id === this.myInfo.id;
      const unHandle = apply.status === ApplyStatus.Waiting && !isSendByMe; // 不是需要我处理状态
      if (unHandle) {
        return; // 如果等待登录者验证则无动作
      }

      if (params.isGroup) { // 点击的是群
        const target = this.groupListNoTemp.find((item: Group) => item.id === clickId);
        if (target) {
          Bus.$emit('onTrySendMsg', target);
        } else {
          this.showGroupDialog(clickId, params.e);
        }
      } else { // 点击的是好友
        const target = this.friendListNoTemp.find((item: Friend) => item.id === clickId);
        if (target) { // 是好友
          Bus.$emit('onTrySendMsg', target);
        } else {
          this.showFriendDialog(clickId, params.e);
        }
      }

    }

    /**
     * 互相申请加好友同步状态(已有一方同意)
     * @param apply
     */
    public syncSameApply(apply: ApplyItem) {
      const sameApply = this.applies.find((item) => {
        if (item.type === NewChannelType.Friend) {
          const isSame = item.receiveInfo.id === apply.senderInfo.id || item.senderInfo.id === apply.receiveInfo.id;
          return isSame && item.status !== ApplyStatus.Reject;
        }
        return false;
      });
      if (sameApply) {
        sameApply.status = ApplyStatus.Pass;
      }
    }

    public created() {
      this.getApplyList();
      if (this.socket) {
        this.socket.listen(SocketEvent.AddApply, (apply: ApplyItem) => {
          this.addApply(apply);
          if (apply.type === NewChannelType.Friend && apply.status === ApplyStatus.Pass) { // 如果是通过了加好友
            this.addNewFriend(apply);
            this.syncSameApply(apply);
          }
          const isFriendApply = apply.type === NewChannelType.Friend && apply.senderInfo.id !== this.myInfo.id;
          const isGroupApply = apply.type === NewChannelType.Group && apply.senderInfo.id !== this.myInfo.id;
          if (apply.status === ApplyStatus.Waiting && (isFriendApply || isGroupApply)) {
            this.handleNewApplyCount();
          }
        });
      }
    }

    public handleScrollDom(vertical: any) {
      if (vertical.process === 1) {
        this.getApplyList();
      }
    }

    /**
     * 显示群信息弹窗
     */
    private async showGroupDialog(id: string, e: MouseEvent) {
      const group = new Group({id});
      group.isTemp = true;
      await group.getGroupDetail();
      this.showSenderInfoPop(group, e);
    }

    /**
     * 显示好友信息弹窗
     */
    private async showFriendDialog(id: string, e: MouseEvent) {
      const friend = await this.getFriend(id);
      if (friend) {
        friend.isTemp = true;
        this.showSenderInfoPop(friend, e);
      }
    }

    private showSenderInfoPop(info: Friend | Group, e: any) {
      this.rightDialogEvent = e;
      this.clickDialogTarget = info;
      this.clickDialogShowing = true;
    }

    private async getFriend(targetId: string) {
      const data = await this.$post(URLS.GET_USER_INFO, {id: targetId});
      if (data) {
        return new Friend(Object.assign({},data,{isTop: data.stickyOnTop === TopStatus.Yes, often: false, muted: data.noDisturbing === Muted.YES, me: this.myInfo}));
      }
      return null;
    }

    /**
     * 加载更多申请记录
     * @param count
     */
    private async getApplyList(count: number = 10) {
      if (this.nextApplyId === NO_NEXT_LOG) {
        return;
      }
      const data = await this.$post(URLS.GET_APPLY_LIST, {
        number: count,
        id: this.nextApplyId
      });
      if (data) {
        const res = data as ApplyList;
        res.applyList.forEach((item: any) => {
          this.addApply(item);
        });
        this.nextApplyId = res.nextId;
      }
    }

    /**
     * 加入新申请（有则更新无则新增）
     * @param apply
     */
    private addApply(apply: ApplyItem) {
      const existIndex = this.applies.findIndex((item) => item.id === apply.id);
      if (existIndex > -1) { // 已存在则更新
        this.applies.splice(existIndex, 1, apply);
      } else {
        this.applies.push(apply);
      }
    }

    /**
     * 获取信息，加载新好友
     */
    private async addNewFriend(apply: ApplyItem) {
      const targetId = apply.senderInfo.id === this.myInfo.id ? apply.receiveInfo.id : apply.senderInfo.id; // 对方
      this.addFriendById(targetId);
    }

    private handleNewApplyCount() {
      this.$emit('onNewApply');
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .new_friends {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: auto;
  }

  .wrapper { /* 滚动条在最右侧 */
    padding: 0 40px;
    background: #fff;
    background-clip: content-box;
  }

  .date {
    margin-bottom: 10px;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 17px;
  }

  .apply {
    margin-bottom: 10px;
  }
</style>
