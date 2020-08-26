<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc: 群信息右栏
-->
<template>
  <div class="group_info">
    <div class="content_wrapper">
      <vue-scroll>
        <!-- 群基本信息卡 -->
        <div class="info">
          <header-uploader v-if="myInfo.type===MemberType.Owner" class="info-header" :group="group"></header-uploader>
          <common-header
            v-else
            class="info-header"
            :url="group.avatar"
            @click.native="imageViewer(group.avatar)"
          ></common-header>

          <div class="info-name_wrapper">
            <text-editor
              class="info-name"
              :text="group.name"
              :maxLength="FormLimit.Name"
              :disabled="!hasManageAuthority"
              @onEdited="saveEditGroupName"
              placeholder="点击设置"
            >
              <img v-if="hasManageAuthority" src="../assets/edit.svg" alt="编辑" />
            </text-editor>
          </div>
          <div class="info-id">{{group.markId}}</div>
        </div>

        <!-- 群公告 -->
        <div class="notify">
          <div
            class="notify-title_wrapper"
            :class="{'tool_click': hasManageAuthority && group.groupNotifyList.length === 0}"
            @click="sendWhenEmpty"
          >
            <img
              class="notify-more"
              :class="{'tool_click': group.groupNotifyList.length > 0}"
              src="../assets/more.svg"
              alt="更多"
              @click="showMoreNotify"
            />
            <div
              v-if="group.groupNotifyList.length > 0"
              class="notify-count tool_click"
              @click="showMoreNotify"
            >共{{group.groupNotifyCount}}条</div>
            <div v-else class="notify-count">暂无公告</div>
            <h2 class="notify-title">群公告</h2>
            <img
              v-if="hasManageAuthority"
              class="notify-add"
              src="../assets/add.svg"
              alt="添加"
              @click="addNotifyShowing = true"
            />
          </div>
          <p
            class="notify-content"
            v-if="group.groupNotifyList.length > 0"
          >{{group.groupNotifyList[0].content}}</p>
          <group-notify
            v-if="groupNotifyShowing"
            @clickAdd="addNotifyShowing = true"
            :showing.sync="groupNotifyShowing"
            :isManager="hasManageAuthority"
            :group="group"
          ></group-notify>
          <add-notify v-if="addNotifyShowing" :showing.sync="addNotifyShowing" :id="group.id"></add-notify>
        </div>

        <div class="set_item">
          <span>我在本群的昵称</span>
          <img class="set_item-img" src="../assets/more.svg" alt="设置" />
          <text-editor
            class="set_item-value set_item-editor"
            :text="myInfo.nameInGroup"
            :maxLength="FormLimit.Name"
            @onEdited="saveEditName"
            placeholder="点击设置"
          ></text-editor>
        </div>
        <div class="set_item">
          <span>置顶</span>
          <common-switch
            class="set_item-switch"
            v-model="group.isTop"
            @click.native="submitSwitchTop"
          ></common-switch>
        </div>
        <div class="set_item">
          <span>消息免打扰</span>
          <common-switch
            class="set_item-switch"
            v-model="group.muted"
            @click.native="submitSwitchMuted"
          ></common-switch>
        </div>
        <div v-if="hasManageAuthority" class="set_item">
          <span>加群限制</span>
          <img class="set_item-img" src="../assets/more.svg" alt="设置" />
          <div class="set_item-value set_item-value_mid">
            <span>{{joinOptions.find((item) => item.key === group.joinPermission).label}}</span>
          </div>
          <common-select
            class="set_item-select"
            v-model="group.joinPermission"
            :options="joinOptions"
            @changed="selectJoin"
          ></common-select>
        </div>
        <div v-if="hasManageAuthority" class="set_item">
          <span>加好友限制</span>
          <img class="set_item-img" src="../assets/more.svg" alt="设置" />
          <div class="set_item-value set_item-value_mid">
            <span>{{addOptions.find((item) => item.key === group.addFriendEnable).label}}</span>
          </div>
          <common-select
            class="set_item-select"
            v-model="group.addFriendEnable"
            :options="addOptions"
            @changed="selectAdd"
          ></common-select>
        </div>

        <!--禁言设置 -->
        <div v-if="hasManageAuthority" class="set_item">
          <span>禁言设置</span>
          <img class="set_item-img" src="../assets/more.svg" alt="设置" />
          <div class="set_item-value set_item-value_mid">
            <span>{{group | mutedSetLabel}}</span>
          </div>
          <common-select
            class="set_item-select"
            :options="mutedSetOptions"
            v-model="selectedMutedSet"
            :emitAnyway="true"
            @changed="selectMutedSet"
          ></common-select>
        </div>

        <!--禁言设置 -->
        <div v-if="hasManageAuthority" class="set_item">
          <span>新成员可查看历史记录</span>
          <common-switch
            class="set_item-switch"
            v-model="group.allowAllHistory"
            @click.native="submitSwitchRecord"
          ></common-switch>
        </div>

        <div class="member">
          <common-input class="member-search" @edited="searchMember"></common-input>
          <div class="member_wrapper">
            <div
              v-show="memberSearchQuery && memberList.length === 0"
              class="member_wrapper-placeholder"
            >暂无查询结果</div>
            <div class="member-item" v-show="hasAddAuthority && !memberSearchQuery">
              <img
                class="member-item-add"
                src="../assets/add_member.svg"
                alt="邀请"
                @click="showAddMember"
              />
              <div class="member-item-name">邀请</div>
            </div>
            <div class="member-item" v-show="hasManageAuthority && !memberSearchQuery">
              <img
                class="member-item-add"
                src="../assets/remove_member.svg"
                alt="移除"
                @click="showRemoveMember"
              />
              <div class="member-item-name">移除</div>
            </div>
            <div class="member-item" v-for="item in memberList" :key="item.id">
              <common-header
                class="member-item-header"
                :url="item.avatar"
                @click.native="showMemberInfo(item, $event)"
              ></common-header>
              <div class="member-item-name">{{getNameLabel(item)}}</div>
            </div>
          </div>
        </div>
      </vue-scroll>
    </div>
    <div
      v-show="myInfo.type !== MemberType.Owner"
      class="set_item set_item_exit"
      @click="exitShowing = true"
    >退出群聊</div>
    <div
      v-show="myInfo.type === MemberType.Owner"
      class="set_item set_item_exit"
      @click="deleteShowing = true"
    >解散群聊</div>
    <top-pop ref="addMemberPop">
      <friend-select
        :candidates="addMemberBindList"
        @onConfirm="confirmAddMember"
        @onCancel="cancelAddMember"
      ></friend-select>
    </top-pop>
    <top-pop ref="removeMemberProp">
      <friend-select
        :candidates="removeMembers"
        @onConfirm="confirmRemoveMember"
        @onCancel="cancelRemoveMember"
      ></friend-select>
    </top-pop>
    <confirm-dialog v-show="deleteShowing" @cancel="deleteShowing = false" @confirm="confirmDelete">
      <div>
        确定解散
        <span>{{this.group.name}}</span> 群吗？
      </div>
    </confirm-dialog>
    <confirm-dialog v-show="exitShowing" @cancel="exitShowing = false" @confirm="confirmExit">
      <div>
        退群通知仅群主和管理员可见，确定退出
        <span>{{this.group.name}}</span> 群吗？
      </div>
    </confirm-dialog>
    <!-- 禁言设置pop -->
    <focus-dialog :show.sync="mutedSetShowing">
      <muted-setter
        :group="group"
        @close="mutedSetShowing=false"
        :selectedMutedSet="selectedMutedSet"
        @onSaveMutedSet="handleSaveMutedSet"
      ></muted-setter>
    </focus-dialog>
    <!-- 成员信息弹窗 -->
    <right-dialog
      v-if="memberInfoShowing"
      :show.sync="memberInfoShowing"
      :mouseEvent="memberInfoEvent"
      width="440px"
    >
      <friend-dialog
        :user="memberInfoTarget"
        :chatTarget="group"
        @onClickBtn="memberInfoShowing=false"
      ></friend-dialog>
    </right-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Action, State } from "vuex-class";
