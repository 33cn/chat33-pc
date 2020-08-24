<!--
  @Author: yuanzeyu
  @Date: 2018/12/20
  @Desc: 个人头像上传组件
-->
<template>
  <div class="header_uploader" @mouseenter="disabled?'':maskShowing=true" @mouseleave="disabled?'':maskShowing=false">
    <common-header class="header" :class="{'header_disabled':disabled}" :url="myInfo?myInfo.avatar:group.avatar"></common-header>
    <div v-show="maskShowing" class="mask" @click="uploadImg">
      <img class="mask-icon" src="../assets/upload.svg" alt="上传">
    </div>
    <input type="file" accept="image/png, image/jpeg, image/jpg" @change="fileChange" ref="fileInput" hidden>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import CommonHeader from './common-header.vue';
  import {upLoadOssFile} from '../scripts/common';
  import {UserLoggedInfo} from '../scripts/object';
import Group from '@/object/targets/Group';

  import {ErrorMsg} from '../config/config-enum';
  import URLS from '../config/urls';

  @Component({
    components: {
      CommonHeader
    }
  })
  export default class HeaderUploader extends Vue {
    @Prop() public myInfo!: UserLoggedInfo;
    @Prop({default: false}) public disabled!: boolean;
    @Prop() public group!: Group; // 有则为设置群头像

    public maskShowing: boolean = false;

    public uploadImg(): void {
      (this.$refs.fileInput as any).click();
    }

    public fileChange() {
      const inputDom: any = this.$refs.fileInput;
      if (inputDom.files.length > 0) {
        const func = this.group ? this.confirmSubmitGroup : this.confirmSubmit;
        func(inputDom.files[0]);
      }
    }

    private confirmSubmit(blob: Blob) {
      upLoadOssFile({
        fileBlob: blob,
        type: 'avatar',
        userId: this.myInfo.id
      }).then((res: any) => {
        this.submitAvatar(res.url, this.myInfo.avatar);
        this.myInfo.avatar = res.url;
      }).catch(() => {
        this.$notify.fail(ErrorMsg.OSS_UPLOAD_FAIL);
      });
    }

    private confirmSubmitGroup(blob: Blob) {
      upLoadOssFile({
        fileBlob: blob,
        type: 'groupAvatar',
        userId: this.group.id
      }).then((res: any) => {
        this.submitGroupAvatar(res.url, this.group.avatar);
        this.group.avatar = res.url;
      }).catch(() => {
        this.$notify.fail(ErrorMsg.OSS_UPLOAD_FAIL);
      });
    }

    private async submitGroupAvatar(url: string, backUp: string) {
      const data = await this.$post(URLS.SET_GROUP_AVATAR, {
        roomId: this.group.id,
        avatar: url
      });
      if (!data) {
        this.group.avatar = backUp;
      }
    }

    private async submitAvatar(url: string, backUp: string) {
      const data = await this.$post(URLS.EDIT_USER_HEADER, {
        avatar: url
      });
      if (!data) {
        this.myInfo.avatar = backUp;
      }
    }
  }
</script>

<style scoped>
  .header_uploader {
    position: relative;
    display: inline-block;
    border-radius: 4px; /* todo 和common-header相同 */
    overflow: hidden;
  }

  .header {
    width: 100%;
    height: 100%;
  }

  .header_disabled {
    cursor: initial;
  }

  .mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(36, 55, 78, 0.8);
    cursor: pointer;
  }

  .mask-icon {
    vertical-align: middle;
  }
</style>
