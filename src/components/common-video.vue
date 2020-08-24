<!--
  @Author: yuanzeyu
  @Date: 2019/3/1
  @Desc: 文件列表中的视频(不再与视频消息公用)
-->
<template>
  <div class="common_video">
    <video class="video" :src="videoItem.url" :width="getSize.width" :height="getSize.height"></video>
    <img v-if="localPath" class="icon" src="../assets/video-play.svg" alt="播放" @click="openItem">
    <img v-else-if="!downloading" class="icon" src="../assets/file-download.svg" alt="下载" @click="downloadItem">
    <pie-loading v-else
                 class="icon"
                 :current="loadingSize"
                 :total="totalSize"
                 size="34px"
                 waitingColor="rgba(234,246,255,0.8)">
    </pie-loading>
    <div class="time">{{videoItem.duration * 1000 | formatTime}}</div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {downloadFile2Local} from '@/utils/app/downloadFile';
  import {getFilePath} from '@/utils/app';
  import {formatVideoTime, openLocalFile} from '@/utils/tool';
  import {FileListVideoItem} from '@/config/type';
  import PieLoading from '@/components/pie-loading.vue';

  @Component({
    filters: {
      formatTime: formatVideoTime
    },
    components: {
      PieLoading
    }
  })
  export default class CommonVideo extends Vue {
    @Prop() public videoItem!: FileListVideoItem;

    public localPath: string = '';
    public downloading: boolean = false;
    public loadingSize: number = 0;
    public totalSize: number = 0;

    public get getSize() {
      const width = this.videoItem.width;
      const height = this.videoItem.height;
      if (width > height) {
        return {
          height: 87,
          width: width / height * 87
        };
      }
      return {
        height: height / width * 87,
        width: 87
      };
    }

    public downloadItem() {
      const url = this.videoItem.url;
      this.downloading = true;
      downloadFile2Local({
        url,
        name: (url.split('/') as any).pop(),
        autoOpen: true,
        onStart: (total) => {
          this.totalSize = total;
        },
        onProcess: (count) => {
          this.loadingSize = count;
        },
        onFinish: (val) => {
          this.localPath = val;
          this.downloading = false;
        },
        onError: () => {
          this.$notify.fail('保存失败');
          this.loadingSize = 0;
          this.downloading = false;
        }
      });
    }

    public openItem() {
      openLocalFile(this.localPath);
    }

    public created() {
      this.localPath = getFilePath(this.videoItem.url);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .common_video {
    display: inline-block;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
    cursor: pointer;
  }

  .video {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #3A4048;
    border-radius: 4px;
  }

  .icon {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;
    margin-top: -20px;
    margin-left: -20px;
  }

  .time {
    color: #EAF6FF;
    font-size: var(--small-font-size);
    position: absolute;
    right: 4px;
    bottom: 4px;
  }
</style>
