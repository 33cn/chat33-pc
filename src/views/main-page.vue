<!--
  @Author: yuanzeyu
  @Date: 2018/9/26
  @Desc: 聊天根组件
-->
<template>
  <div class="main_page" id="main_page">
    <page-menu></page-menu>
    <div class="main">
      <keep-alive>
        <router-view></router-view>
      </keep-alive>
    </div>
    <!-- 编辑昵称弹窗（首次登录）-->
    <edit-name v-if="editNameShowing" :showing.sync="editNameShowing"></edit-name>
    <!-- 转发目标选择弹窗(作为发送普通消息) -->
    <focus-dialog class="relay-dialog" :show.sync="relaySelectorShowing">
      <relay-selector
        :isManuelRelay="true"
        @onSelected="relayAsSend"
        @onClose="relaySelectorShowing=false"
      ></relay-selector>
    </focus-dialog>
    <guide-page
      :type="guideWindowType"
      :canClose="false"
      :class-name="importStyleObject"
      :show.sync="guideVisible"
      :closeLayer="true"
    ></guide-page>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { ipcRenderer } from "electron";
import { Getter, Mutation, State, Action } from "vuex-class";
import { Route } from "vue-router";
import { ImageMsgApi, MySocket, UserLoggedInfo } from "@/scripts/object";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import Bus from "@/scripts/bus";
import {
  ChannelType,
  MemberType,
  Muted,
  QuitReasonType,
  TopStatus,
  Usage,
  CheckedMnc,
  MsgDetailType
} from "@/config/const-enums";
import {
  LocalStorageUsage,
  SocketEvent,
  TableName
} from "@/config/config-enum";
import { RouterName } from "@/config/type";
import { ApiMsg } from "@/config/apiTypings";
import URLS from "@/config/urls";
import FocusDialog from "@/components/focus-dialog.vue";
import RelaySelector from "@/views/relay-selector.vue";
import PageMenu from "@/views/page-menu.vue";
import MnemonicImport from "@/views/mnemonic-import.vue";
import EditName from "./edit-name.vue";
import FileMsg from "@/object/messages/FileMsg";
import RelayFileMsg from "@/object/messages/singleRelay/RelayFileMsg";
import ImageMsg from "@/object/messages/ImageMsg";
import { Socket } from "net";
import Datasource from "@/scripts/data-source";
import AccountDao from "@/scripts/account-dao";
import MsgExDao from "@/scripts/msgEx-dao";
import GroupKeyDao from "@/scripts/groupKey-dao";
import Cryptography from "@/object/targets/Cryptography";
import GuidePage from "@/components/guide-page.vue";
import {
  toStandardHex,
  updateLatestMsgTime,
  updateLatestGroupKeyTime
} from "@/utils/tool";
import {
  generateSessionKey,
  encryptSymmetric,
  dencryptSymmetric,
  local2ApiMsg,
  isJsonString,
  checkRate
} from "@/utils/tool";
import { ApplyItem, ApplyList } from "../config/apiTypings";

@Component({
  components: {
    EditName,
    FocusDialog,
    RelaySelector,
    PageMenu,
    MnemonicImport,
    GuidePage
  }
})
export default class MainPage extends Vue {
  @State public isReg!: boolean;
  @State public myInfo!: UserLoggedInfo;
  @State public groupList!: Group[];
  @State public friendList!: Friend[];
  @State public socket!: MySocket | null;
  @State public notifyEnable!: boolean;
  @State public datasource!: Datasource;
  @Getter public groupListNoTemp!: Group[];
  @Getter public friendListNoTemp!: Friend[];
  @Mutation public setGroupList!: (groupList: Group[]) => void;
  @Mutation public setFriendList!: (friendList: Friend[]) => void;
  @Mutation public clearStore!: () => {};
  @Mutation public setSocket!: (socket: MySocket) => void;
  @Mutation public removeTarget!: (target: Group | Friend) => void;
  @Mutation public setNotifyEnable!: (enable: boolean) => void;
  @Mutation public setApplyCount!: (count: number) => void;
  @Mutation public setGroupBanTime!: (param: any) => void;
  @Action public addFriendById!: (id: string) => void;

