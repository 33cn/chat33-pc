<!--
  @Author: yuanzeyu
  @Date: 2019/3/12
  @Desc: 托管账户登录组件
-->
<template>
  <div class="fzm_login">
    <div class="icon_wrapper">
      <slot name="logo"></slot>
    </div>
    <div class="input_box input_box_tel l-input_box l-input_box_tel" :style="getTelStyle">
      <div class="input_box_tel-area">+86</div>
      <div class="input_box-input_wrapper">
        <Cleave v-model="telValue"
                placeholder="请输入手机号"
                class="input_box-input"
                :style="{caretColor:colorDark}"
                :options="telOptions"
                @focus.native="telFocused=true"
                @blur.native="telFocused=false">
        </Cleave>
      </div>
      <div class="input_box-select" @click.stop="showSelect">
        <i v-show="!isSelectShowing" class="iconfont icon-xiangxia input_box-select-icon"></i>
        <i v-show="isSelectShowing" class="iconfont icon-xiangshang input_box-select-icon"></i>
      </div>
      <ul v-if="isSelectShowing"
          class="input_box_tel-menu"
          @click.stop
          :style="{background: colorLight,'box-shadow':`0 0 14px 0 ${this.colorShadow}`}">
        <li v-for="(item, index) in telMenu" @click="selectTel(item)">
          <span>{{item | formatTel}}</span>
          <i class="iconfont icon-guanbi" @click="delTelMenu(index)"></i>
        </li>
      </ul>
    </div>
    <div class="input_box input_box_check l-input_box" :style="getCheckStyle">
      <div class="input_box-input_wrapper">
        <Cleave v-model="checkValue"
                ref="checkDom"
                class="input_box-input"
                :style="{caretColor:colorDark}"
                placeholder="请输入验证码"
                :options="checkOptions"
                @focus.native="checkFocused=true"
                @blur.native="checkFocused=false">
        </Cleave>
      </div>
      <div v-show="sendCount===0&&!isSendLoading"
           class="input_box_check-btn input_box_check-btn_active"
           :style="{color:checkActive?colorDark:'#fff'}"
           :class="{'btn_submit_disable':!checkActive}"
           @click="clickSendCheck(false)">
        <span>获取验证码</span>
      </div>
      <div v-show="isSendLoading" class="input_box_check-btn input_box_check-btn_disable">
        <img class="input_box_check-btn-loading" src="../assets/loading.svg" alt="加载中">
      </div>
      <div v-show="sendCount>0" class="input_box_check-btn input_box_check-btn_disable">
        已发送{{sendCount}}s
      </div>
    </div>
    <div class="tip_wrapper">
      <span v-if="isSendVoice">请注意接听语音验证电话</span>
      <template v-if="isSendMsg">
        <span v-if="sendCount>0">短信验证码已发送，请耐心等待</span>
        <span v-else="sendCount===0">
          <span>收不到短信试试 </span>
          <span class="tip_wrapper-btn" :style="{color:colorDark}" @click="clickSendCheck(true)">语音验证</span>
        </span>
      </template>
    </div>
    <button class="btn_submit" :class="{'btn_submit_disable':!loginActive}" @click="clickLogin">注册/登录</button>
    <div ref="TCaptcha"></div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import axios from 'axios';
  import Cleave from 'vue-cleave-component';
  import URLS from '@/config/urls';
  import {LogCallback} from '@/config/type';
  import {LocalStorageUsage} from '@/config/config-enum';
  import { Getter, Mutation, State } from "vuex-class";

  declare var global: any;

  // interface ApiItem {
  //   url: string;
  //   cb?: (result: any) => void;
  // }
  //
  // interface ApiProps {
  //   sendMsg: string | ApiItem;
  //   sendVoice: string | ApiItem;
  //   checkReg: string | ApiItem;
  //   login: string | ApiItem;
  //   reg: string | ApiItem;
  // }

  @Component({
    components: {Cleave},
    filters: {
      formatTel(val: string) {
        return `${val.substr(0, 3)} ${val.substr(3, 4)} ${val.substr(7, 4)}`;
      }
    }
  })
  export default class FzmLogin extends Vue {
      @Mutation public setIsReg!: (isReg: boolean) => void;
    // @Prop({
    //   required: true,
    //   type: Object
    // })
    // public api!: ApiProps;
    @Prop({
      required: true,
      type: Object
    })
    public cb!: LogCallback;
    @Prop({default: false}) public btnDisable!: boolean;
    @Prop({default: '#32B2F7'}) public colorDark!: string;
    @Prop({default: '#EAF6FF'}) public colorLight!: string;
    @Prop({default: '#CFDFE9'}) public colorShadow!: string;

    public get getTelStyle() {
      return this.getStyle(this.telFocused);
    }

    public get getCheckStyle() {
      return this.getStyle(this.checkFocused);
    }

    public telValue: string = '';
    public checkValue: string = '';
    public telFocused: boolean = false; // 手机号输入框聚焦
    public checkFocused: boolean = false; // 验证码输入框聚焦
    public isSelectShowing: boolean = false;
    public telOptions: any = {
      numericOnly: true,
      blocks: [3, 4, 4]
    };
    public checkOptions: any = {
      numericOnly: true,
      blocks: [6]
    };
    public telMenu: string[] = [];

    public sendCount: number = 0;
    public isSendVoice: boolean = false;
    public isSendMsg: boolean = false;
    public isSendLoading: boolean = false;
    public businessId: string = '';

    public get checkActive(): boolean {
      return this.telValue.length === 11;
    }

    public get loginActive(): boolean {
      return this.checkActive && this.checkValue.length === 6 && !this.btnDisable;
    }

    /**
     * 点击发送验证码
     * @desc 开始loading,掉发送验证码，如果返回需验证，验证后再次掉发送验证码,结束loading
     */
    public async clickSendCheck(isVoice: boolean) {
      if (!this.checkActive) {
        return;
      }
      try {
        this.isSendLoading = true;
        const checkPms = isVoice ? this.submitSendVoice : this.submitSendMsg;
        const data = await checkPms();
        const res = data as any;
        if (res.isShow) { // 需要滑动验证码
          this.businessId = res.data.businessId;
          await this.createScript(res.data.jsUrl);
          const ticket = await this.initCap(this.$refs.TCaptcha);
          await checkPms(ticket as string);
        }

        // 结束loading开始计时
        this.isSendLoading = false;
        this.isSendVoice = isVoice;
        this.isSendMsg = !isVoice;
        this.startCount();
        (this.$refs.checkDom as any).$el.focus(); // 自动聚焦到输入框

      } catch (msg) {
        if (msg !== 'user cancel check') { // 非用户取消
          this.$notify.fail(msg);
        }
        this.isSendLoading = false;
      }
    }

    /**
     * 登录按钮点击
     * @desc 先检测是否已注册，已注册则调登录,未注册则调注册再登录，catch异常提示字符串
     */
    public async clickLogin() {
      if (!this.loginActive) {
        return;
      }
      if (this.cb.onClickLogin) {
        this.cb.onClickLogin();
      }
      try {
        const isReg = await this.checkIsReg();
        this.setIsReg(isReg);
        if (!isReg) {
          await this.submitSign();
          if (this.cb.onRegSuccess) {
            this.cb.onRegSuccess();
          }
        }
        const token = await this.submitLogin();
        this.syncTelLog(this.telValue); // todo tel 提前const
        if (this.cb.onLogSuccess) {
          this.cb.onLogSuccess(token);
        }
      } catch (msg) {
        if (msg !== '主动取消') {
          if (this.cb.onFail) {
            this.cb.onFail();
          }
          this.$notify.fail(msg);
        }
      }
    }

    public showSelect() {
      if (!this.isSelectShowing) {
        this.telMenu = this.getTelLogs();
        this.isSelectShowing = true;
        const handleBlur = () => {
          this.isSelectShowing = false;
          document.body.removeEventListener('click', handleBlur);

        };
        document.body.addEventListener('click', handleBlur);
      } else {
        this.isSelectShowing = false;
      }
    }

    public selectTel(tel: string) {
      this.telValue = tel;
      this.isSelectShowing = false;
    }

    public syncTelLog(newTel: string) {
      const tels = this.getTelLogs();
      const exist = tels.indexOf(newTel);
      if (exist > -1) {
        tels.splice(exist, 1);
      }
      tels.unshift(newTel);
      localStorage.setItem(LocalStorageUsage.LogTelList, JSON.stringify(tels));
    }

    public delTelMenu(index: number) {
      this.telMenu.splice(index, 1);
      localStorage.setItem(LocalStorageUsage.LogTelList, JSON.stringify(this.telMenu));
    }

    public created() {
      const tels = this.getTelLogs();
      this.telValue = tels.shift() || '';
    }

    private getStyle(isFocused: boolean) {
      if (isFocused) {
        return `background:#fff;box-shadow:0 0 14px 0 ${this.colorShadow};`;
      }
      return `background:${this.colorLight}`;
    }

    private startCount() {
      this.sendCount = 60;
      const timer = setInterval(() => {
        this.sendCount -= 1;
        if (this.sendCount === 0) {
          clearInterval(timer);
        }
      }, 1000);
    }

    /**
     * 请求验证码，返回内部data对象
     */
    private async submitSendMsg(ticket: string = '') {
      const param = {
        area: '86',
        mobile: this.telValue,
        codetype: 'quick',
        param: 'FzmRandom',
        businessId: this.businessId,
        ticket
      };
      return await this.ajax(URLS.TG_SEND_MSG, param);
    }

    private async submitSendVoice(ticket: string = '') {
      const param = {
        area: '86',
        mobile: this.telValue,
        codetype: 'quick',
        param: 'FzmRandom',
        businessId: this.businessId,
        ticket
      };
      return await this.ajax(URLS.TG_SEND_VOICE, param);
    }

    /**
     * 创建滑动验证脚本
     */
    private createScript(src: string) {
      const deUrl = this.unescapeHTML(src); // 托管账户接口url为实体HTML,需还原
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = deUrl;
        script.onload = () => {
          resolve();
        };
        script.onerror = () => {
          reject('加载图形验证码失败');
        };
        document.body.appendChild(script);
      });
    }

    /**
     * 显示滑动验证
     */
    private initCap(dom: any) {
      return new Promise((resolve, reject) => {
        const capOption = {
          callback: (result: any) => {
            global.capDestroy();
            if (result.ret === 0) {
              resolve(result.ticket);
            }
            reject('user cancel check');
          },
          type: 'popup',
          pos: 'fixed'
        };
        global.capInit(dom, capOption);
      });
    }

    /**
     * 提交登录
     */
    private async submitLogin(): Promise<string> {
      const data = await this.ajax(URLS.TG_USER_LOGIN, {
        reg_type: 'mobile',
        mobile: this.telValue,
        area: '86',
        code: this.checkValue,
        type: 'sms'
      });
      return (data as any).access_token;
    }

    /**
     * 提交注册
     */
    private async submitSign() {
      return await this.ajax(URLS.TG_USER_REG, {
        reg_type: 'mobile',
        mobile: this.telValue,
        area: '86',
        code: this.checkValue,
        type: 'sms'
      });
    }

    /**
     * 获取是否已注册
     */
    private async checkIsReg(): Promise<boolean> {
      const data = await this.ajax(URLS.TG_CHECK_REG, {
        reg_type: 'mobile',
        mobile: this.telValue,
        area: '86'
      });
      return (data as any).isreg === 1;
    }

    private unescapeHTML(escapeHTML: string) {
      return escapeHTML.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, `'`);
    }

    private ajax(url: string, param: any) {
      return new Promise((resolve, reject) => {
        const source = axios.CancelToken.source();
        this.$emit('request', source);
        axios({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'FZM-REQUEST-OS': 'web',
            'FZM-USER-IP': global.returnCitySN.cip,
            'FZM-REQUEST-UUID': '',
            'FZM-REQUEST-SOURCE': 'chat'
          },
          data: require('querystring').stringify(param),
          cancelToken: source.token
        }).then((res) => {
          if (res.data.code === 200) {
            resolve(res.data.data);
          }
          reject(res.data.message);
        }).catch((e) => {
          if (axios.isCancel(e)) {
            reject('主动取消');
          }
          reject('请求失败');
        });
      });
    }

    private getTelLogs(): string[] {
      const local = localStorage.getItem(LocalStorageUsage.LogTelList);
      if (local) {
        return JSON.parse(local);
      }
      return [];
    }

  }
