<template>
  <div class="add_pop">
    <common-input class="add_pop-input" v-model="id" @onEnter="doSearch"></common-input>
    <button class="g-btn_active add_pop-search_btn" :class="{'g-btn_active_disable': !id}" @click="doSearch">查询
    </button>
    <template v-if="target">
      <add-friend v-if="isFriend"
                  :friend="target"
                  question="这里是需要回答的问题，最多二十个字什么？"
                  :needCheck="true"
                  @afterAddFriend="$emit('close')">
      </add-friend>
      <add-group v-else :group="target" @onClose="$emit('close')"></add-group>
    </template>
    <div v-else class="add_pop-empty">
      <!-- todo 提出empty组件 -->
      <img class="add_pop-empty-img" src="../assets/no-result.svg" alt="没有匹配的对象">
      <div class="add_pop-empty-label">没有匹配的对象</div>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import CommonInput from '@/components/common-input.vue';
  import AddFriend from '@/views/infoViewers/add-friend.vue';
  import AddGroup from '@/views/infoViewers/add-group.vue';
  import {UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import URLS from '@/config/urls';
  import {SearchRoomInfo, SearchTarget, SearchUserInfo} from '@/config/apiTypings';
  import {Bool, NewChannelType} from '@/config/const-enums';
  import {Getter, State} from 'vuex-class';

  /**
   * 添加群/好友
   * @author yuanzeyu
   * @date 2019-07-09
   * @desc
   */
  @Component({
    components: {
      CommonInput,
      AddFriend,
      AddGroup
    }
  })
  export default class AddPop extends Vue {
    @Getter public groupListNoTemp!: Group[];
    @Getter public friendListNoTemp!: Friend[];
    @State public myInfo!: UserLoggedInfo;
    public id: string = '';
    public target: Group | Friend | UserLoggedInfo | null = null; // 添加搜索结果
    get isFriend() {
      return this.target instanceof Friend
    }

    // 精确查询群/好友
    public async doSearch() {
      if (!this.id) {
        return;
      }
      const result = await this.$post(URLS.SEARCH_FRIEND_GROUP, {markId: this.id});
      if (result) {
        const data = result as SearchTarget;
        if (data.type === NewChannelType.Group) { // 结果为群
          const info = data.roomInfo as SearchRoomInfo;
          const existGroup = this.groupListNoTemp.find((item) => item.id === info.id);
          if (existGroup) {
            this.target = existGroup;
          } else {
            this.target = new Group({id: info.id});
            this.target.isTemp = true;
          }
          // 设置或更新信息
          this.target.name = info.name;
          this.target.avatar = info.avatar || this.target.avatar;
          this.target.joinPermission = info.joinPermission;
          this.target.memberCount = info.memberNumber;
        } else if (data.type === NewChannelType.Friend) {
          const info = data.userInfo as SearchUserInfo;
          if (info.id === this.myInfo.id) {
            this.target = this.myInfo;
          } else {
            const existFriend = this.friendListNoTemp.find((item) => item.id === info.id);
            if (existFriend) {
              this.target = existFriend;
            } else {
              this.target = new Friend({id: info.id});
              this.target.isTemp = true;
            }
            this.target.name = info.name;
            this.target.avatar = info.avatar || this.target.avatar;
            this.target.remark = info.remark || '';
            this.target.uid = info.uid;
            this.target.needCheck = info.needConfirm === Bool.Yes;
            this.target.needAnswer = info.needAnswer === Bool.Yes;
            this.target.addQuestion = info.question;
          }
        } else {
          this.target = null;
        }
      }
    }
  }
</script>

<style scoped>
  .add_pop {
    padding: 20px 40px 0 40px;
    min-height: calc(500px - 36px);
    width: calc(500px - 80px);
  }

  .add_pop-input {
    width: calc(330px + 15px);
    padding-right: 18px;
  }

  .add_pop-search_btn {
    position: absolute;
    top: 20px;
    right: 40px;
    width: 90px;
    height: 24px;
  }

  .add_pop-empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .add_pop-empty-img {
    width: 200px;
    height: 160px;
    line-height: 160px;
  }

  .add_pop-empty-label {
    text-align: center;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 17px;
    margin-top: 20px;
  }
</style>