import { GroupMember, UserLoggedInfo, MySocket } from "@/scripts/object";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import {
  AddFriendEnable,
  FOREVER_TIME,
  JoinGroupAuthority,
  MemberMutedSet,
  MemberType,
  Muted,
  MutedSet,
  RecordPermission,
  TopStatus
} from "@/config/const-enums";
import URLS from "@/config/urls";
import { FormLimit, SuccessMsg } from "@/config/config-enum";
import imageViewer from "@/plugins/ImageViewer/index";
import CommonInput from "@/components/common-input.vue";
import CommonSwitch from "@/components/common-switch.vue";
import CommonSelect from "@/components/common-select.vue";
import TextEditor from "@/components/text-editor.vue";
import TopPop from "@/components/top-pop.vue";
import FriendSelect from "@/components/friend-select.vue";
import ConfirmDialog from "@/components/confirm-dialog.vue";
import CommonHeader from "@/components/common-header.vue";
import HeaderUploader from "@/components/header-uploader.vue";
import RightDialog from "@/components/right-dialog.vue";
import FriendDialog from "@/views/infoViewers/friend-dialog.vue";
import GroupNotify from "@/views/group-notify.vue";
import AddNotify from "@/views/add-notify.vue";
import MutedSetter from "@/views/muted-set.vue";
import FocusDialog from "@/components/focus-dialog.vue";
import Cryptography from "@/object/targets/Cryptography";
import {
  EventType, Encrypt,
} from '@/config/const-enums';

