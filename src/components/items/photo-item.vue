<template>
  <div id="photo_item" class="photo-item">
    <div class="time">
      {{listItem.timeStr}}
    </div>
    <div>
      <template v-for="item of listItem.items">
        <common-video v-if="item.width"
                      class="common"
                      :videoItem="item">
        </common-video>
        <common-header v-else
                       :url="item.url"
                       class="common"
                       @click="showViewer(item.url)">
        </common-header>
      </template>

    </div>
  </div>
</template>

<script>
  import CommonHeader from '../common-header.vue';
  import CommonVideo from '../common-video.vue';
  import Bus from '@/scripts/bus';
  import imageViewer from '@/plugins/ImageViewer/index';

  export default {
    props: ['listItem'],
    components: {
      CommonHeader,
      CommonVideo
    },
    methods: {
      showViewer(url) {
        imageViewer({
          list: [url],
          currentIndex: 0
        }, (src) => {
          Bus.$emit('relayChatPicture', src);
        });
      }
    }
  };
</script>
<style scoped>
  .photo-item {
    padding-left: 20px;
  }

  .time {
    color: #8A97A5;
    font-size: 12px;
    line-height: 1;
    padding: 3px 0 7px;
  }

  .common {
    width: 87px;
    height: 87px;
    margin: 0 4px 4px 0;
  }

</style>
