<!--
  @Author: yuanzeyu
  @Date: 2018/10/11
  @Desc: 创建群选好友、添加群成员、移除群成员 todo 优化好友选择
-->
<template>
  <div class="friend_select">
    <div class="left">
      <common-input class="left-input" v-model="searchQuery"></common-input>
      <div class="left-list">
        <vue-scroll>
          <div v-for="sortItem in sortedAllMembers">
            <a class="left-member_letter" :name="sortItem.letter">{{sortItem.letter}}</a>
            <div class="g-menu-list-item g-menu-list-item_dialog g-menu-list-item_dialog_left"
                 v-for="item in sortItem.list"
                 :key="item.id">
              <div class="t-check_box" :class="{'t-check_box_active': item.selected}"
                   @click="item.selected=!item.selected">
                <!-- icon -->
                <i v-show="item.selected" class="iconfont icon-xuanrengou1"></i>
              </div>
              <common-header class="g-menu-list-item-header" :url="item.avatar"></common-header>
              <div class="menu-list-item-label">{{item.label}}</div>
            </div>
          </div>
        </vue-scroll>
      </div>
      <letter-selector :letters="letters"></letter-selector>
    </div>
    <div class="right">
      <div class="right-label">
        <span>已选联系人</span>
        <span class="right-label-count">{{selectedList.length}}</span>
      </div>
      <div class="right-list">
        <vue-scroll>
          <div class="g-menu-list-item g-menu-list-item_dialog"
               v-for="item in selectedList"
               :key="item.id">
            <div class="t-check_box t-check_box_cancel" @click="item.selected=!item.selected">
              <i class="iconfont icon-xuanrenchacha"></i>
            </div>
            <common-header class="g-menu-list-item-header" :url="item.avatar"></common-header>
            <div class="menu-list-item-label">{{item.label}}</div>
          </div>
        </vue-scroll>
      </div>
      <button class="right-btn right-btn_cancel g-btn_default" @click="$emit('onCancel')">取消</button>
      <button class="right-btn g-btn_active" @click="emitConfirm">确定</button>
    </div>

  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Friend from '@/object/targets/Friend';
  import CommonInput from '../components/common-input.vue';
  import {groupByFirstLetter} from '../scripts/common';
  import LetterSelector from '../components/letter-selector.vue';
  import {checkInclude} from '../utils/tool';
  import CommonHeader from '@/components/common-header.vue';

  interface menberTarget {
    id: string;
    avatar: string;
    label: string;
    selected: boolean;
    publicKey: string;
  }

  @Component({
    components: {
      CommonInput,
      LetterSelector,
      CommonHeader
    }
  })
  export default class FriendSelect extends Vue {
    @Prop() public candidates!: Friend[]; // 左侧候选菜单（联系人或群成员） 也支持GroupMember
    @Prop({default: () => []}) public autoSelectedIds!: string[]; // 默认选中的联系人

    public bindList: menberTarget[] = [];
    public searchQuery: string = '';

    public get searchedTarget() {
      return this.bindList.filter((item) => checkInclude(item.label, this.searchQuery));
    }

    public get selectedList(): menberTarget[] {
      return this.bindList.filter((item: menberTarget) => item.selected);
    }

    public get sortedAllMembers() {
      return groupByFirstLetter(this.searchedTarget, (item: menberTarget) => item.label);
    }

    public get letters() {
      return this.sortedAllMembers.map((item: any) => item.letter);
    }

    public emitConfirm() {
      this.$emit('onConfirm', [this.selectedList.map((item: menberTarget) => item.id),this.selectedList.map((item: menberTarget) => {return {userId:item.id,key:item.publicKey}})]);
    }

    public created() {
      this.bindList = this.candidates.map((item: Friend) => {
        return {
          id: item.id,
          avatar: item.avatar,
          label: item.remark || item.name,
          selected: this.autoSelectedIds.includes(item.id),
          publicKey: item.publicKey
        };
      });
    }
  }
</script>

<style scoped>/* todo 更新样式和muted-set同步 */
@import '../styles/var.css';

.friend_select {
  width: 640px;
  height: 500px;
}

.left, .right {
  vertical-align: top;
  display: inline-block;
  width: 50%;
  height: 100%;
}

.left {
  position: relative;
}

.left-list {
  height: calc(500px - 60px - 14px);
  overflow: auto;
}

.left-input {
  margin: 18px 0 18px 20px;
  width: 280px;
}

.left-member_letter {
  line-height: 20px;
  padding-left: 20px;
  color: var(--font-color-light);
  font-size: var(--small-font-size);
}

.right-label {
  margin: 18px 0 24px 24px;
  line-height: 18px;
  font-size: 13px;
  color: var(--font-color-light);
}

.right-label-count {
  margin-left: 10px;
}

.right-list {
  margin-bottom: 8px;
  height: calc(500px - 60px - 66px);
  overflow: auto;
}

.t-check_box {
  float: right;
  margin-top: 5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #8A97A5;
  cursor: pointer;
  text-align: center;
  line-height: 15px;
  & > i {
    font-size: 10px;
    color: #fff;
  }
}

.t-check_box_active {
  background: var(--icon-active-color);
  border: 1px solid var(--icon-active-color);
}

.t-check_box_cancel {
  background: var(--font-color-light);
}

.right-btn {
  width: 90px;
}

.right-btn_cancel {
  margin-left: 100px;
  margin-right: 20px;
}

.menu-list-item-label { /* 避免使用span挡住右侧float */
  display: inline-block;
  width: 200px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  vertical-align: middle;
  line-height: 20px;
}
</style>
