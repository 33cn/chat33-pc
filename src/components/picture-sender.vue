<template>
  <div class="picture_sender">
    <div class="btn_wrapper">
      <button class="g-btn_default btn btn_cancel" @click="$emit('onCancel')">取消</button>
      <button class="g-btn_active btn" @click="$emit('onConfirm')">发送</button>
    </div>
    <div class="picture_wrapper">
      <vue-scroll>
        <div class="picture_box" v-for="(item, index) in list" :key="index">
          <!--<img class="picture_box-picture" :src="" alt="图片">-->
          <common-header class="picture_box-picture" :url="item.url"></common-header>
          <div class="picture_box-mask" @click="deletePicItem(index)">
            <i class="iconfont icon-shanchu picture_box-mask-icon"></i>
          </div>
        </div>
      </vue-scroll>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {PictureReaderProp} from '@/config/type';
  import CommonHeader from '@/components/common-header.vue';

  @Component({
    components: {
      CommonHeader
    }
  })
  export default class PictureSender extends Vue {
    @Prop() public list!: PictureReaderProp[];

    public deletePicItem(index: number): void {
      this.list.splice(index, 1);
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .picture_sender {
    background: var(--mask-background);
    padding: 20px;
  }

  .btn_wrapper {
    float: right;
    margin: 50px 0 0 18px;
    width: 90px;
  }

  .btn {
    width: 90px;
    height: 30px;
  }

  .btn_cancel {
    margin-bottom: 10px;
    border-color: var(--common-blue);
    background: transparent;
    color: var(--common-blue);
  }

  .picture_wrapper {
    height: 120px;
    overflow: auto;
  }

  .picture_box {
    position: relative;
    margin: 0 10px 10px 0;
    display: inline-block;
    width: 100px;
    height: 100px;
    border-radius: 4px;
    overflow: hidden;
    &:hover > .picture_box-mask {
      visibility: initial;
    }
  }

  .picture_box-picture {
    width: 100%;
    height: 100%;
    /*position: absolute;*/
    /*top: 50%;*/
    /*left: 50%;*/
    /*transform: translate(-50%, -50%);*/
    /*max-width: 100%;*/
    /*max-height: 100%;*/
  }

  .picture_box-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(36, 55, 78, 0.8);
    text-align: center;
    line-height: 100px;
    cursor: pointer;
    visibility: hidden;
  }

  .picture_box-mask-icon {
    font-size: 18px;
    color: #fff;
  }
</style>
