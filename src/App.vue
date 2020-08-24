<template>
  <div id="app">
    <router-view/>
    <!-- 窗口关闭/隐藏按钮(windows only) -->
    <div v-if="isWin" class="close_windows g-tool-no_drag">
      <img src="./assets/hind.svg" alt="隐藏" @click="hindWindow">
      <img src="./assets/close.svg" alt="关闭" @click="hindWindow">
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  import {State, Mutation} from 'vuex-class';
  import os from 'os';
  import {ipcRenderer} from 'electron';
  import MainPage from '@/views/main-page.vue';
  import {RouterName} from '@/config/type';

  @Component({
    components: {
      MainPage
    }
  })
  export default class App extends Vue {
    @State public isWin!: boolean;
    @Mutation public setIsWin!: () => void;

    /**
     * 点击右上角关闭或隐藏按钮触发
     * @desc 通知主进程隐藏窗口;
     */
    public hindWindow(): void {
      ipcRenderer.send('window-hind');
    }

    public created(): void {
      // 检测是否是windows（暂支持win和mac）
      if ((os.platform as any)() === 'win32') {
        this.setIsWin();
      }

      this.$router.push(RouterName.Login);
    }
  }
</script>

<style>
  @import './styles/base.css';
  @import './styles/global.css';
  @import './assets/iconfont/iconfont.css';
  @import './assets/iconfont_new/iconfont.css';

  .close_windows {
    position: fixed;
    top: 8px;
    right: 0;
    & > img {
      cursor: pointer;
      margin-right: 20px;
    }
  }
</style>