@Component({
  components: {
    CommonInput,
    CommonSwitch,
    CommonSelect,
    TextEditor,
    TopPop,
    FriendSelect,
    ConfirmDialog,
    GroupNotify,
    AddNotify,
    MutedSetter,
    CommonHeader,
    HeaderUploader,
    RightDialog,
    FriendDialog,
    FocusDialog
  },
  filters: {
    mutedSetLabel(group: Group): string {
      switch (group.mutedSet) {
        case MutedSet.NoMuted:
          return "全员可发言";
        case MutedSet.AllMuted:
          return "全员禁言(除群主和管理员)";
        case MutedSet.BlackList: {
          let count = 0;
          group.memberList.forEach((item: GroupMember) => {
            if (item.memberMutedSet === MemberMutedSet.Black) {
              count += 1;
            }
          });
          return `${count}名成员已禁言`;
        }
        case MutedSet.WhiteList: {
          let count = 0;
          group.memberList.forEach((item: GroupMember) => {
            if (
              item.memberMutedSet === MemberMutedSet.White &&
              item.type === MemberType.Member
            ) {
              count += 1;
            }
          });
          return `${count}名成员可发言`;
        }
        default:
          return "异常";
      }
    }
  }
})
export default class GroupInfo extends Vue {
  @Prop() public group!: Group;
  @Prop() public friendList!: Friend[];
  @State("myInfo") public logUser!: UserLoggedInfo;
  @Action public deleteGroup!: (target: Group) => Promise<void>;
  @Action public quitGroup!: (target: Group) => Promise<void>;
  @State public socket!: MySocket | null;

  public crypto = new Cryptography();

