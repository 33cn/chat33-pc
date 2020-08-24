/**
 * @Author: yuanzeyu
 * @Date: 2018/11/23
 * @Desc: 右键菜单组件
 */
import Vue from 'vue';
import component from './view.vue';

export default function(itemList: any[], e: MouseEvent, isLeft: boolean, onCloseMenu?: () => void ) { // todo type contentMenu
  const ContextMenu = Vue.extend(component);
  const vm: any = new ContextMenu().$mount();
  const ITEM_HEIGHT = 35;
  const bottomNotEnough = document.body.clientHeight - e.clientY < itemList.length * ITEM_HEIGHT;
  const dom = vm.$el;
  vm.itemList = itemList;
  vm.pointX = e.clientX;
  vm.pointY = e.clientY;
  vm.isLeft = isLeft;
  if (onCloseMenu) {
    vm.onCloseMenu = onCloseMenu;
  }
  if (bottomNotEnough) {
    vm.pointY = e.clientY - itemList.length * ITEM_HEIGHT;
  }
  document.body.appendChild(dom);
}
