<!--
  @Author: yuanzeyu
  @Date: 2018/10/8
  @Desc: 搜索和添加 todo 优化搜索组件，将添加等提出
-->
<template>
  <div class="search g-tool-drag" :class="{'search_top':searchQuery}" @click.stop>
    <common-input class="input g-tool-no_drag" v-model="searchQuery"></common-input>
    <img
      class="icon_add g-tool-no_drag"
      src="../assets/add-box.svg"
      alt="添加"
      @click="showAddSelect"
    />

    <!-- 添加好友/群 -->
    <top-pop ref="addPop">
      <add-pop @close="closePop" />
    </top-pop>

    <!-- 列表搜索 -->
    <div class="search_result" v-show="searchQuery">
      <vue-scroll>
        <div v-if="friendResult.length+groupResult.length===0" class="add_pop-empty">
          <img class="add_pop-empty-img" src="../assets/no-result.svg" alt="没有匹配的对象" />
          <div class="add_pop-empty-label">没有匹配的对象</div>
        </div>
        <template v-else>
          <div class="search_result-label" v-show="friendResult.length > 0">联系人</div>
          <div
            class="g-menu-list-item"
            :class="{'menu-list-item_active': false}"
            v-for="item in friendResult"
            @click="selectSearchTarget(item)"
            :key="item.id"
          >
            <img class="g-menu-list-item-header" :src="item.avatar" alt="头像" />
            <span>{{item.name}}</span>
          </div>
          <div class="search_result-label" v-show="groupResult.length > 0">群聊</div>
          <div
            class="g-menu-list-item"
            :class="{'menu-list-item_active': false}"
            v-for="item in groupResult"
            @click="selectSearchTarget(item)"
            :key="item.id"
          >
            <img class="g-menu-list-item-header" :src="item.avatar" alt="头像" />
            <span>{{item.name}}</span>
          </div>
        </template>
      </vue-scroll>
    </div>

    <!-- todo 移除top-pop -->
    <top-pop ref="createPop">
      <friend-select
        :candidates="friendsNoTemp"
        :autoSelectedIds="autoSelectedIds"
        @onConfirm="submitCreateGroup"
        @onCancel="closeCreateGroup"
      ></friend-select>
    </top-pop>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import CommonInput from '../components/common-input.vue';
import TopPop from '../components/top-pop.vue';
import {MySocket, UserLoggedInfo } from '@/scripts/object';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import URLS from '../config/urls';
import Bus from '../scripts/bus';
import FriendSelect from '../components/friend-select.vue';
import { SuccessMsg } from '../config/config-enum';
import { Getter, State } from 'vuex-class';
import showContextMenu from '@/plugins/ContextMenu';
import AddPop from '@/views/add-pop.vue';
import Cryptography from '@/object/targets/Cryptography';
import { TargetParam } from './../config/apiTypings';
import {
  EventType, Encrypt,
} from '@/config/const-enums';
function filterTarget(list: any[], query: string) {
  if (!query) {
    return [];
  }
  return list.filter((item: any) => {
    return (
      item.name.indexOf(query) > -1 ||
      (item.remark && item.remark.indexOf(query) > -1)
    );
  });
}

@Component({
  components: {
    CommonInput,
    TopPop,
    FriendSelect,
    AddPop
  }
})
export default class SearchBar extends Vue {
  @Prop({ default: '' }) public flag!: string;
  @Getter public groupListNoTemp!: Group[];
  @Getter public friendListNoTemp!: Friend[];
  @State public socket!: MySocket | null;
  @State public myInfo!: UserLoggedInfo;

  public searchQuery: string = ''; // 列表搜索绑定值
  public autoSelectedIds: string[] = [];
  public crypto = new Cryptography();

  public get friendResult(): Friend[] {
    return filterTarget(this.friendListNoTemp, this.searchQuery); // 搜索仍包含临时
  }

  public get groupResult(): Friend[] {
    return filterTarget(this.groupListNoTemp, this.searchQuery);
  }

  public get friendsNoTemp(): Friend[] {
    return this.friendListNoTemp.filter((item: Friend) => !item.isTemp);
  }

  public showAddSelect(e: MouseEvent) {
    showContextMenu(
      [
        {
          label: '创建群聊',
          onClick: () => {
            this.showCreateGroup();
          }
        },
        {
          label: '添加好友/群',
          onClick: () => {
            this.showPop();
          }
        }
      ],
      e,
      true
    );
  }

  public showCreateGroup() {
    (this.$refs.createPop as any).showPop();
  }

  public showPop() {
    (this.$refs.addPop as any).showPop();
  }

  // 关闭添加pop
  public closePop() {
    (this.$refs.addPop as any).hindPop();
  }

  public selectSearchTarget(target: Friend | Group) {
    Bus.$emit('onTrySendMsg', target);
    this.searchQuery = '';
  }

  public async submitCreateGroup(arr: any[]) {
    const data = await this.$post(URLS.CREATE_GROUP, {
      roomName: '',
      roomAvatar: '',
      users: arr[0],//群成员的id列表
      encrypt: Encrypt.YES //默认加密
    });
    if (data) {
      const publicKey = await this.crypto.getPublicKey();
      const secret = await this.getGroupSecretKeys(arr[1],publicKey);//arr[1]:群成员id和公钥的 对象列表
      const groupSessionObj = {
        eventType: EventType.ActiveChangeGroupKey,
        roomId: data.id,
        fromKey: publicKey,
        secret: secret
      };
      const socket = this.socket as MySocket;
      socket.sendGroupKey(groupSessionObj);
      this.$notify.success(SuccessMsg.CREATE_GROUP);
      this.closeCreateGroup();
    }
  }

  public async getGroupSecretKeys(menberlist: any[],myPublicKey:string) {
    menberlist.unshift({userId:this.myInfo.id,key:myPublicKey}); 
    console.log(menberlist);
    return await this.crypto.generateGroupSecretKeys(menberlist);
  }

  public created() {
    // todo 创建群提出
    if (this.flag === 'news') {
      Bus.$on('show-created-group', (ids: string[]) => {
        this.autoSelectedIds = ids;
        this.showCreateGroup();
      });
    }
  }

  public beforeDestroy() {
    Bus.$off('show-created-group');
  }

  private closeCreateGroup() {
    (this.$refs.createPop as any).hindPop();
    this.autoSelectedIds = [];
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.search {
  margin-top: 2px;
  padding: 16px 10px 18px 10px;
  height: 24px;
  background: #fff;
}

.search_top {
  z-index: 2; /* 覆盖新朋友阴影 */
}

.input {
  width: 206px;
}

.icon_add {
  margin-left: 10px;
  cursor: pointer;
  vertical-align: middle;
}

.search_result {
  z-index: 2;
  position: fixed;
  top: 60px;
  bottom: 0;
  left: var(--left-bar-width);
  background: #fff;
  width: 260px;
  overflow: auto;
}

.search_result-label {
  padding-left: 13px;
  line-height: 31px;
  color: var(--font-color-light);
  font-size: 11px;
  border-bottom: var(--common-border);
  background: #fff;
}
</style>
