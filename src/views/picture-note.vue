<!--
  @Author: yuanzeyu
  @Date: 2019/2/14
  @Desc: 编辑图片备注
-->
<template>
  <div>
    <div v-for="(item, index) in picList" class="picture_box" :style="`background-image:url(${item.url})`" :key="index">
      <ul class="picture_box-mask">
        <li class="mask-item" @click="replace(item)">
          <i class="iconfont icon-shangchuan"></i>
        </li>
        <li class="mask-item" @click="imageViewer(item.url)">
          <i class="iconfont icon-chakan"></i>
        </li>
        <li class="mask-item" @click="deletePic(index)">
          <i class="iconfont icon-shanchu"></i>
        </li>
        <li class="mask-item" @click="save(item.url)">
          <i class="iconfont icon-baocun1"></i>
        </li>
      </ul>
    </div>
    <div v-if="picList.length<limit" class="upload" @click="addPic" @drop.prevent="dropFile" @dragover.prevent>
      将图片拖拽至此或<span class="upload-link">点击上传</span>
    </div>
    <div v-else class="upload upload_disabled">限传三张图片，点击图片可替换和删除</div>
    <input type="file" accept="image/png, image/jpeg, image/jpg" @change="fileChange" ref="selectInput" hidden>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {ipcRenderer} from 'electron';
  import {FormLimit, ImageTypeLimit} from '@/config/config-enum';
  import {PicItem} from '@/config/type';
  import {file2DataUrl} from '@/utils/tool';
  import imageViewer from '@/plugins/ImageViewer';

  @Component
  export default class PictureNote extends Vue {
    @Prop() public picList!: PicItem[];
    public waitReplace: PicItem | null = null; // 等待替换的图片
    public limit = FormLimit.NotePicture;
    public imageViewer = imageViewer;

    public deletePic(index: number) {
      this.picList.splice(index, 1);
    }

    public replace(item: PicItem) {
      this.waitReplace = item;
      this.activeInput();
    }

    public activeInput() {
      (this.$refs.selectInput as HTMLElement).click();
    }

    public addPic() {
      this.waitReplace = null;
      this.activeInput();
    }

    public fileChange() {
      const inputDom: any = this.$refs.selectInput;
      if (inputDom.files.length > 0) {
        const file = inputDom.files[0];
        if (this.waitReplace) {
          const index = this.picList.findIndex((item) => item === this.waitReplace);
          file2DataUrl(file).then((url) => {
            const newItem: PicItem = {
              url,
              file,
              isDataUrl: true
            };
            this.picList.splice(index, 1, newItem);
          });
        } else {
          this.addFile(file);
        }
        inputDom.value = '';

      }
    }

    public addFile(file: File) {
      file2DataUrl(file).then((url: string) => {
        this.picList.push({
          url,
          file,
          isDataUrl: true
        });
      });
    }

    public save(url: string) {
      ipcRenderer.send('show-save-dialog', url);
    }

    public dropFile(e: DragEvent) { // 仅读一个
      if (e.dataTransfer) { // todo fix win drag file
        const allFiles = e.dataTransfer.files;
        for (let i = 0, len = allFiles.length; i < len; i++) {
          if (ImageTypeLimit.includes(allFiles[i].type)) {
            this.waitReplace = null;
            this.addFile(allFiles[i]);
            break;
          }
        }
      }
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .picture_box {
    display: inline-block;
    margin-right: 10px;
    position: relative;
    width: 80px;
    height: 80px;
    text-align: center;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    background-size: cover; /* todo 提出图片显示 */
    background-position: center;
    &:hover > .picture_box-mask {
      visibility: visible;
    }
  }

  .picture_box-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    list-style: none;
    margin: 0;
    padding: 0;
    visibility: hidden;
  }

  .mask-item {
    display: inline-block;
    width: 50%;
    height: 50%;
    line-height: 40px;
    background: rgba(36, 55, 78, 0.8);
    & > i {
      color: #fff;
    }
    &:hover {
      background: rgba(36, 55, 78, 0.9);
      & > i {
        color: var(--common-blue);
      }
    }
  }

  .upload {
    margin-top: 10px;
    height: calc(60px - 2px);
    border-radius: 4px;
    text-align: center;
    line-height: calc(60px - 2px);
    border: 1px solid #C8D3DE;
    color: var(--font-color-light);
    cursor: pointer;
  }

  .upload-link {
    color: var(--common-blue);
  }

  .upload_disabled {
    cursor: not-allowed;
    background: rgb(241, 244, 246);
  }
</style>
