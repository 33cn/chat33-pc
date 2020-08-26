<!--
  @Author: yuanzeyu
  @Date: 2019/2/1
  @Desc: 联系人页的列表项、搜索结果列表项、选取弹窗列表项（边距不同） todo 提出字母分类列表组件
-->
<template>
  <header class="chat_header g-tool-drag" :class="{'chat_header_win':isWin}">
    <div class="icon_wrapper g-tool-no_drag">
      <i class="iconfont icon-wenjiancopy" @click="$emit('clickFile')"></i>
      <img v-show="!isGroup || !chatTarget.isTemp"
           @click="$emit('clickInfo')"
           src="../assets/more_title.svg"
           alt="详情">
    </div>
    <h2 class="name">
      <span>{{chatTarget.remark || chatTarget.name}}</span>
      <span v-show="isGroup">({{chatTarget.memberCount}})</span>
    </h2>
  </header>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {State} from 'vuex-class';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';

  @Component({
    components: {
    }
  })
  export default class ChatHeader extends Vue {
    @State public isWin!: boolean;
    @State public chatTarget!: Group | Friend;

    /**
     * 当前是群会话
     */
    public get isGroup(): boolean {
      return this.chatTarget instanceof Group;
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .chat_header {
    position: relative;
    padding: 19px 20px;
    height: 22px;
    border-bottom: var(--common-border);
  }

  .chat_header_win {
    padding-top: 37px;
    margin-top: 2px;
  }

  .icon_wrapper {
    float: right;
    font-size: 22px;
    color: var(--common-blue);
    & > img {
      cursor: pointer;
    }
    & > i {
      margin-right: 20px;
      font-size: 22px;
      vertical-align: top;
      cursor: pointer;
    }
  }

  .name {
    margin: 0;
    font-size: 16px;
    color: var(--font-color-dark);
    line-height: 22px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
