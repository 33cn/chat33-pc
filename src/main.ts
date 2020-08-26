// Make sure to register before importing any components
import './class-component-hooks';
import Vue from 'vue';
import linkify from 'vue-linkify';
import App from './App.vue';
import axiosPlugin from './plugins/axios-plugin';
import Notify from './plugins/NotifyPop';
import Toast from './plugins/Toast';
import store from './store';
// @ts-ignore
import vuescroll from 'vuescroll/dist/vuescroll-native';
import 'vuescroll/dist/vuescroll.css';
import router from './router';
import {formatSize} from '@/utils/tool';
// import { VirtualScroller } from 'vue-virtual-scroller';
// import VueRecyclerviewNew from 'vue-recyclerview';
import Cell from "vant/lib/cell";
import 'vant/lib/cell/style';
import IndexBar from "vant/lib/index-bar";
import 'vant/lib/index-bar/style';
import IndexAnchor from "vant/lib/index-anchor";
import 'vant/lib/index-anchor/style';
import Icon from "vant/lib/icon";
import 'vant/lib/icon/style';

Vue.use(axiosPlugin);
Vue.use(Notify);
Vue.use(Toast);
Vue.use(IndexBar);
Vue.use(IndexAnchor);
Vue.use(Cell);
Vue.use(Icon);

Vue.use(vuescroll, {
  ops: {
    // vuescroll: {
    //   sizeStrategy: 'number'
    // },
    rail: {
      gutterOfSide: '2px',
      size: '8px'
    },
    bar: {
      showDelay: 5000,
      background: '#DCE5EB',
      size: '8px',
      hoverStyle: {
        background: '#B2BCC6'
      },
      keepShow: false,
      specifyBorderRadius: '4px',
      minSize: '0.1'
    }
  }
});

Vue.directive('linkified', linkify);
Vue.filter('formatSize', (byte: number) => formatSize(byte));
// Vue.component('virtual-scroller', VirtualScroller);
Vue.config.productionTip = false;

new Vue({
  store,
  router,
  
  render: (h) => h(App)
}).$mount('#app');
