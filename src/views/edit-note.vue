<!--
  @Author: yuanzeyu
  @Date: 2019/2/13
  @Desc: 编辑更多备注
-->
<template>
  <common-dialog title="添加更多备注" :showing.sync="showing">
    <div class="list_wrapper">
      <vue-scroll>
        <div class="list">
          <!-- 编辑图片备注 -->
          <h2 class="title">
            <span>图片</span>
            <span class="title-count">{{picList.length}}/{{FormLimit.NotePicture}}</span>
          </h2>
          <picture-note :picList="picList"></picture-note>
          <!-- 编辑电话备注  -->
          <h2 class="title">
            <span>电话</span>
            <span class="title-count">{{telList.length}}/{{FormLimit.NoteTel}}</span>
          </h2>
          <tel-editor :telList="telList" :transitionActive="transitionActive"></tel-editor>
          <!-- 编辑描述备注 -->
          <h2 class="title">
            <span>描述</span>
            <span class="title-count">{{descBindValue.length}}/{{FormLimit.NoteDesc}}</span>
          </h2>
          <textarea class="desc_input"
                    v-model="descBindValue"
                    placeholder="添加描述备注信息"
                    v-autosize
                    :maxlength="FormLimit.NoteDesc">
          </textarea>
        </div>
      </vue-scroll>
    </div>
    <div class="btn_wrapper">
      <button class="g-btn_default btn" @click="cancelEdit">取消</button>
      <button class="g-btn_active btn" @click="submitEditNote">确定</button>
    </div>
  </common-dialog>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import autosize from 'v-autosize';
  import Friend from '@/object/targets/Friend';
  import {upLoadOssFile} from '@/scripts/common';
  import {FormLimit} from '@/config/config-enum';
  import {NoteTel, PicItem} from '@/config/type';
  import CommonDialog from '@/components/common-dialog.vue';
  import TelEditor from './tel-editor.vue';
  import PictureNote from './picture-note.vue';
  import URLS from '../config/urls';

  @Component({
    components: {
      CommonDialog,
      TelEditor,
      PictureNote
    },
    directives: {
      autosize
    }
  })
  export default class EditNote extends Vue {
    @Prop() public target!: Friend;
    @Prop() public show!: boolean; // sync

    public picList: PicItem[] = [];
    public telList: NoteTel[] = [];
    public descBindValue: string = '';
    public transitionActive: boolean = false;
    public FormLimit = FormLimit;

    public get showing(): boolean {
      return this.show;
    }

    public set showing(val: boolean) {
      this.$emit('update:show', val);
    }

    public cancelEdit() {
      this.$emit('update:show', false);
    }

    public submitEditNote() {
      const uploadPicPms: any = [];
      this.picList.forEach((item) => {
        if (item.file) {
          uploadPicPms.push(this.uploadPicture(item));
        }
      });
      Promise.all(uploadPicPms).then(() => {
        this.doSubmit().then(() => {
          this.target.getFriendDetail();
          this.$emit('update:show', false);
        });
      }).catch(() => {
        this.$notify.fail('上传图片失败！');
      });

    }

    /**
     * 图片上传到oss，url更新为oss url
     */
    public uploadPicture(pic: PicItem) {
      return new Promise((resolve, reject) => {
        upLoadOssFile({
          fileBlob: pic.file,
          type: 'note',
          userId: this.target.id
        }).then((res: any) => {
          pic.url = res.url;
          resolve();
        }).catch(() => {
          reject();
        });
      });
    }

    /**
     * 提交编辑备注
     */
    public doSubmit(): Promise<any> {
      const tels = this.telList.filter((item) => {
        return item.label.length > 0 && item.value.length > 0;
      });
      return this.$post(URLS.SET_DETAIL_NOTE, {
        id: this.target.id,
        remark: this.target.remark,
        telephones: tels.map((item) => {
          return {
            remark: item.label,
            phone: item.value
          };
        }),
        description: this.descBindValue,
        pictures: this.picList.map((item) => item.url)
      });
    }


    public created() {
      const target = this.target;
      target.getFriendDetail().then(() => { // 刷新详情
        this.picList = target.notePictures.map((item) => {
          return {
            url: item,
            file: null,
            isDataUrl: false
          };
        });
        this.telList = target.noteTels.map((item) => item);
        this.descBindValue = target.noteDesc;
        this.$nextTick(() => {
          this.transitionActive = true; // 加载完成后再开启手机号列表动画
        });
      });
    }


  }
</script>

<style scoped>
  @import '../styles/var.css';

  .list_wrapper {
    height: calc(440px - 50px - 80px);
  }

  .list {
    padding: 0 20px 30px 20px;
  }

  .title {
    margin: 0 0 10px 0;
    line-height: 20px;
    color: var(--font-color-light);
    font-size: var(--normal-font-size);
    font-weight: 500;
    &:not(:first-child) {
      margin-top: 20px;
    }
  }

  .title-count {
    float: right;
  }

  .desc_input {
    min-height: 60px;
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    font-size: var(--normal-font-size);
    color: var(--font-color-dark);
    line-height: 20px;
    outline: none;
    border: none;
    background: var(--gray-background);
    border-radius: 4px;
  }

  .btn_wrapper {
    margin: 20px 0 30px 0;
    text-align: center;
  }

  .btn {
    width: 90px;
    height: 30px;
    &:first-child {
      margin-right: 20px;
    }
  }
</style>
