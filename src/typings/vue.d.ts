import Vue from 'vue'; // 不能移除

interface ObjectParam {
  text: string;
  isUnique?: boolean; // 用于网络异常，同时仅显示一个
  onClose?: () => void;
  time?: number; // 持续时间
}

interface Method {
  success: (param: string | ObjectParam) => void;
  fail: (param: string | ObjectParam) => void;
}

declare module 'vue/types/vue' {
  interface Vue {
    $post: any;
    $get: any;
    $notify: Method;
    $toast: (text: string) => void;
    $convert: any
  }
}
