// 让ts识别vue的静态类型
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}
