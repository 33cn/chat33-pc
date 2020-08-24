<!--
  @Author: yuanzeyu
  @Date: 2018/10/13
  @Desc: 登录用户信息查看和编辑（点击左上角头像弹出）
-->
<template>
    <div class="my_info">
      <header-uploader class="header" :myInfo="info"></header-uploader>
      <text-editor class="editor" :text="info.name" @onEdited="saveName" placeholder="未设置昵称" :maxLength="FormLimit.Name">
        <div class="editor-icon_wrapper">
          <i class="iconfont icon-xiugai"></i>
        </div>
      </text-editor>
      <div class="hr"></div>
      <p class="info info_first">账号：{{info.account}}</p>
      <p class="info">UID：{{info.uid}}</p>
      <p class="info">{{info.position}}</p>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from 'vue-property-decorator';
    import {UserLoggedInfo} from '@/scripts/object';
    import URLS from '@/config/urls';
    import {FormLimit} from '@/config/config-enum';
    import CommonHeader from '@/components/common-header.vue';
    import TextEditor from '@/components/text-editor.vue';
    import HeaderUploader from '@/components/header-uploader.vue';

    @Component({
      components: {
        TextEditor,
        CommonHeader,
        HeaderUploader
      }
    })
    export default class MyInfo extends Vue {
      @Prop() public info!: UserLoggedInfo;

      public FormLimit = FormLimit;

      private async saveName(val: string) {
        if (!val) {
          return;
        }
        const backUp = this.info.name;
        this.info.name = val;
        const data = await this.$post(URLS.EDIT_USER_NAME, {nickname: val});
        if (!data) {
          this.info.name = backUp;
        }
      }
    }
</script>

<style scoped>
  @import '../styles/var.css';

  .my_info {
    z-index: 2;
    position: absolute;
    top: 96px;
    left: 40px;
    padding: 40px;
    width: 294px;
    background: #fff;
    box-shadow: var(--shadow-dialog);
    text-align: left;
    color: var(--font-color-light);
  }

  .header {
    margin-right: 36px;
    vertical-align: middle;
    width: 60px;
    height: 60px;
    cursor: pointer;
  }

  .editor {
    display: inline-block;
    max-width: 180px;
    line-height: 60px;
    color: var(--font-color-dark);
    font-size: 24px;
    vertical-align: middle;
  }

  .editor-icon_wrapper {
    margin-left: 8px;
    margin-top: 26px;
    line-height: 12px;
    & > i {
      font-size: 12px;
    }
  }

  .hr {
    margin-top: 23px;
    width: 100%;
    border-bottom: var(--common-border);
  }

  .info_first {
    margin-top: 23px;
  }

  .info {
    margin: 8px 0 0 0;
    font-size:14px;
    line-height:20px;
  }
</style>
