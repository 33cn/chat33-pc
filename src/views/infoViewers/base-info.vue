<!--
  @Author: yuanzeyu
  @Date: 2019/2/15
  @Desc: 头像昵称等
-->
<template>
  <div class="base_info">
    <common-header class="header" :url="target.avatar" @click.native="imageViewer(target.avatar)"></common-header>
    <div class="text">
      <!-- todo 解决width问题-->
      <text-editor class="text-name"
                   :text="target.name"
                   placeholder="点击设置"
                   :maxLength="FormLimit.Name"
                   @onEdited="saveName"
                   :inputWidth="inputWidth"
                   :multiLine="true"
                   :disabled="!target.isLoggedUser"
                   :showIcon="true">
      </text-editor>
      <p v-if="target instanceof Group" class="text-id">群号 {{target.markId}}</p>
      <p v-else-if="showUid" class="text-id">UID {{target.uid}}</p>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import CommonHeader from '../../components/common-header.vue';
  import TextEditor from '../../components/text-editor.vue';
  import {FormLimit} from '../../config/config-enum';
  import URLS from '../../config/urls';
  import {UserLoggedInfo} from '../../scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import imageViewer from '../../plugins/ImageViewer/index';

  @Component({
    components: {
      CommonHeader,
      TextEditor
    }
  })
  export default class BaseInfo extends Vue {
    @Prop() public target!: Friend | Group | UserLoggedInfo;
    @Prop({default: true}) public showUid!: boolean; // 群内禁止加好友设为false
    @Prop({default: '264px'}) public inputWidth!: string;

    public FormLimit = FormLimit;
    public imageViewer = imageViewer; // todo 提至proto
    public Group = Group;

    /**
     * 提交编辑昵称
     */
    public async saveName(val: string) {
      if (!val) {
        return;
      }
      const me = this.target;
      const backUp = me.name;
      me.name = val;
      const data = await this.$post(URLS.EDIT_USER_NAME, {nickname: val});
      if (!data) {
        me.name = backUp;
      }
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .header {
    width: 100px;
    height: 100px;
    vertical-align: middle;
  }

  .text {
    display: inline-block;
    margin-left: 20px;
    width: 288px;
    vertical-align: middle;
    font-size: 0;
  }

  .text-name {
    font-size: 24px;
    font-weight: 600;
    line-height: 33px;
    margin: 0;
  }

  .text-id {
    margin: 11px 0 0 0;
    color: var(--font-color-light);
    line-height: 20px;
    font-size: var(--normal-font-size);
  }
</style>
