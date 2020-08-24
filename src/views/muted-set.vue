<!--
  @Author: yuanzeyu
  @Date: 2018/10/18
  @Desc: 简易选项弹窗，父元素点击显示，父元素点击阻止了默认冒泡
-->
<template>
  <div class="muted_set">
    <div class="left">
      <common-input class="left-input" v-model="searchQuery"></common-input>
      <div class="left-list">
        <vue-scroll>
          <div v-for="item in sortedAllMembers">
            <a class="left-member_letter" :name="item.letter">{{item.letter}}</a>
            <div class="g-menu-list-item g-menu-list-item_dialog g-menu-list-item_dialog_left"
                 v-for="item2 in item.list"
                 :key="item2.member.id">
              <common-header class="member-header" :url="item2.member.avatar"></common-header>
              <div class="member-content_wrapper" :class="{'member-content_wrapper_muted': item2.remainTime > 0}">
                <h2>{{item2.member.nameInGroup || item2.member.name}}</h2>
                <div v-if="item2.remainTime > 0" class="member-content-time">
                  <span v-if="item2.member.mutedEndTime < FOREVER_TIME">已禁言 {{item2.remainTime | dateCount}}</span>
                  <span v-else>永久禁言</span>
                </div>
              </div>
              <button v-if="item2.remainTime > 0" class="member-cancel" @click="cancelMuted(item2)">解除</button>
              <div class="t-check_box" :class="{'t-check_box_active': item2.selected}"
                   @click="item2.selected=!item2.selected">
                <i v-show="item2.selected" class="iconfont icon-xuanrengou1"></i>
              </div>
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
      <div class="right-list" :class="{'right-list_white': isWhiteList}">
        <vue-scroll>
          <div class="g-menu-list-item g-menu-list-item_dialog"
               v-for="item in selectedList"
               :key="item.member.id">
            <common-header class="member-header" :url="item.member.avatar"></common-header>
            <div class="member-content_wrapper">{{item.member.nameInGroup || item.member.name}}</div>
            <div class="t-check_box t-check_box_cancel" @click="item.selected=!item.selected">
              <i class="iconfont icon-xuanrenchacha"></i>
            </div>
          </div>
        </vue-scroll>
      </div>

      <h2 v-if="!isWhiteList" class="right-time-title">选择禁言时间</h2>
      <ul v-if="!isWhiteList" class="right-time-select">
        <li :class="{'active': selectedTime === FOREVER_TIME}" @click="selectedTime=FOREVER_TIME">永远</li>
        <li :class="{'active': selectedTime === 86400000}" @click="selectedTime=86400000">24小时</li>
        <li :class="{'active': selectedTime === 36000000}" @click="selectedTime=36000000">10小时</li>
        <li :class="{'active': selectedTime === 7200000}" @click="selectedTime=7200000">2小时</li>
        <li :class="{'active': selectedTime === 1800000}" @click="selectedTime=1800000">30分钟</li>
        <li :class="{'active': selectedTime === 600000}" @click="selectedTime=600000">10分钟</li>
      </ul>


      <button class="g-btn_default right-btn_cancel" @click="emitClose">取消</button>
      <button class="g-btn_active"
              :class="{'g-btn_active_disable': selectedList.length < 1}"
              @click="emitSave">
        确定
      </button>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {GroupMember} from '@/scripts/object';
  import Group from '@/object/targets/Group';
  import {formatDateCount, groupByFirstLetter, submitCancelMuted} from '@/scripts/common';
  import {checkInclude} from '@/utils/tool';
  import {FOREVER_TIME, MemberMutedSet, MemberType, MutedSet} from '@/config/const-enums';
  import CommonInput from '@/components/common-input.vue';
  import LetterSelector from '@/components/letter-selector.vue';
  import CommonHeader from '@/components/common-header.vue';

  interface SelectItem {
    member: GroupMember;
    selected: boolean;
    remainTime: number;
  }

  @Component({
    components: {
      CommonInput,
      LetterSelector,
      CommonHeader
    },
    filters: {
      dateCount(val: number) {
        return formatDateCount(val);
      }
    }
  })
  export default class MutedSetVue extends Vue {
    @Prop() public group!: Group;
    @Prop() public selectedMutedSet!: MutedSet;

    public allMembers: SelectItem[] = [];
    public timer: any = '';
    public selectedTime: number = FOREVER_TIME;
    public searchQuery: string = '';
    public FOREVER_TIME = FOREVER_TIME;

    public get searchedAllMembers() {
      return this.allMembers.filter((item) => {
        const info = item.member;
        const query = this.searchQuery;
        return checkInclude(info.nameInGroup, query) || checkInclude(info.name, query);
      });
    }

    public get selectedList(): SelectItem[] {
      return this.allMembers.filter((item: SelectItem) => item.selected);
    }

    /**
     * 是白名单
     */
    public get isWhiteList(): boolean {
      return this.selectedMutedSet === MutedSet.WhiteList;
    }

    public get sortedAllMembers() {
      return groupByFirstLetter(this.searchedAllMembers, (item: SelectItem) => {
        return item.member.nameInGroup || item.member.name;
      }); // todo 未处理好友备注，优化昵称规则
    }

    public get letters() {
      return this.sortedAllMembers.map((item: any) => item.letter);
    }

    public emitClose(): void {
      this.$emit('close');
    }

    public emitSave(): void {
      if (this.selectedList.length > 0) {
        this.$emit('onSaveMutedSet', {
          selectedList: this.selectedList.map((item: SelectItem) => item.member.id),
          time: this.isWhiteList ? 0 : this.selectedTime
        });
      }
    }

    public async cancelMuted(selectItem: SelectItem) {
      const data = await submitCancelMuted(this.group.id, selectItem.member.id);
      if (data) {
        selectItem.remainTime = 0;
        selectItem.member.mutedEndTime = 0;
        selectItem.member.memberMutedSet = MemberMutedSet.No;
        this.group.getGroupDetail();
      }
    }

    public created() { // todo 外部加载全部再打开该组件
      const list = this.group.memberList.filter((item: GroupMember) => item.type === MemberType.Member && !item.mayNotMember);
      const groupIsBlack = this.group.mutedSet === MutedSet.BlackList; // 群已经是黑名单
      const isSwitch2White = this.group.mutedSet !== MutedSet.WhiteList && this.selectedMutedSet === MutedSet.WhiteList;
      this.allMembers = list.map((item: GroupMember) => {
        const isInBlack = groupIsBlack && item.memberMutedSet === MemberMutedSet.Black;
        return {
          member: item,
          selected: this.isWhiteList ? item.memberMutedSet === MemberMutedSet.White : false,
          remainTime: groupIsBlack && isInBlack && !isSwitch2White ? item.mutedEndTime - Date.now() : 0
        };
      });
      this.timer = setInterval(() => {
        this.allMembers.forEach((item: SelectItem) => {
          if (item.remainTime > 0) {
            item.remainTime -= 1000;
          }
        });
      }, 1000);
    }

    public beforeDestroy() {
      clearInterval(this.timer);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .muted_set {
    position: fixed;
    top: var(--pop-top);
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    width: 640px;
    height: 500px;
    border-radius: var(--border-radius-dialog);
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
    height: calc(246px + 52px);
    overflow: auto;

    & .member-content_wrapper {
      width: calc(226px - 10px);
    }
  }

  .right-list_white {
    height: calc(246px + 52px + 32px + 52px - 18px);
    margin-bottom: 18px;
  }

  .t-check_box {
    display: inline-block;
    margin-top: 5px;
    width: calc(20px - 2px);
    height: calc(20px - 2px);
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

  .right-btn_cancel {
    margin-left: 100px;
    margin-right: 20px;
  }

  .member-header {
    margin-right: 10px;
    width: 30px;
    height: 30px;
    vertical-align: top;
  }

  .member-content_wrapper {
    display: inline-block;
    vertical-align: top;
    height: 100%;
    width: calc(214px - 10px);
    line-height: 30px;

    & > h2 {
      margin: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      vertical-align: middle;
      line-height: 30px;
      color: var(--font-color-dark);
      font-size: var(--normal-font-size);
    }
  }

  .member-content_wrapper_muted {
    width: 154px;
    position: relative;
    top: -4px;

    & > h2 {
      line-height: 20px;
    }
  }

  .member-content-time {
    color: var(--font-color-light);
    font-size: var(--small-font-size);
    line-height: 17px;
  }

  .member-cancel {
    border: 1px solid var(--font-color-light);
    border-radius: 4px;
    width: 40px;
    height: 28px;
    outline: none;
    cursor: pointer;
    vertical-align: top;
    margin: 1px 8px 0 2px;
    color: var(--font-color-light);
  }

  .right-time-title {
    margin: 0 0 0 10px;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 32px;
  }

  .right-time-select {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--small-font-size);
    color: var(--font-color-light);

    & > li {
      width: 50px;
      height: 52px;
      display: inline-block;
      text-align: center;
      line-height: 52px;
      cursor: pointer;
    }
  }

  .right-time-select > .active {
    color: var(--common-blue);
    font-size: var(--normal-font-size);
  }
</style>