  public applies: ApplyItem[] = [];
  public editNameShowing: boolean = false; // 显示编辑昵称弹窗（首次登录）
  public relaySelectorShowing: boolean = false; // 转发对象选择框显示
  public guideVisible: boolean = false; //助剂词导航弹窗
  public relayPictureSrc: string = ""; // 选中的要转发的图片
  public guideWindowType: string = "enter"; //密码导航弹窗类型
  public accountDao!: AccountDao;
  public msgExDao!: MsgExDao;
  public groupKeyDao!: GroupKeyDao;
  public importStyleObject: Object = { width: "840px", height: "600px" };
  public cryptoInstance: Cryptography = new Cryptography();
  /**
   * 将图片发送给选定的聊天对象
   */
  public relayAsSend({ selectedGroupIds, selectedFriendIds }: any) {
    selectedFriendIds.forEach((item: string) => {
      this.sendPictureMsg(item, false, this.relayPictureSrc);
    });
    selectedGroupIds.forEach((item: string) => {
      this.sendPictureMsg(item, true, this.relayPictureSrc);
    });
  }

  /**
   * 发送图片消息
   */
  private sendPictureMsg(targetId: string, isGroup: boolean, src: string) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const picture: ImageMsgApi = {
        url: src,
        height: img.height,
        width: img.width
      };
      if (this.socket) {
        this.socket.sendChatMsg({
          channel: isGroup ? ChannelType.Group : ChannelType.Friend,
          targetId,
          msg: new ImageMsg({
            id: "",
            msgId: "",
            sendTime: Date.now(),
            senderId: this.myInfo.id,
            receiverId: targetId,
            sender: this.myInfo,
            isSendByMe: true,
            url: picture.url,
            height: picture.height,
            width: picture.width
          }),
          aitList:[],
          isSnap: false,
          failCb: failMsg => {
            this.$notify.fail(`发送失败:${failMsg}`);
          }
        });
      }
    };
  }

  /**
   * 加载群列表，每个群从本地数据库加载一次聊天记录
   */
  private async getGroupList(): Promise<boolean> {
    const data = await this.$post(URLS.GET_GROUP_LIST, { type: Usage.All });
    if (data) {
      const groupList = data.roomList.map(
        (item: any) =>
          new Group(
            Object.assign({}, item, {
              muted: item.noDisturbing === Muted.YES,
              isTop: item.onTop === TopStatus.Yes,
              me: this.myInfo,
              banEndTime: item.disableDeadline
            })
          )
      );
      this.setGroupList(groupList);
      const pms: any[] = [];
      this.groupList.forEach((item: Group) => {
        pms.push(item.loadMsgHistory());
      });
      await Promise.all(pms);
      return true;
    }
    return false;
  }

  /**
   * 加载好友列表，每个好友从本地数据库加载一次聊天记录
   */
  private async getFriendList(): Promise<boolean> {
    const data = await this.$post(URLS.GET_FRIEND_LIST, {
      type: Usage.All,
      time: 0 // 用于增量查询，暂时不支持
    });
    if (data) {
      const friendList = data.userList.map((item: any) => {
        return new Friend(
          Object.assign({}, item, {
            isTop: item.onTop === TopStatus.Yes,
            often: item.commonlyUsed === Usage.Often,
            muted: item.noDisturbing === Muted.YES,
            me: this.myInfo
          })
        );
      });
      this.setFriendList(friendList);
      const pms: any[] = [];
      this.friendList.forEach((item: Friend) => {
        pms.push(item.loadMsgHistory());
      });
      Promise.all(pms).then(() => {
        return true;
      });
    }
    return false;
  }

  // 加载好友列表相关
  private async loadFriendList(): Promise<void> {
    await this.getFriendList();
  }

  // 加载群列表相关
  private async loadGroupList(): Promise<void> {
    const success = await this.getGroupList();
    if (success) {
      Bus.$emit("onGroupsLoaded");
    }
  }

  /**
   * 初始化WebsSocket事件
   */
  private initSocket(): void {
    const socket = this.socket as MySocket;
    // 加入了群
    socket.listen(SocketEvent.JoinNewGroup, (groupId: string) => {
      const newGroup = new Group({ id: groupId });
      newGroup.getGroupDetail().then(() => {
        if (newGroup.myLevel === MemberType.Owner) {
          // 如果新加的群是自己创建的，则自动打开聊天
          this.$router.push(RouterName.Chat);
          Bus.$emit("directJoinGroup", newGroup.id);
        }
      });
      this.groupList.push(newGroup);
      Bus.$emit("onAddGroup", newGroup);
    });
    // 退出了群
    socket.listen(
      SocketEvent.RemoveGroup,
      (groupId: string, quitReason: QuitReasonType) => {
        this.removeGroup(groupId, quitReason === QuitReasonType.ByOther);
      }
    );
    // 群解散了
    socket.listen(
      SocketEvent.DeleteGroup,
      (groupId: string, userId: string) => {
        this.removeGroup(groupId, userId !== this.myInfo.id); // 不是我解散的则设为临时会话
      }
    );
    // 删除或被删除了好友
    socket.listen(
      SocketEvent.DeleteFriend,
      (receiverId: string, senderId: string) => {
        if (senderId === this.myInfo.id) {
          // 是我主动删除
          this.removeFriend(receiverId);
        } else {
          this.removeFriend(senderId, true); // 被删除保留临时会话
        }
      }
    );
    // 更新群在线人数
    socket.listen(
      SocketEvent.GroupOnlineCount,
      (groupId: string, count: number) => {
        const group = this.groupList.find((item: Group) => item.id === groupId);
        if (group) {
          group.onlineCount = count;
        }
      }
    );
    // 其他端登录
    socket.listen(SocketEvent.LogOff, (msg: string) => {
      this.clearStore();
      this.$router.push({
        name: RouterName.Login,
        params: {
          message: msg
        }
      });
    });
    socket.listen(SocketEvent.AddApply, (apply: ApplyItem) => {
      this.addApply(apply);
    });
    // 接受到聊天消息
    socket.listen(SocketEvent.ChatMsg, async (apiMsg: ApiMsg) => {
      if (!socket.isSyncing) {
        // 正在同步中不更新最新时间，下次同步时从同步失败的点开始同步
        updateLatestMsgTime(this.myInfo.id, apiMsg.datetime);
      }
      const senderId = apiMsg.fromId; // [api]
      const target = this.getMsgTarget(apiMsg);
      if (target) {
        const theTarget = target as Friend | Group;
        const newMsg = await theTarget.onReceiveChatMsg(
          apiMsg,
          this.notifyEnable && ipcRenderer.sendSync("onSocketMsg")
        );
        if (newMsg instanceof Object) {
          // 通知消息页增加未读计数
          Bus.$emit("onLoadChatMsg", {
            // todo 整理
            target: theTarget,
            senderId,
            countUnread: true,
            message: newMsg
          });
          // 通知聊天组件滚动
          Bus.$emit("onChatMsg", { targetId: target.id, message: newMsg });
          if (newMsg instanceof FileMsg) {
            // 是文件消息或阅后即焚文件消息
            Bus.$emit("onReceiveFileMsg", target);
          }
        }
      } else {
        // 收到消息本地无该目标：创建该用户并请求信息 todo 整理,获取该用户信息
        let newTarget: Group | Friend | null = null;
        if (apiMsg.channelType === ChannelType.Friend) {
          const data = await this.$post(URLS.GET_USER_INFO, {
            id:
              apiMsg.fromId === this.myInfo.id ? apiMsg.targetId : apiMsg.fromId
          });
          if (data) {
            const friend = new Friend({
              id: apiMsg.fromId,
              name: apiMsg.senderInfo.nickname,
              avatar: apiMsg.senderInfo.avatar,
              uid: data.uid,
              me: this.myInfo,
              isTemp: true
            });
            if (apiMsg.msg.type !== MsgDetailType.GroupKeyChanged) {
              this.friendList.push(friend);
            }
            newTarget = friend;
          }
        } else {
          const group = new Group({ id: apiMsg.targetId });
          group.me = this.myInfo;
          group.isTemp = true;
          await group.getGroupDetail();
          this.groupList.push(group);
          newTarget = group;
        }
        if (!newTarget) return;
        const newMsg = await newTarget.onReceiveChatMsg(
          apiMsg,
          this.notifyEnable && ipcRenderer.sendSync("onSocketMsg")
        );
        if (newMsg && apiMsg.msg.type !== MsgDetailType.GroupKeyChanged) {
          this.$nextTick(() => {
            Bus.$emit("onLoadChatMsg", {
              // todo 整理
              target: newTarget,
              senderId: apiMsg.fromId,
              countUnread: true,
              message: newMsg
            });
          });
        }
      }
    });
    /**
     * 更新用户的公钥
     */
    socket.listen(SocketEvent.ChangePublicKey, (data: any) => {
      this.friendList.forEach((friend: Friend) => {
        if ((data.userId = friend.id)) {
          friend.publicKey = data.publicKey;
        }
      });
    });
    /*
     接受到批量消息
     */
    socket.listen(
      SocketEvent.MultiMsg,
      async (apiMsgList: ApiMsg[], isUnread: boolean) => {
        // todo 后期优化为vuex
        const targetIdList: string[] = [];
        const _this = this;

        await (async function loop() {
          for (let i = 0; i < apiMsgList.length; i++) {
            let apiMsg: ApiMsg = apiMsgList[i];
            const senderId = apiMsg.fromId;
            const target = _this.getMsgTarget(apiMsg);
            if (target) {
              const theTarget = target as Friend | Group;
              targetIdList.push(theTarget.id);
              const msg = await theTarget.onReceiveChatMsg(apiMsg, false);
              if (msg && msg !== "success") {
                Bus.$emit("onLoadChatMsg", {
                  // todo 整理 优化
                  target: theTarget,
                  senderId,
                  countUnread: isUnread,
                  message: msg
                });
              }
            } else {
              //不是好友的消息
              if (
                apiMsg.msg.type === MsgDetailType.GroupKeyChanged &&
                apiMsg.targetId !== _this.myInfo.id
              )
                continue; //过滤掉不是发给自己的更新密钥消息
              let newTarget: Group | Friend | null = null;
              if (apiMsg.channelType === ChannelType.Friend) {
                const data = await _this.$post(URLS.GET_USER_INFO, {
                  id:
                    apiMsg.fromId === _this.myInfo.id
                      ? apiMsg.targetId
                      : apiMsg.fromId
                });
                if (data) {
                  const friend = new Friend({
                    id: apiMsg.fromId,
                    name: apiMsg.senderInfo.nickname,
                    avatar: apiMsg.senderInfo.avatar,
                    uid: data.uid,
                    me: _this.myInfo,
                    isTemp: true
                  });
                  if (apiMsg.msg.type !== MsgDetailType.GroupKeyChanged) {
                    _this.friendList.push(friend);
                  }
                  newTarget = friend;
                }
              } else {
                const group = new Group({ id: apiMsg.targetId });
                group.me = _this.myInfo;
                group.isTemp = true;
                group.getGroupDetail();
                _this.groupList.push(group);
                newTarget = group;
              }
              if(!newTarget) return;
              const newMsg = await newTarget.onReceiveChatMsg(
                apiMsg,
                _this.notifyEnable && ipcRenderer.sendSync("onSocketMsg")
              );
              if (newMsg && apiMsg.msg.type !== MsgDetailType.GroupKeyChanged) {
                _this.$nextTick(() => {
                  Bus.$emit("onLoadChatMsg", {
                    // todo 整理
                    target: newTarget,
                    senderId: apiMsg.fromId,
                    countUnread: true,
                    message: newMsg
                  });
                });
              }
            }
          }
        })();

        Bus.$emit("onMultiChatMsg", targetIdList);
        if (apiMsgList.length > 0) {
          // 批量推送最新消息时间存住
          updateLatestMsgTime(this.myInfo.id, apiMsgList.slice(-1)[0].datetime);
        }
      }
    );
    // 禁言、解除禁言通知
    socket.listen(SocketEvent.MutedGroup, (groupId: string) => {
      const group = this.groupList.find((item: Group) => item.id === groupId);
      if (group) {
        group.getGroupDetail();
      }
    });
    socket.listen(SocketEvent.BanUser, (endTime: number) => {
      this.clearStore();
      this.$router.push({
        name: RouterName.Login,
        params: {
          banEndTime: String(endTime)
        }
      });
    });
    // 封群
    socket.listen(SocketEvent.BanGroup, (groupId: string, endTime: number) => {
      this.setGroupBanTime({
        groupId,
        endTime
      });
    });
    //同步群会话密钥
    socket.listen(SocketEvent.OnSyncGroupKey, (keyList: any[]) => {
      keyList.forEach(async msg => {
        const formKey = msg.msg.fromKey;
        const encryptedKey = msg.msg.key;

        const privateKey = await this.cryptoInstance.getPrivateKey();
        const sessionKey = generateSessionKey(privateKey, formKey);
        const groupKey = dencryptSymmetric(sessionKey, encryptedKey); //解密群密钥
        if (checkRate(groupKey)) {
          await this.groupKeyDao.InsertOneRow(msg, groupKey);
        }
      });
      if (keyList.length > 0) {
        updateLatestGroupKeyTime(this.myInfo.id, keyList.slice(-1)[0].datetime);
      }
    });
    //同步群密钥成功
    socket.listen(SocketEvent.SyncGroupKeySuccess, () => {
      updateLatestGroupKeyTime(this.myInfo.id, 0);
    });
    socket.init();
    socket.myInfo = this.myInfo;
    socket.logback = this.logout;
  }

  public logout() {
    this.clearStore();
    Datasource.removeInstance(); //销毁数据库单例
    this.$router.push(RouterName.Login);
  }

  /**
   * 获取聊天消息输入的会话对象
   * @param apiMsg 消息（接口）
   */
  private getMsgTarget(apiMsg: any): Friend | Group | null {
    const isFriendMsg: boolean = apiMsg.channelType === ChannelType.Friend;
    const targetList: Array<Friend | Group> = isFriendMsg
      ? this.friendList
      : this.groupList;
    let targetId = apiMsg.targetId; // [api]
    if (isFriendMsg) {
      targetId =
        apiMsg.fromId === this.myInfo.id ? apiMsg.targetId : apiMsg.fromId; // 自己的消息目标为targetId
    }
    return (
      targetList.find((item: Friend | Group) => item.id === targetId) || null
    );
  }

  /**
   * 初始化Bus事件
   */
  private InitBusEvent() {
    // 联系人信息组件点击发送消息：切换到消息页
    Bus.$on("onTrySendMsg", (target: Friend | Group) => {
      target.ready4Send = true;
      this.$router.push(RouterName.Chat);
    });
    Bus.$on("onOpenChat", () => {
      this.$router.push(RouterName.Contact);
    });
    // 点击转发图片
    Bus.$on("onRelayPicture", (src: string) => {
      this.relayPictureSrc = src;
      this.relaySelectorShowing = true;
    });
    //注册socket初始化
    Bus.$on("onInitSocket", () => {
      if (this.myInfo.isFirstLogin) {
        this.editNameShowing = true;
      }
      this.initSocket(); // 连接socket
    });
  }

  private clearBusEvent() {
    Bus.$off("onTrySendMsg");
    Bus.$off("onOpenChat");
    Bus.$off("onRelayPicture");
    Bus.$off("onInitSocket");
  }

  /**
   * 初始化，加载各数据
   */
  private async init() {
    this.InitBusEvent(); // 初始化Bus事件
    this.initElectronEvent();
    this.setSocket(new MySocket(URLS.SOCKET_URL)); // 创建mysocket对象
    this.getUnreadApplyCount();
    const localSet =
      localStorage.getItem(`notifyEnable-${this.myInfo.id}`) !== "false"; // 登录后获取该用户保存的设置
    this.setNotifyEnable(localSet);
    await this.createTables(); //创建数据库必须同步执行
    await this.syncNumenicWord(); //同步助记词
    await this.messageList();
  }
  /**
   * 创建表
   */
  public async createTables(): Promise<void> {
    this.accountDao = new AccountDao(this.datasource);
    this.msgExDao = new MsgExDao(this.datasource);
    this.groupKeyDao = new GroupKeyDao(this.datasource);

    const creatingPromises: Promise<void>[] = [
      this.accountDao.createTable(),
      this.msgExDao.createFriendMsgTable(),
      this.msgExDao.createGroupMsgTable(),
      this.groupKeyDao.createGroupKeyTable()
    ];
    await Promise.all(creatingPromises);

    const updatePromises: Promise<void>[] = [
      this.accountDao.updateAccountTable(),
      this.msgExDao.updateLocalDb(TableName.FriendChatLog),
      this.msgExDao.updateLocalDb(TableName.GroupChatLog),
      this.groupKeyDao.UpdateGroupKeyTable()
    ];
    await Promise.all(updatePromises);
  }
  /**
   * 同步消息列表
   */
  public async messageList(): Promise<void> {
    //先初始化本地数据库以避免异常
    const pms = [this.loadFriendList(), this.loadGroupList()];
    await Promise.all(pms);
  }
  /**
   * 同步助记词
   */
  public async syncNumenicWord(): Promise<void> {
    const localWord = await this.cryptoInstance.getMnunomic();
    const result = this.checkMnemonic(
      toStandardHex(this.myInfo.privateKey),
      localWord
    );
    if (result === CheckedMnc.ALLYES) {
      const isSame = this.compareMnemonic(
        toStandardHex(this.myInfo.privateKey),
        localWord
      );
      if (isSame) {
        this.initSocket();
        return;
      } else {
        this.guideVisible = true;
        this.guideWindowType = "remoteExist";
      }
    } else if (result === CheckedMnc.NOTLOCAL) {
      this.guideVisible = true;
      this.guideWindowType = "remoteExist";
    } else if (result === CheckedMnc.NOTREMOTE) {
      this.guideVisible = true;
      this.guideWindowType = "remoteAbsent";
    } else if (result === CheckedMnc.ALLNOT) {
      this.guideVisible = true;
      this.guideWindowType = "set";
    }
  }
  async hasPassword(): Promise<boolean> {
    const password = await this.cryptoInstance.getPassword();
    return password ? true : false;
  }
  /**
   * 加入新申请（有则更新无则新增）
   * @param apply
   */
  private addApply(apply: ApplyItem) {
    const existIndex = this.applies.findIndex(item => item.id === apply.id);
    if (existIndex > -1) {
      // 已存在则更新
      this.applies.splice(existIndex, 1, apply);
    } else {
      this.applies.push(apply);
    }
  }
  checkMnemonic(remoteWord: string, localWord: string): any {
    if (remoteWord && localWord) {
      return CheckedMnc.ALLYES;
    } else if (remoteWord && !localWord) {
      return CheckedMnc.NOTLOCAL;
    } else if (!remoteWord && localWord) {
      return CheckedMnc.NOTREMOTE;
    } else if (!remoteWord && !localWord) {
      return CheckedMnc.ALLNOT;
    }
  }
  compareMnemonic(remoteWord: string, localWord: string): any {
    return remoteWord == localWord;
  }

  /**
   * 加载未读申请数
   */
  private async getUnreadApplyCount() {
    const data = await this.$post(URLS.GET_APPLY_COUNT);
    if (data) {
      this.setApplyCount(data.number);
    }
  }
  /**
   * 移除群
   * @param id 群id
   * @param setTemp 是否保留临时会话
   */
  private removeGroup(id: string, setTemp: boolean = false) {
    const group = this.groupList.find((item: Group) => item.id === id);
    if (group) {
      if (setTemp) {
        group.isTemp = true;
      } else {
        this.removeTarget(group);
      }
    }
  }
  /**
   * 移除好友
   * @param id 移除的好友id
   * @param setTemp 是否保留临时会话
   */
  private removeFriend(id: string, setTemp: boolean = false) {
    const friend = this.friendList.find((item: Friend) => item.id === id);
    if (friend) {
      if (setTemp) {
        friend.isTemp = true;
      } else {
        this.removeTarget(friend);
      }
    }
  }
  // life cycle
  private async created() {
    this.submitStartLog();
    await this.init();
  }

  private beforeDestroy() {
    this.clearBusEvent();
    this.clearElectronEvent();
  }

  private beforeRouteEnter(to: Route, from: Route, next: any): void {
    next(() => {
      ipcRenderer.send("resize-window"); // 登录进入该页面调到大窗口
    });
  }

  private initElectronEvent() {
    ipcRenderer.on("on-window-focus", () => {
      this.submitStartLog();
    });
    ipcRenderer.on("save-to-dir-fail", () => {
      this.$notify.fail("另存失败");
    });
  }

  private clearElectronEvent() {
    ipcRenderer.removeAllListeners("on-window-focus");
    ipcRenderer.removeAllListeners("save-to-dir-fail");
  }
  /**
   * 记录一次启动埋点
   */
  private submitStartLog() {
    this.$post(URLS.START_LOG);
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.main_page {
  display: flex;
  height: 100vh;
}

.bar {
  /* position:fixed; */
  /* flex-shrink: 0; */
}

.main {
  margin-left: calc(var(--left-bar-width) - 4px);
  flex: 1;
}

.relay-dialog {
  z-index: 10000;
}
</style>
