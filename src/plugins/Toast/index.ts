/**
 * @Author: yuanzeyu
 * @Date: 2018/11/23
 * @Desc: 右键菜单组件
 */
import Vue from 'vue';
import component from './view.vue';

interface showToastConfigure {
  isLike: boolean
}

function showToast(text: string, config?: showToastConfigure) {
  const Toast = Vue.extend(component);
  const vm: any = new Toast().$mount();
  vm.text = text;
  if (config && 'isLike' in config) {
    vm.isLike = config.isLike
  };
  document.body.appendChild(vm.$el);
}

export {
  showToast
};

export default {
  install(vue: any, funcName: string = '$toast') {
    Object.defineProperty(vue.prototype, funcName, { value: showToast });//第三个参数属性描述符{value:null,writable:true,enumerable:true,configurable:true}
  }
};
