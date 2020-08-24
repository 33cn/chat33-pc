<!--
  @Author: yuanzeyu
  @Date: 2019/2/19
  @Desc: 文件右栏的文件项
-->
<template>
  <div class="file_item">
    <img class="icon_type" alt="其他类型" :src="getFileIcon(file.name)">
    <div class="info_wrapper">
      <h2 class="info-name">{{file.name}}</h2>
      <span>{{file.size | formatSize}}</span>
      <span class="info-time">{{file.time | formatDate}}</span>
      <div class="info-sender"
           :class="{'info-sender_disable':filterDisable}"
           @click="emitFilter">
        {{file.senderName}}
      </div>
    </div>
    <!-- 删除按钮 -->
    <i class="iconfont icon-shanchu1 icon_delete"
       :class="deleteBtnActive?'icon_active':'icon_disable'"
       @click="showDeleteMenu"></i>
    <!-- 打开文件按钮 -->
    <i v-if="file.localPath" class="iconfont icon-dakai icon_active icon_first" @click="openFile"></i>
    <!-- 下载中 -->
    <pie-loading v-else-if="downloading"
                 class="loading"
                 :current="loadingSize"
                 :total="file.size"
                 size="34px"
                 waitingColor="#EAF6FF">
      <div class="loading-label">{{percentStr}}</div>
    </pie-loading>
    <!-- 下载按钮 -->
    <i v-else class="iconfont icon-baocun icon_active icon_first" @click="downloadFile"></i>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {State} from 'vuex-class';
  import {FileItemType} from '@/config/type';
  import {deleteLocalFile, getFileIcon} from '@/utils/app';
  import {formatDate, openLocalFile} from '@/utils/tool';
  import {downloadFile2Local} from '@/utils/app/downloadFile';
  import {UserLoggedInfo} from '@/scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import showContextMenu from '@/plugins/ContextMenu';
  import URLS from '@/config/urls';
  import {NewChannelType} from '@/config/const-enums';
  import PieLoading from '@/components/pie-loading.vue';

  @Component({
    filters: {
      formatDate
    },
    components: {
      PieLoading
    }
  })
  export default class FileItem extends Vue {
    @Prop() public file!: FileItemType;
    @Prop() public filterDisable!: boolean;
    @State public myInfo!: UserLoggedInfo;
    @State public chatTarget!: Group | Friend;

    public getFileIcon = getFileIcon;
    public downloading: boolean = false;
    public loadingSize: number = 1000;

    public get deleteBtnActive() {
      const sendByMe = this.file.senderId === this.myInfo.id;
      const downloaded = this.file.localPath;
      return sendByMe || downloaded;
    }

    public get percentStr() {
      return `${Math.round(this.loadingSize / this.file.size * 100)}%`;
    }

    public openFile() {
      openLocalFile(this.file.localPath);
    }

    public downloadFile() {
      const file = this.file;
      this.downloading = true;
      downloadFile2Local({
        url: file.url,
        name: file.name,
        onProcess: (count) => {
          this.loadingSize = count;
        },
        onFinish: (path) => {
          this.downloading = false;
          file.localPath = path;
        },
        onError: () => {
          this.$notify.fail('保存失败');
          this.downloading = false;
          this.loadingSize = 0;
        }
      });
    }

    public emitFilter() {
      if (!this.filterDisable) {
        this.$emit('filterOwner');
      }
    }

    public showDeleteMenu(e: MouseEvent) {
      if (!this.deleteBtnActive) {
        return;
      }
      const file = this.file;
      const target = this.chatTarget;
      const isFriend = target instanceof Friend;
      showContextMenu([
        {
          label: isFriend ? '从聊天文件中删除' : '从群文件中删除',
          disabled: file.senderId !== this.myInfo.id,
          onClick: () => {
            this.deleteRemoteFile(file, target);
          }
        }, {
          label: '从本设备中删除',
          disabled: !file.localPath,
          onClick: () => {
            this.deleteLocalFile(file);
          }
        }
      ], e, false, () => {
        console.info('close');
      });
    }

    private deleteLocalFile(file: FileItemType) {
      deleteLocalFile(file.url, () => {
        file.localPath = '';
      }, (e) => {
        this.$notify.fail('删除本地文件失败');
        console.error(e);
      });
    }

    private async deleteRemoteFile(file: FileItemType, target: Group | Friend) {
      const data = await this.$post(URLS.DELETE_FILE_MSG, {
        logs: [file.id],
        type: target instanceof Group ? NewChannelType.Group : NewChannelType.Friend
      });
      if (data) {
        if (data.failsNumber === 0) {
          // 删除本地
          if (file.localPath) {
            this.deleteLocalFile(file);
          }
          // 删除该file item
          this.$emit('onDelete');
          // 尝试删除内存和本地消息
          target.deleteLocalMessage(file.id, target instanceof Group);
        } else {
          this.$notify.fail('删除失败');
        }
      }
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';

  .file_item {
    padding: 10px 20px;
    height: 40px;

    &:not(:last-child) {
      border-bottom: var(--common-border);
    }
  }

  .icon_type {
    width: 40px;
    vertical-align: middle;
  }

  .info_wrapper {
    display: inline-block;
    vertical-align: middle;
    height: 40px;
    margin-left: 10px;
    width: calc(261px - 10px);
    color: var(--font-color-light);
    line-height: 16px;
    font-size: 11px;
  }

  .info-name {
    margin: 0 0 4px 0;
    color: var(--font-color-dark);
    font-size: var(--normal-font-size);
    font-weight: 400;
    line-height: 20px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .info-time {
    margin: 0 10px;
  }

  .info-sender {
    display: inline-block;
    vertical-align: middle;
    max-width: 110px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--common-blue);
    cursor: pointer;
  }

  .info-sender_disable {
    color: var(--font-color-light);
    cursor: initial;
  }

  .icon_active {
    font-size: 16px;
    color: #b2bcc6;
    cursor: pointer;

    &:hover {
      color: var(--common-blue);
    }
  }

  .icon_disable {
    color: #e9edf1;
    cursor: not-allowed;
  }

  .icon_delete {
    float: right;
    line-height: 40px;
  }

  .icon_first {
    float: right;
    margin-right: 21px;
    line-height: 40px;
  }

  .loading {
    float: right;
    margin: 3px 9px 0 0;
  }

  .loading-label {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    text-align: center;
    line-height: 34px;
    font-size: var(--small-font-size);
    color: var(--common-blue);
  }
</style>