  public MemberType = MemberType;
  public FormLimit = FormLimit;
  public MutedSet = MutedSet;
  public deleteShowing: boolean = false; // 解散群确认窗显示
  public exitShowing: boolean = false; // 退出群聊确认弹窗显示
  public groupNotifyShowing: boolean = false; // 查看群公告弹窗显示
  public addNotifyShowing: boolean = false; // 添加群公告弹窗显示
  public mutedSetShowing: boolean = false; // 群禁言设置弹窗
  public memberInfoShowing: boolean = false; // 成员信息弹窗显示
  public memberInfoTarget: Friend | UserLoggedInfo | null = null;
  public memberInfoEvent: MouseEvent | null = null;
  public selectedMutedSet: MutedSet = MutedSet.NoMuted; // 上次点击的禁言设置选项
  public memberSearchQuery: string = "";
  public joinOptions: any = [
    {
      label: "无需审批",
      tip: "加群无需群主或管理员同意",
      key: JoinGroupAuthority.Direct
    },
    {
      label: "需要审批",
      tip: "加群需要群主或管理员同意",
      key: JoinGroupAuthority.NeedApproval
    },
    {
      label: "禁止加群",
      tip: "除群主邀请外不允许任何人加群",
      key: JoinGroupAuthority.Forbidden
    }
  ];
  public addOptions: any = [
    {
      label: "可加好友",
      key: AddFriendEnable.Yes
    },
    {
      label: "禁止加好友",
      key: AddFriendEnable.No
    }
  ];
  public mutedSetOptions: any = [
    {
      label: "全员可发言",
      key: MutedSet.NoMuted
    },
    {
      label: "全员禁言(除群主和管理员)",
      key: MutedSet.AllMuted
    },
    {
      label: "设置发言名单(新成员默认禁言)",
      key: MutedSet.WhiteList
    },
    {
      label: "设置禁言名单(新成员默认发言)",
      key: MutedSet.BlackList
    }
  ];
  public alreadyGetAllMember: boolean = false;
  public imageViewer = imageViewer;

  public get memberList(): GroupMember[] {
    let list: GroupMember[] = this.group.memberList.filter(
      (item: GroupMember) => {
        // 默认全部，除可能不是成员
        return !item.mayNotMember;
      }
    );
    if (this.memberSearchQuery) {
      // 筛选
      list = this.group.memberList.filter((item: GroupMember) => {
        const namePass = item.name.indexOf(this.memberSearchQuery) > -1;
        const nameInGroupPass =
          item.nameInGroup.indexOf(this.memberSearchQuery) > -1;
        return namePass || nameInGroupPass;
      });
    }
    return list.sort((a: GroupMember, b: GroupMember) => {
      if (a.type !== b.type) {
        const map: any = new Map([
          [MemberType.Member, 1],
          [MemberType.Manager, 2],
          [MemberType.Owner, 3]
        ]);
        const aType = map.get(a.type);
        const bType = map.get(b.type);
        if (aType && bType) {
          return bType - aType; // b的成员等级大的优先
        }
        return 0;
      } else {
        return (b.nameInGroup || b.name) > (a.nameInGroup || a.name) ? -1 : 1; // 首字母排序
      }
    });
  }

  public get myInfo(): GroupMember {
    return (
      this.group.memberList.find(
        (item: GroupMember) => item.id === this.logUser.id
      ) || new GroupMember()
    );
  }

  // 我是否是群主或管理员
  public get hasManageAuthority(): boolean {
    return this.myInfo.type !== MemberType.Member;
  }

  // 是否有邀请权限（非禁止加群或是管理员/群主）
  public get hasAddAuthority(): boolean {
    return (
      this.group.joinPermission !== JoinGroupAuthority.Forbidden ||
      this.hasManageAuthority
    );
  }

  // 添加群成员，排除已经在群内的好友和临时会话
  public get addMemberBindList(): Friend[] {
    return this.friendList.filter((item: Friend) => {
      return (
        !item.isTemp &&
        !this.group.memberList.find(
          (m: GroupMember) => m.id === item.id && !m.mayNotMember
        )
      );
    });
  }

  // 删除成员候选（成员排除自己）
  public get removeMembers(): GroupMember[] {
    return this.group.memberList.filter(
      (item: GroupMember) => item.id !== this.myInfo.id && !item.mayNotMember
    );
  }

  // 搜索群成员
  public searchMember(val: string) {
    this.memberSearchQuery = val;
    if (val) {
      this.$nextTick(() => {
        if (this.memberList.length === 0) {
          // 如果本地搜索无结果
          this.group.searchMember(val);
        }
      });
    }
  }

  // 提交设置置顶
  public async submitSwitchTop() {
    const group = this.group;
    const data = await this.$post(URLS.SET_GROUP_TOP, {
      roomId: this.group.id,
      stickyOnTop: group.isTop ? TopStatus.Yes : TopStatus.No
    });
    if (!data) {
      group.isTop = !group.isTop; // 请求失败撤销内存修改
    }
  }

