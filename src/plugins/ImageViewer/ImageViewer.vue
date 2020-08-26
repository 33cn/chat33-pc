<template>
  <div class="image_viewer-module" ref="viewerDom" @click.stop="close" @mousewheel.prevent="handleMouseWheel($event)">
    <!-- todo 整理loader组件 -->
    <div v-if="msgWhenSnap" class="m-snap_begin" :style="`width:${beginWidth}px`"></div>
    <div v-if="msgWhenSnap" class="m-loading_wrapper" :style="`left:${beginWidth}px`">
      <div class="m-snap_loading" :style="`animation-duration:${remainTime}s`"></div>
    </div>
    <div v-if="msgWhenSnap" class="m-snap_count">{{msgWhenSnap.snapCount}}</div>

    <img class="m-img"
         :style="{transform: `translate(-50%, -50%) scale(${zoom}) rotate(${rotateDeg}deg)`, top: imgTop, left: imgLeft}"
         :src="src || list[currentIndex]"
         ref="imageDom"
         alt="图片"
         @mousedown="startDragImg"
         @mouseup="endDragImg"
         draggable="false"
         @contextmenu.prevent="showContextMenu($event)"
         @click.stop/>

    <div class="m-nav_wrapper g-tool-no_drag" @mouseenter="leftShowing=true" @mouseleave="leftShowing=false">
      <transition name="fade">
        <img class="m-nav m-nav_prev"
             v-if="currentIndex !== 0 && !src"
             v-show="leftShowing"
             src="../../assets/viewerPrev.svg"
             @click.stop="currentIndex -= 1"
             alt="上一个">
      </transition>
    </div>
    <div class="m-nav_wrapper_right g-tool-no_drag" @mouseenter="rightShowing=true" @mouseleave="rightShowing=false">
      <transition name="fade">
        <img v-show="rightShowing" class="m-close g-tool-no_drag" src="../../assets/viewerClose.svg" alt="关闭">
      </transition>
      <transition name="fade">
        <img class="m-nav m-nav_next"
             v-if="currentIndex !== list.length - 1 && !src"
             v-show="rightShowing"
             src="../../assets/viewerNext.svg"
             @click.stop="currentIndex += 1"
             alt="下一个">
      </transition>
    </div>

    <div class="m-menu_wrapper" @mouseenter="menuShowing=true" @mouseleave="menuShowing=false">
      <transition name="fade">
        <ul v-show="menuShowing" class="m-menu" @click.stop>
          <li @click="handleReduce"><i class="iconfont icon-suoxiao"></i></li>
          <li class="m-men-percent">{{Math.round(zoom * 100)}}%</li>
          <li @click="zoom+=0.1"><i class="iconfont icon-fangda"></i></li>
          <li>
            <i v-show="resizeShowing" class="iconfont icon-icon-test" @click="handleResize"></i>
            <i v-show="!resizeShowing" class="iconfont icon-quanping" @click="fullScreen"></i>
          </li>
          <li @click="handleRotate"><i class="iconfont icon-xuanzhuan"></i></li>
          <li v-if="!msgWhenSnap" @click="handleRelay"><i class="iconfont icon-zhuanfa"></i></li>
          <li v-if="!msgWhenSnap" @click="downloadImage"><i class="iconfont icon-baocun"></i></li>
        </ul>
      </transition>
    </div>

  </div>
</template>

<script>
import {getBase64} from '../../scripts/common';
import showContextMenu from '../../plugins/ContextMenu';
import {ipcRenderer} from 'electron';
import Bus from '../../scripts/bus';
import {copy2Clipboard} from '../../utils/app';
import SnapImageMsg from '@/object/messages/snapMsg/SnapImageMsg';

