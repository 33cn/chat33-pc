<!--
  @Author: yuanzeyu
  @Date: 2019/2/18
  @Desc: 用户信息：点击弹窗/联系人页右侧详情
-->
<template>
  <div class="common_info">
    <div class="top_wrapper">
      <base-info :target="target" :showUid="addFriendEnable"></base-info>
      <div class="hr"></div>
    </div>
    <div class="content_wrapper">
      <vue-scroll id="commonInfoScroll" :ops="isNumber?ops:null" ref="scrollDom">
        <friend-sets v-if="existFriend" class="content" :friend="target" :chatTarget="chatTarget"></friend-sets>
        <template v-else>
          <ul class="content list">
            <li class="item" v-if="target instanceof UserLoggedInfo">
              <div class="item-key">账号</div>
              <div class="item-value">{{target.account}}</div>
            </li>
            <li class="item" v-if="chatTarget instanceof Group">
              <div class="item-key">群昵称</div>
              <text-editor :text="nameInGroup"
                           placeholder="无"
                           :maxLength="FormLimit.Name"
                           @onEdited="saveNameInGroup"
                           inputWidth="310px"
                           :disabled="!(target instanceof UserLoggedInfo)"
                           :showIcon="true">
              </text-editor>
            </li>
          </ul>
        </template>
      </vue-scroll>
    </div>

    <base-btn v-if="existFriend" :target="target" @onClickBtn="$emit('onClickBtn')"></base-btn>
    <template v-else-if="target.isTemp">
      <button v-if="addFriendEnable" class="g-btn_active btn" @click="clickAddFriend">添加好友</button>
      <button v-else class="g-btn_active g-btn_active_disable btn">该群禁止互加好友</button>
      <top-pop ref="addPop" v-if="target.isTemp">
        <div class="add_pop">
          <h2 class="add_pop-title">好友申请</h2>
          <add-friend :friend="target"
                      question="这里是需要回答的问题，最多二十个字什么？"
                      :needCheck="true"
                      :groupId="groupId"
                      :noSource="noSource"
                      @afterAddFriend="closePop">
          </add-friend>
        </div>
      </top-pop>
    </template>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {State} from 'vuex-class';
  import {Config} from 'vuescroll';
  import URLS from '@/config/urls';
  import {FormLimit} from '@/config/config-enum';
  import {AddFriendEnable} from '@/config/const-enums';
  import {UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import TextEditor from '@/components/text-editor.vue';
  import TopPop from '@/components/top-pop.vue';
  import FriendSets from './friend-sets.vue';
  import BaseInfo from './base-info.vue';
  import BaseBtn from './base-btn.vue';
  import AddFriend from './add-friend.vue';
  import {vuescroll} from 'vuescroll/types/vuescroll';

  @Component({
    components: {
      FriendSets,
      BaseInfo,
      BaseBtn,
      TextEditor,
      TopPop,
      AddFriend
    }
  })
  export default class CommonInfo extends Vue {
    @Prop() public target!: Friend | UserLoggedInfo;
    @Prop() public chatTarget!: Group | Friend | null;
    @Prop({default: false}) public noSource!: boolean;
    @Prop({default: false}) public autoGetInfo!: boolean; // 自动加载好友信息
    @Prop({default: false}) public isNumber!: boolean;
    @State public friendList!: Friend[];
    @State public myInfo!: UserLoggedInfo;

    public groupId: string = '';

    public Group = Group;
    public UserLoggedInfo = UserLoggedInfo;
    public FormLimit = FormLimit;
    public ops: Config = {
      vuescroll: {
        sizeStrategy: 'number'
      }
    };

    public get existFriend(): Friend | null {
      return this.friendList.find((item) => item.id === this.target.id && !item.isTemp) || null;
    }

    public get nameInGroup(): string {
      const group = this.chatTarget as Group;
      const member = group.memberList.find((item) => item.id === this.target.id);
      if (member && member.nameInGroup) {
        return member.nameInGroup;
      }
      return '无';
    }

    public get addFriendEnable(): boolean {
      if (this.chatTarget instanceof Group) {
        return this.chatTarget.addFriendEnable === AddFriendEnable.Yes;
      }
      return true;
    }

    /**
     * 保存我的群昵称
     */
    public async saveNameInGroup(val: string) {
      const group = this.chatTarget as Group;
      const myMember = group.memberList.find((item) => item.id === this.myInfo.id);
      if (myMember) {
        const backUp = myMember.nameInGroup;
        myMember.nameInGroup = val;
        const data = await this.$post(URLS.SET_MEMBER_NICKNAME, {
          roomId: group.id,
          nickname: val
        });
        if (!data) {
          myMember.nameInGroup = backUp;
        }
      } else {
        this.$notify.fail('不属于该群成员');
      }
    }

    /**
     * 点击添加好友
     */
    public clickAddFriend() {
      this.groupId = this.chatTarget instanceof Group ? this.chatTarget.id : '';
      (this.target as Friend).getFriendDetail();
      (this.$refs.addPop as any).showPop();
    }

    // 关闭添加pop
    public closePop() {
      (this.$refs.addPop as any).hindPop();
      this.$emit('onClickBtn');
    }

    public created() {
      if (this.autoGetInfo && this.target instanceof Friend) {
        this.target.getFriendDetail().then(() => {
          (this.$refs.scrollDom as vuescroll).refresh(); // number下无法检测到高度变动？
        });
      }
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .common_info {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 30px;
    background: #fff;
  }

  .top_wrapper {
    padding: 40px 40px 0 40px;
  }

  .hr {
    margin-top: 30px;
    width: 100%;
    border-bottom: var(--common-border);
  }

  .content_wrapper {
    overflow: auto;
    flex: 1;
  }

  .content {
    padding: 0 40px;
  }

  .list {
    list-style: none;
    margin: 20px 0 0 0;
    line-height: 20px;
  }

  .item {
    display: flex;

    &:not(:last-child) {
      margin-bottom: 10px;
    }

  }

  .item-key {
    width: 70px;
    color: var(--font-color-light);
  }

  .item-value {
    flex: 1;
  }

  .btn {
    margin: 30px auto 0;
    width: 140px;
    height: 40px;
    border-radius: 20px;
  }

  .add_pop {
    padding: 0 40px;
    min-height: calc(500px - 36px);
    width: calc(500px - 80px);
  }

  .add_pop-title {
    margin: 0;
    line-height: 50px;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
  }
</style>