  // 提交设置免打扰
  public async submitSwitchMuted() {
    const group = this.group;
    const data = await this.$post(URLS.SET_GROUP_MUTED, {
      roomId: group.id,
      setNoDisturbing: group.muted ? Muted.YES : Muted.No
    });
    if (!data) {
      group.muted = !group.muted;
    }
  }

  public async selectJoin({ key, old }: any) {
    const group = this.group;
    const data = await this.$post(URLS.MANAGE_GROUP, {
      roomId: group.id,
      canAddFriend: group.addFriendEnable,
      joinPermission: key,
      recordPermission: group.allowAllHistory
        ? RecordPermission.All
        : RecordPermission.OnlyNew
    });
    if (!data) {
      group.joinPermission = old;
    }
  }

  public async selectAdd({ key, old }: any) {
    const group = this.group;
    const data = await this.$post(URLS.MANAGE_GROUP, {
      roomId: group.id,
      canAddFriend: key,
      joinPermission: group.joinPermission,
      recordPermission: group.allowAllHistory
        ? RecordPermission.All
        : RecordPermission.OnlyNew
    });
    if (!data) {
      group.joinPermission = old;
    }
  }

  public async selectMutedSet({ key, old }: any) {
    if (key === MutedSet.NoMuted || key === MutedSet.AllMuted) {
      if (key !== old) {
        const data = await this.submitMuted(key);
        if (data) {
          this.group.mutedSet = key;
          this.group.getMembers();
        }
      }
    } else {
      this.mutedSetShowing = true;
    }
  }

  /**
   * 提交切换新成员记录权限
   */
  public async submitSwitchRecord() {
    const group = this.group;
    const data = await this.$post(URLS.MANAGE_GROUP, {
      roomId: group.id,
      canAddFriend: group.addFriendEnable,
      joinPermission: group.joinPermission,
      recordPermission: group.allowAllHistory
        ? RecordPermission.All
        : RecordPermission.OnlyNew
    });
    if (!data) {
      group.allowAllHistory = !group.allowAllHistory;
    }
  }

  /**
   * 保存群名称
   */
  public async saveEditGroupName(val: string) {
    if (!val) {
      return;
    }
    const group = this.group;
    const backUp = group.name;
    group.name = val;
    const data = await this.$post(URLS.EDIT_GROUP_NAME, {
      roomId: group.id,
      name: val
    });
    if (!data) {
      group.name = backUp;
    }
  }

  public async saveEditName(val: string) {
    const backUp = this.myInfo.nameInGroup;
    this.myInfo.nameInGroup = val;
    const data = await this.$post(URLS.SET_MEMBER_NICKNAME, {
      roomId: this.group.id,
      nickname: val
    });
    if (!data) {
      this.myInfo.nameInGroup = backUp;
    }
  }

  public getNameLabel(member: GroupMember) {
    const friendExist = this.friendList.find(
      (item: Friend) => item.id === member.id
    );
    let remark = "";
    if (friendExist) {
      remark = (friendExist as Friend).remark;
    }
    return remark || member.nameInGroup || member.name;
  }

  /**
   * 点击头像成员信息弹窗
   */
  public showMemberInfo(member: GroupMember, e: MouseEvent) {
    let result = null;
    if (member.id === this.logUser.id) {
      result = this.logUser;
    } else {
      const friendExist = this.friendList.find(item => item.id === member.id);
      if (friendExist) {
        result = friendExist;
      } else {
        result = new Friend({
          id: member.id,
          name: member.name,
          avatar: member.avatar
        });
        result.isTemp = true;
      }
      if (!result.uid) {
        // 非好友时未保存uid
        this.setUserUID(result);
      }
    }
    this.memberInfoEvent = e;
    this.memberInfoShowing = true;
    this.memberInfoTarget = result;
  }

