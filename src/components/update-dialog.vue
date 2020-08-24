<!--
  @Author: yuanzeyu
  @Date: 2018/12/21
  @Desc: 版本更新弹窗
-->
<template>
  <div class="update_dialog" @click="$emit('onCancel')">
    <div class="wrapper" :class="{'wrapper_radius':!noRadius}" @click.stop>
      <img class="banner" src="../assets/update_banner.svg" alt="检测更新">

      <template v-if="currentStep === Step.Fail">
        <img class="fail_icon" src="../assets/fail.svg" alt="失败">
        <p class="fail_label">下载失败</p>
        <button v-show="!releaseNote.isUnSkip" class="g-btn_default fail_btn" @click="$emit('onCancel')">取消</button>
        <button class="g-btn_active fail_btn fail_btn_right" @click="startDownload">重新下载</button>
      </template>

      <template v-if="currentStep === Step.Available">
        <h2 class="update_title">发现新版本</h2>
        <div class="update_version_wrapper">
          <div class="update_version">V{{releaseNote.version}}</div>
          <div>{{releaseNote.size | formatSize}}</div>
        </div>
        <ul class="update_content">
          <vue-scroll>
            <li v-for="(item, index) in releaseNote.notes">{{index + 1}}.{{item}}</li>
          </vue-scroll>
        </ul>
        <button v-show="!releaseNote.isUnSkip" class="g-btn_default fail_btn" @click="$emit('onCancel')">取消</button>
        <button class="g-btn_active fail_btn fail_btn_right" @click="startDownload">更新</button>
      </template>

      <template v-if="currentStep === Step.Downloading">
        <p class="downloading_text">正在下载新版本V{{releaseNote.version}}，请稍等...</p>
        <div class="loading_box">
          <div class="loading_box-process" :style="`width:${process}%`"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts"> // todo 修改为focus-dialog
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {ipcRenderer} from 'electron';

  enum Step {
    Fail,
    Available,
    Downloading
  }

  interface UpdateInfo {
    readonly version: string;
    releaseNotes: string;
    files: any[];
    path: string;
  }

  interface Note {
    isUnSkip: boolean;
    notes: string[];
  }

  @Component
  export default class UpdateDialog extends Vue {
    @Prop() public updateInfo!: UpdateInfo;
    @Prop({default: false}) public noRadius!: boolean;
    public process: number = 0;
    public currentStep = Step.Available;
    public releaseNote: any = {
      version: '',
      size: '',
      isUnSkip: true,
      notes: []
    };
    public Step = Step;

    /**
     * 开始下载
     */
    public startDownload(): void {
      this.currentStep = Step.Downloading;
      ipcRenderer.send('click-start-download');
    }

    /**
     * 加载后解析更新信息，注册更新事件
     */
    public mounted(): void {
      const noteStr: Note = JSON.parse(this.updateInfo.releaseNotes);
      this.releaseNote.version = this.updateInfo.version;
      this.releaseNote.isUnSkip = noteStr.isUnSkip;
      this.releaseNote.notes = noteStr.notes;
      const file = this.updateInfo.files.find((item) => item.url === this.updateInfo.path);
      if (file) {
        this.releaseNote.size = file.size;
      }
      ipcRenderer.on('update-error', () => {
        this.currentStep = Step.Fail;
        this.$notify.fail('下载失败，请重试！');
      });
      ipcRenderer.on('on-progress', (event: any, process: any) => {
        this.process = process.percent;
      });
    }

    public beforeDestroy() {
      ipcRenderer.removeAllListeners('update-error');
      ipcRenderer.removeAllListeners('on-progress');
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .update_dialog {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(36, 55, 78, 0.2);
  }

  .wrapper {
    width: 400px;
    height: 500px;
    position: absolute;
    left: 50%;
    top: 50%;
    margin-top: -250px;
    margin-left: -200px;
    background: #fff;
    text-align: center;
  }

  .wrapper_radius {
    border-radius: var(--border-radius-dialog);
  }

  .banner {
    width: 400px;
    -webkit-user-drag: none;
  }

  .checking_icon {
    margin-top: 82px;
    animation: rotating 2s linear infinite;
  }

  .checking_label {
    margin: 30px 0 0 0;
    font-size: 16px;
    font-weight: bold;
    color: var(--common-blue);
    line-height: 22px;
  }

  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(1turn);
    }
  }

  .fail_icon {
    margin-top: 60px;
    width: 50px;
  }

  .fail_label {
    margin: 10px 0 0 0;
    font-size: 16px;
    font-weight: bold;
    color: rgba(221, 95, 95, 1);
    line-height: 22px;
  }

  .fail_btn {
    margin-top: 30px;
    width: 140px;
    height: 40px;
    border-radius: 20px;
  }

  .fail_btn_right { /* todo 优化按钮组 */
    margin-left: 20px;
  }

  .update_title {
    margin: 20px 0 0 0;
    font-size: 20px;
    line-height: 28px;
  }

  .update_version_wrapper {
    margin-top: 10px;
    text-align: center;
    color: var(--common-blue);
    font-size: 16px;
    line-height: 22px;
    & > div {
      display: inline-block;
    }
  }

  .update_version {
    margin-right: 30px;
  }

  .update_content {
    display: block;
    margin: 10px 0 0 0;
    padding: 0 45px 0 20px;
    height: 100px;
    overflow: auto;
    list-style: none;
    text-align: left;
    font-weight: bold;
    line-height: 20px;
  }

  .downloading_text {
    margin-top: 93px;
    font-size: 16px;
    font-weight: bold;
    color: var(--common-blue);
    line-height: 22px;
  }

  .loading_box {
    position: relative;
    margin: 20px auto 0;
    width: 300px;
    height: 4px;
    background: var(--gray-background);
    border-radius: 4px;
    overflow: hidden;
  }

  .loading_box-process {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    background: var(--common-blue);
    width: 50%;
  }
</style>
