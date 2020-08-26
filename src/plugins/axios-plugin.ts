import axios from 'axios';
import Notify from '../plugins/NotifyPop';
import {ErrorMsg} from '@/config/config-enum';
import {ipcRenderer} from 'electron';
import platform from '@/config/platform';


/**
 * 封装axios 外部一般无需处理异常，返回非null时为请求成功并业务成功；
 */
async function post(url: string, params = {}, headers = {}, config = {}, customOnWarn?: (data: any) => boolean) {
  try {
    const res = await axios.post(url, params, {
      headers: {
        'FZM-DEVICE': 'PC',
        'FZM-DEVICE-NAME': ipcRenderer.sendSync('check_device_name'),
        'FZM-APP-ID': platform.appId, // 找币账号
        'FZM-VERSION': require('../../package').version,
        ...headers
      },
      ...config
    });

    if (res.data.result === 0) {
      return res.data.data || 'success'; // success用于占位，有些接口操作成功返回data为null
    } else {
      // 接口返回结果异常（业务异常）
      if (customOnWarn) {
        if (customOnWarn(res.data)) { // 返回true时不执行原本异常提示
          return null;
        }
      }
      Notify.fail(res.data.message);
      return null;
    }
  } catch (e) {
    if (axios.isCancel(e)) { // 主动取消
      return null;
    }
    // 网络异常
    Notify.fail({
      text: ErrorMsg.CONNECT_ERROR,
      isUnique: true
    });
    return null;
  }
}

async function get(url: string, params = {}, headers = {}) {
  try {
    const res = await axios({
      method: 'get',
      url,
      params,
      headers
    });
    if (res.data.result === 0) {
      return res.data.data;
    } else {
      /// 接口返回结果异常
      Notify.fail(res.data.message);
      return null;
    }
  } catch (e) {
    // 网络异常
    Notify.fail({
      text: ErrorMsg.CONNECT_ERROR,
      isUnique: true
    });
    return null;
  }
}


export {
  post,
  get
};
export default {
  install(Vue: any, postName: string = '$post', getName: string = '$get') {
    Object.defineProperty(Vue.prototype, postName, { value: post });
    Object.defineProperty(Vue.prototype, getName, { value: get });
  }
};