export default {
  name: 'ImageViewer',
  data() {
    return {
      src: '',
      zoom: 1,
      list: [],
      currentIndex: 0,
      msgWhenSnap: null,
      beginWidth: 0,
      leftWidth: 0,
      remainTime: 0,
      timer: '',
      leftShowing: false,
      rightShowing: false,
      menuShowing: false,
      resizeShowing: true,
      imageSizeW: 0,
      imageSizeH: 0,
      rotateDeg: 0,
      onRelay: null,
      dragEnable: true,
      imgTop: '50%',
      imgLeft: '50%'
    };
  },
  methods: {
    close() {
      document.body.removeChild(this.$el);
      this.$destroy();
    },
    /**
     * 鼠标滚轮放大缩小
     * @desc 接触最大宽度高度限制，每次滚动调整zoom
     * @param e
     */
    handleMouseWheel(e) {
      if (e.deltaY < 0) {
        this.zoom += 0.05;
      } else if (this.zoom - 0.05 > 0.1) {
        this.zoom -= 0.05;
      } else {
        this.zoom = 0.1;
      }
    },
    handleReduce() { // 点击缩小：最小缩小到10%
      if (this.zoom > 0.2) {
        this.zoom -= 0.1;
      } else {
        this.zoom = 0.1;
      }
    },
    handleResize() {
      this.resetPostion();
      this.resizeShowing = false;
      this.zoom = this.$refs.imageDom.naturalWidth / this.imageSizeW;
    },
    fullScreen() {
      this.resetPostion();
      this.resizeShowing = true;
      const width = this.$el.clientWidth;
      const height = this.$el.clientHeight;
      const heightFullWidth = width * this.imageSizeH / this.imageSizeW;
      if (heightFullWidth < height) {
        this.zoom = heightFullWidth / this.imageSizeH;
      } else {
        this.zoom = height / this.imageSizeH;
      }
    },
    setDefaultSize() {
      const dom = this.$refs.imageDom;
      dom.onload = () => {
        this.imageSizeW = dom.clientWidth;
        this.imageSizeH = dom.clientHeight;
      };
    },
    handleRotate() {
      if (this.rotateDeg === 270) {
        this.rotateDeg = 0;
      } else {
        this.rotateDeg += 90;
      }
    },
    async downloadImage() {
      const imageBase64 = await getBase64(this.$refs.imageDom.src);
      ipcRenderer.send('show-save-dialog', imageBase64);
    },
    /**
     * 点击转发
     */
    handleRelay() {
      const src = this.src || this.list[this.currentIndex];
      if (this.onRelay) {
        this.onRelay(src); // 触发逐条转发聊天图片（外部处理）
      } else {
        Bus.$emit('onRelayPicture', src); // 触发作为普通消息转发图片
      }
    },
    showContextMenu(e) {
      if (!this.msgWhenSnap) {
        const menuItems = [];
        menuItems.push({
          label: '复制',
          onClick: () => {
            copy2Clipboard(true, this.src || this.list[this.currentIndex]);
          }
        });
        menuItems.push({
          label: '转发',
          onClick: () => {
            this.handleRelay();
          }
        });
        menuItems.push({
          label: '保存',
          onClick: () => {
            this.downloadImage();
          }
        });
        showContextMenu(menuItems, e, false);
      }
    },
    startDragImg(e) {
      const dom = this.$refs.imageDom;
      const movedX = e.clientX - this.$refs.imageDom.offsetLeft;
      const movedY = e.clientY - this.$refs.imageDom.offsetTop;
      dom.onmousemove = (event) => {
        this.imgTop = `${event.clientY - movedY}px`;
        this.imgLeft = `${event.clientX - movedX}px`;
      };
    },
    endDragImg() {
      this.$refs.imageDom.onmousemove = null;
    },
    resetPostion() {
      this.imgTop = '50%';
      this.imgLeft = '50%';
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.msgWhenSnap) {
        const msg = this.msgWhenSnap;
        const dom = this.$refs.viewerDom;
        const width = dom.clientWidth;
        const allCount = SnapImageMsg.SNAP_COUNT;
        this.remainTime = msg.snapCount;
        this.timer = setTimeout(() => {
          this.close();
        }, this.remainTime * 1000);
        this.beginWidth = (allCount - msg.snapCount) / allCount * width;
        this.leftWidth = width - this.beginWidth;
      }
      this.setDefaultSize();
    });
  },
  beforeDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
};
</script>

<style scoped>
  @import '../../styles/var.css';

  .image_viewer-module {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: var(--mask-background);
    z-index: 9999;
    text-align: center;
    overflow: auto;
  }

  .m-img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 60%;
    max-height: 80%;
  }

  .m-close {
    position: absolute;
    top: 30px;
    right: 30px;
    cursor: pointer;
  }

  .m-nav {
    position: absolute;
    top: 50%;
    margin-top: -25px;
    cursor: pointer;
  }

  .m-nav_wrapper {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 200px;
  }

  .m-nav_wrapper_right {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 200px;
  }

  .m-nav_prev {
    left: 30px;
  }

  .m-nav_next {
    right: 30px;
  }

  .m-snap_begin {
    position: absolute;
    top: 0;
    left: 0;
    height: 4px;
    background: #EF883E;
  }

  .m-snap_loading {
    height: 4px;
    background: #EF883E;
    border-radius: 0 12px 12px 0;
    animation-name: progress;
    animation-timing-function: linear;
  }

  .m-loading_wrapper {
    position: absolute;
    top: 0;
    right: 0;
  }

  .m-snap_count {
    position: absolute;
    top: 8px;
    right: 35px;
    width: 20px;
    height: 14px;
    background: #EF883E;
    border-radius: 7px;
    font-size: 10px;
    line-height: 14px;
    color: #fff;
  }

  @keyframes progress {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity 1s;
  }

  .fade-enter, .fade-leave-to {
    opacity: 0;
  }

  .m-menu_wrapper {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 120px;
  }

  .m-menu {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    display: inline-block;
    margin: 0;
    padding: 0 20px;
    font-size: 0;
    background: rgba(20, 46, 77, 0.7);
    border-radius: 20px;

    & > li {
      display: inline-block;
      vertical-align: top;
      width: 40px;
      height: 40px;
      text-align: center;
      line-height: 40px;
      color: #B2BCC6;
      cursor: pointer;
    }

    & > .m-men-percent {
      font-size: 14px;
      cursor: initial;
    }

    & i {
      color: #B2BCC6;
    }

    & i:hover {
      color: var(--icon-active-color);
    }
  }
</style>