  public showAddMember() {
    const pop: any = this.$refs.addMemberPop;
    pop.showPop();
    this.loadAllMembers(); // 需要用于筛选好友
  }
  //确定添加成员
  public async confirmAddMember(ids: any[]) {
    const group: Group = this.group;
    const data = await this.$post(URLS.INVITE_JOIN_GROUP, {
      roomId: group.id,
      users: ids[0]
    });
    let groupmenberKeyObj:Array<Object> = [];
     this.group.memberList.forEach((item)=>{
      if(item.id !== this.myInfo.id){
        groupmenberKeyObj.push({userId:item.id,key:item.publicKey});
      }
    });
    if (data) {
      const publicKey = await this.crypto.getPublicKey();
      const secret = await this.getGroupSecretKeys([...groupmenberKeyObj,...ids[1]], publicKey); //arr[1]:群成员id和公钥的 对象列表
      const groupSessionObj = {
        eventType: EventType.ActiveChangeGroupKey,
        roomId: group.id,
        fromKey: publicKey,
        secret: secret
      };
      const socket = this.socket as MySocket;
      socket.sendGroupKey(groupSessionObj);

      group.getMembers(); // 添加后刷新群成员列表
      this.$notify.success(SuccessMsg.ADD_MEMBER);
      this.cancelAddMember();
    }
  }

  public async getGroupSecretKeys(menberlist: any[],myPublicKey:string) {
    menberlist.unshift({userId:this.myInfo.id,key:myPublicKey}); 
    console.log(menberlist);
    return await this.crypto.generateGroupSecretKeys(menberlist);
  }

  public showRemoveMember() {
    const pop: any = this.$refs.removeMemberProp;
    pop.showPop();
    this.loadAllMembers();
  }
  //确认移除
  public async confirmRemoveMember(ids: string[]) {
    const data = await this.$post(URLS.DELETE_GROUP_MEMBER, {
      roomId: this.group.id,
      users: ids[0]
    });
    if (data) {
      // 成员列表移除已删除的成员
      this.group.memberList = this.group.memberList.filter(
        (item: GroupMember) => ids.indexOf(item.id) === -1
      );
      this.$notify.success(SuccessMsg.DELETE_MEMBER);
      this.cancelRemoveMember();
    }
  }

  /**
   * 解散群
   */
  public async confirmDelete() {
    this.deleteShowing = false;
    this.deleteGroup(this.group);
  }

  /**
   * 退出群
   */
  public async confirmExit() {
    // todo 提出退群
    this.exitShowing = false;
    this.quitGroup(this.group);
  }

  /**
   * 无公告时管理员点击整行都可弹出添加公告
   */
  public sendWhenEmpty(): void {
    if (this.hasManageAuthority && this.group.groupNotifyList.length === 0) {
      this.addNotifyShowing = true;
    }
  }

  /**
   * 点击显示全部群公告弹窗
   */
  public showMoreNotify(): void {
    this.groupNotifyShowing = true;
  }

  /**
   * 提交编辑白名单或黑名单，并更新本地数据
   */
  public async handleSaveMutedSet({ selectedList, time }: any): Promise<void> {
    const data = await this.submitMuted(
      this.selectedMutedSet,
      selectedList,
      time
    );
    if (data) {
      this.group.mutedSet = this.selectedMutedSet; // 确定后修改群的设置
      this.mutedSetShowing = false;
      this.group.getMembers();
    }
  }

  /**
   * 获取uid
   */
  private async setUserUID(target: Friend): Promise<void> {
    const data = await this.$post(URLS.GET_USER_INFO, { id: target.id });
    if (data) {
      target.uid = data.uid;
    }
  }

  // 加载全部群成员
  private loadAllMembers() {
    if (!this.alreadyGetAllMember) {
      // 每次打开该信息栏只请求一次全部成员
      this.group.getMembers();
      this.alreadyGetAllMember = true;
    }
  }

  private cancelAddMember() {
    const pop: any = this.$refs.addMemberPop;
    pop.hindPop();
  }

  // 关闭pop hindRemovePop
  private cancelRemoveMember() {
    const pop: any = this.$refs.removeMemberProp;
    pop.hindPop();
  }

