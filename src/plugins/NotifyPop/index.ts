import Vue from 'vue';
import NotifyPop from './view.vue';

interface Method {
  success: (param: string | ObjectParam) => void;
  fail: (param: string | ObjectParam) => void;
}

interface ObjectParam {
  text: string;
  isUnique?: boolean; // 用于网络异常，同时仅显示一个
  onClose?: () => void;
  time?: number; // 持续时间
}

function showNotify(isSuccess: boolean) {
  return (param: string | ObjectParam) => {

    const UNIQUE_ID = 'notify-pop-dom-id';

    let text = param as string;
    let isUnique = false;
    let cb = null;
    let time = 0;

    if (typeof param !== 'string') {
      const paramObject = param as ObjectParam;
      text = paramObject.text;
      isUnique = paramObject.isUnique || false;
      cb = paramObject.onClose || null;
      time = paramObject.time || 0;
    }

    if (isUnique) {
      if (document.getElementById(UNIQUE_ID)) {
        return;
      }
    }

    const Pop = Vue.extend(NotifyPop);
    const vm: any = new Pop();

    vm.isSuccess = isSuccess;
    vm.text = text;
    vm.callback = cb;
    if (time) {
      vm.time = time;
    }

    vm.$mount();

    const dom = vm.$el;
    if (isUnique) {
      dom.setAttribute('id', UNIQUE_ID);
    }
    document.body.appendChild(dom);

  };
}

const object: Method = {
  success: showNotify(true),
  fail: showNotify(false)
};



export default {
  install(vue: any, funcName: string = '$notify') {
    Object.defineProperty(vue.prototype, funcName, {value: object});
  },
  success: object.success,
  fail: object.fail
};
