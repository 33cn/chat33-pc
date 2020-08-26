<!--
  @Author: yuanzeyu
  @Date: 2019/1/30
  @Desc: 系统消息(通知类消息)（灰色文字）
-->
<template>
  <div class="main-label">
    <template v-if="notify instanceof PayNotice">
      <span v-if="notify.isPayByMe">你已付款</span>
      <span v-else>对方已付款</span>
    </template>
    <span v-else>{{notify.content}}</span>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {UserLoggedInfo} from '@/scripts/object';
  import {State} from 'vuex-class';
  import LabelNotice from '@/object/messages/notice/LabelNotice';
  import PayNotice from '@/object/messages/notice/PayNotice';

  @Component
  export default class LabelItem extends Vue {
    @State public myInfo!: UserLoggedInfo;
    @Prop() public notify!: LabelNotice | PayNotice;

    public PayNotice = PayNotice;
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .main-label {
    margin: 0 auto;
    max-width: 80%;
    text-align: center;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 17px;
  }
</style>