  /**
   * 设置群禁言
   */
  private submitMuted(
    type: MutedSet,
    users: string[] = [],
    time: number = 0
  ): Promise<any> {
    const param = {
      roomId: this.group.id,
      listType: type,
      users,
      deadline: time === FOREVER_TIME ? FOREVER_TIME : Date.now() + time
    };
    return this.$post(URLS.SET_MUTED_LIST, param);
  }

  private created() {
    
    // 刷新群信息
    this.group.memberList.forEach((item: GroupMember) => {
      // 成员可能已被移除
      item.mayNotMember = true;
    });
    this.group.getGroupDetail(); // 每次显示刷新群信息
    this.group.getMembers();
    this.selectedMutedSet = this.group.mutedSet;
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.group_info {
  display: flex;
  flex-direction: column;
  width: 284px;
  height: 100%;
}

.content_wrapper {
  flex: 1;
  overflow: auto;
}

.info {
  padding: 18px 20px;
  height: calc(80px - 18px - 18px);
  border-bottom: var(--common-border);
}

.info-header {
  float: left;
  margin-right: 12px;
  width: 44px;
  height: 44px;
}

.info-share {
  float: right;
  line-height: 44px;
  font-size: 11px;
  color: var(--icon-active-color);
  cursor: pointer;
}

.info-name_wrapper {
  height: 20px;
}

.info-name {
  font-size: var(--normal-font-size);
  color: var(--font-color-dark);
  line-height: 20px;
  max-width: 166px;
}

.info-id {
  margin-top: 6px;
  font-size: 12px;
  color: var(--font-color-light);
  line-height: 17px;
}

.notify {
  padding: 0 20px;
  border-bottom: var(--common-border);
}

.notify-title_wrapper {
  line-height: 32px;
  color: var(--font-color-light);
  font-size: var(--small-font-size);
}

.notify-more {
  float: right;
  margin: 8px 0 0 10px;
}

.notify-count {
  float: right;
}

.notify-title {
  display: inline-block;
  margin: 0;
  font-weight: 400;
  font-size: var(--small-font-size);
}

.notify-add {
  margin: 9px 0 0 9px;
  vertical-align: top;
  line-height: 14px;
  cursor: pointer;
}

.notify-content {
  margin: 10px 0;
  font-size: var(--normal-font-size);
  font-weight: 400;
  line-height: 20px;
  word-break: break-word;
}

.member {
  padding: 20px 4px 0 20px;
  text-align: left;
}

.member-search {
  width: 244px;
}

.member_wrapper {
  padding: 16px 0 0 2px;
  text-align: left;
}

.member_wrapper-placeholder {
  text-align: center;
  color: var(--font-color-light);
  line-height: 40px;
}

.member-item {
  text-align: center;
  display: inline-block;
  vertical-align: top;
  margin-right: 14px;
  margin-bottom: 20px;
  width: 49px;
  font-size: 0;
}

.member-item-add {
  cursor: pointer;
}

.member-item-header {
  width: 44px;
  height: 44px;
}

.member-item-name {
  margin: 10px auto 0;
  font-size: var(--small-font-size);
  line-height: 17px;
  text-align: center;
  color: var(--font-color-dark);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.set_item {
  position: relative;
  padding: 0 20px;
  line-height: 48px;
  border-bottom: var(--common-border);
  color: var(--font-color-light);
}

.set_item-select {
  z-index: 2;
  position: absolute;
  top: 40px;
  right: 20px;
}

.set_item-value {
  float: right;
  color: var(--font-color-dark);
}

.set_item-editor {
  max-width: 120px;
  text-align: right;
}

.set_item-switch {
  float: right;
  margin-top: 15px;
  margin-right: 4px;
}

.set_item-value_mid {
  float: right;
  height: 100%;
  max-width: 102px;
  line-height: 48px;

  & > span {
    display: inline-block;
    vertical-align: middle;
    line-height: 16px;
  }
}

.set_item-img {
  margin: 17px 0 0 10px;
  float: right;
}

.set_item_exit {
  color: var(--font-color-red);
  background: #fff;
  text-align: center;
  cursor: pointer;
  border-top: var(--common-border);
}

.tool_click {
  cursor: pointer;
}
</style>
