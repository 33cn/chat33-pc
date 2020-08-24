/**
 * @Author: yuanzeyu
 * @Date: 2018/7/23
 * @Desc:
 */
import Vue from 'vue';
import component from './ImageViewer.vue';
import SnapImageMsg from '@/object/messages/snapMsg/SnapImageMsg';

interface MultiMsg {
  list: string[];
  currentIndex: number;
  msgWhenSnap: SnapImageMsg | null;
}

export default function(param: string | MultiMsg, onRelay?: (src: string) => void) {
  const ImageViewer = Vue.extend(component);
  const vm: any = new ImageViewer().$mount();
  const dom = vm.$el;
  if (typeof param === 'string') {
    vm.src = param as string;
  } else {
    const data = param as MultiMsg;
    vm.list = data.list;
    vm.currentIndex = data.currentIndex;
    vm.msgWhenSnap = data.msgWhenSnap;
  }
  vm.onRelay = onRelay || null;
  document.body.appendChild(dom);
}