</script>

<style scoped>
  .fzm_login {
    text-align: center;
    font-size: 0;
    font-weight: bold;
  }

  .input_box {
    height: 36px;
    display: flex;
    text-align: center;
    line-height: 36px;
    border-radius: 4px;
    font-size: 16px;
  }

  .l-input_box {
    margin: 0 auto;
  }

  .l-input_box_tel {
    margin: 40px auto 20px;
  }

  .input_box_tel {
    height: 40px;
    line-height: 40px;
    position: relative;
  }

  .input_box_check {
    padding: 2px 2px 2px 3px;
  }


  .input_box_tel-area {
    width: 80px;
  }

  .input_box-select {
    width: 40px;
    cursor: pointer;
  }

  .input_box_tel-menu {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    border-radius: 4px;
    overflow: hidden;

    & > li {
      position: relative;
      height: 50px;
      line-height: 50px;
      background: #fff;
      cursor: pointer;

      & > i {
        position: absolute;
        top: 0;
        right: 20px;
        font-size: 14px;
        color: #8A97A5;
        visibility: hidden;
      }

      &:hover {
        background: transparent;

        & > i {
          visibility: visible;
        }
      }
    }
  }

  .input_box-select-icon {
    font-size: 6px;
    color: #8A97A5;
    vertical-align: middle;
  }

  .input_box-input_wrapper {
    flex: 1;
  }

  .input_box-input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    line-height: 22px;
    outline: none;
    border: none;
    text-align: center;
    font-family: inherit;
    font-size: inherit;
    background: transparent;
    vertical-align: top;
    font-weight: inherit;
  }

  .input_box-input::-webkit-input-placeholder {
    font-weight: 400;
    color: #8A97A5;
  }

  .input_box_check-btn {
    width: 100px;
    font-size: 14px;
    font-weight: 400;
  }

  .input_box_check-btn_active {
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }

  .input_box_check-btn_disable {
    color: #8A97A5;
  }

  .input_box_check-btn-loading {
    width: 14px;
    display: block;
    animation: rotating 2s linear infinite;
    margin: 11px auto 0;
  }

  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(1turn);
    }
  }

  .tip_wrapper {
    height: 60px;
    width: 100%;
    font-weight: 400;
    line-height: 60px;
    color: #8A97A5;
    font-size: 14px;
  }

  .tip_wrapper-btn {
    cursor: pointer;
  }

  .btn_submit {
    width: 100%;
    height: 40px;
    color: #fff;
    text-align: center;
    border-radius: 4px;
    background: #32B2F7;
    border-color: #32B2F7; /* 未屏蔽按下inset */
    outline: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
  }

  .btn_submit_disable {
    background: #C8D3DE;
    cursor: not-allowed;
    border: none;
    color: #fff;
  }
</style>
