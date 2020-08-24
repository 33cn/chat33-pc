<!--
  @Author: yuanzeyu
  @Date: 2019/1/15
  @Desc: 消息页的菜单项
-->
<template>
  <div class="news_item"
       :class="{'news_item_top': target.isTop, 'news_item_active': selected}"
       @click="$emit('click', $event)">
    <common-header class="header" :url="target.avatar"></common-header>
    <label class="time">{{latestTimeLabel}}</label>
    <h2 class="name">{{target.remark || target.name}}</h2>
    <img v-if="target.muted" class="icon_muted" src="../../assets/muted.svg" alt="免打扰">
    <span class="news_unreadlike" v-if="unreadTotalLike">[{{unreadTotalLike}}赞赏]</span>
    <p class="message">{{latestContentLabel}}</p>
    <red-count class="count" :count="target.unReadCount" :isGrey="target.muted"></red-count>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import CommonHeader from '../common-header.vue';
  import RedCount from '../red-count.vue';
  import {getLastChatMsg} from '@/utils/app';
  import {formatShortDate} from '@/scripts/common';
  import {State} from 'vuex-class';
  import {MessageType} from '@/object/messages';

  @Component({
    components: {
      CommonHeader,
      RedCount
    }
  })
  export default class NewsItem extends Vue {
    @Prop() public target!: Friend | Group;
    @Prop() public selected!: boolean;
    @State public myInfo!: UserLoggedInfo;

    /**
     * 
     */
    public get unreadTotalLike():number {
      return this.target.unReadLike + this.target.unReadReward 
    }
    /**
     * 会话列表的最新消息内容标签
     */
    public get latestContentLabel(): string {
      const msg = this.latestMsg;
      if (msg) {
        return msg.getListLabel(this.target instanceof Group);
      }
      return '';
    }

    /**
     * 会话列表的最新消息时间标签
     */
    public get latestTimeLabel(): string {
      const msg = this.latestMsg;
      if (msg) {
        return formatShortDate(msg.sendTime);
      }
      return '';
    }

    /**
     * 最新消息
     */
    private get latestMsg(): MessageType | null {
      return getLastChatMsg(this.target);
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .news_item {
    position: relative;
    height: 44px;
    padding: 14px 10px;
    cursor: pointer;
  }

  .news_item_top {
    background: var(--top-message-background);
  }

  .news_item_active {
    background: var(--contact-active-background);
  }

  .header {
    float: left;
    margin-right: 10px;
    width: 44px;
    height: 44px;
  }

  .time {
    float: right;
    margin-top: 2px;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 17px;
  }

  .name {
    margin: 0;
    line-height: 20px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: var(--normal-font-size);
    font-weight: 400;
  }

  .icon_muted {
    float: right;
    margin-top: 8px;
  }

  .message {
    margin-top: 6px;
    margin-bottom: 0;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 17px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .count {
    position: absolute;
    left: 48px;
    top: 9px;
  }

  .news_unreadlike {
    float: left;
    margin-top: 6px;
    height: 17px;
    line-height: 17px;
    font-size: var(--small-font-size);
    color: var(--common-blue)
  }
</style>
