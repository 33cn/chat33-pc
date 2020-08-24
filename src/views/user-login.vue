<!--
  @Author: yuanzeyu
  @Date: 2018/11/19
  @Desc: 用户登录
-->
<template>
  <div id="user-login">
    <!-- 可拖拽条 -->
    <div class="drag_bar_tool g-tool-drag"></div>
    <fzm-login class="fzm_login" :btnDisable="!updateChecked" :cb="logCb" @request="updateSource">
      <img slot="logo" class="fzm_login-logo" :src="PlatformConfig.Logo" :alt="PlatformConfig.name" />
    </fzm-login>
    <login-loading v-if="logging" @cancel="cancelLogging"></login-loading>
    <!-- 版本更新弹窗 -->
    <update-dialog
      v-if="updateInfo"
      :updateInfo="updateInfo"
      @onCancel="cancelUpdate"
      :noRadius="true"
    ></update-dialog>
    <!-- 被其他端登录顶出提示 -->
    <confirm-dialog v-show="logOffMsg" :showCancel="false" @confirm="logOffMsg=''">
      <div>{{logOffMsg}}</div>
    </confirm-dialog>
    <confirm-dialog v-if="banUserShowing" :showCancel="false" @confirm="onBannedConfirm">
      <div v-if="banUserMessage">{{banUserMessage}}</div>
      <template v-else>
        <div
          v-if="banUserEndTime===FOREVER_TIME"
        >该账号已被查封，如需解封可联系客服：{{PlatformConfig.CustomerServer}}</div>
        <div v-else>
          该账号已被查封至
          <span>{{banUserEndTime | formatDateString}}</span>
          ，如需解封可联系客服：{{PlatformConfig.CustomerServer}}
        </div>
      </template>
    </confirm-dialog>
  </div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';
import { Route } from 'vue-router';
import axios, { CancelTokenSource } from 'axios';
import { LogCallback, RouterName } from '@/config/type';
import ConfirmDialog from '@/components/confirm-dialog.vue';
import UpdateDialog from '@/components/update-dialog.vue';
import FzmLogin from '@/components/fzm-login.vue';
import LoginLoading from '@/views/login-loading.vue';
import URLS from '@/config/urls';
import { UserLoggedInfo } from '@/scripts/object';
import { Mutation } from 'vuex-class';
import { FOREVER_TIME } from '@/config/const-enums';
import PlatformConfig from '@/config/platform';
import { ResWarnCode } from '@/config/apiTypes/base';
import { formatDateString } from '@/utils/tool';
import Datasource from "@/scripts/data-source";

@Component({
  components: { ConfirmDialog, UpdateDialog, FzmLogin, LoginLoading },
  filters: {
    formatDateString(val: number): string {
      return formatDateString(val);
    }
  }
})
export default class UserLogin extends Vue {
  @Mutation public setMyInfo!: (myInfo: UserLoggedInfo | null) => void;
  @Mutation public setDatasource!: (datasource: Datasource) => void;
  public logOffMsg: string = ''; // 被其他端顶出的提示内容
  public updateChecked: boolean = false; // 已检测到无更新
  public updateInfo: any = null; // 版本更新信息
  public logging: boolean = false;
  public cancelSource: CancelTokenSource | null = null;
  public banUserShowing: boolean = false;
  public banUserEndTime: number = 0;
  public banUserMessage: string = '';
  public FOREVER_TIME = FOREVER_TIME;
  public PlatformConfig = PlatformConfig;

  public get logCb(): LogCallback {
    return {
      onClickLogin: () => {
        this.logging = true;
      },
      onFail: () => {
        this.logging = false;
      },
      onRegSuccess: () => {
        this.$notify.success('注册成功');
      },
      onLogSuccess: (token) => {
        this.tokenLogin(token);
      }
    };
  }

  /**
   * 登录聊天系统
   * @desc 使用找币token登录聊天系统，成功后展开窗口
   */
  public async tokenLogin(token: string): Promise<void> {
    this.cancelSource = axios.CancelToken.source();
    const data = await this.$post(
      URLS.TOKEN_LOGIN,
      {
        type: 2,
        cid: ''
      },
      {
        'FZM-AUTH-TOKEN': token,
        'FZM-UUID': ipcRenderer.sendSync('getMac')
      },
      {
        cancelToken: this.cancelSource.token
      },
      this.onLogWarn
    );
    if (data) {
      const myInfo = new UserLoggedInfo(data);
      this.setMyInfo(myInfo);
      this.setDatasource(Datasource.getInstance(myInfo.id)); //连接数据库，这里必须是登录后第一次创建实例
      this.$router.push(RouterName.Main);
    } else {
      this.logging = false;
    }
  }
  
  /**
   * 更新登录组件的取消axios请求token
   */
  public updateSource(source: CancelTokenSource) {
    this.cancelSource = source;
  }

  /**
   * 取消登录
   */
  public cancelLogging() {
    if (this.cancelSource) {
      this.cancelSource.cancel();
    }
    this.logging = false;
  }

  /**
   * 取消更新
   */
  public cancelUpdate(): void {
    this.updateInfo = null;
    this.updateChecked = true;
  }

  /**
   * 主动退出登录/其他端顶出
   */
  public handleLogOff(message: string = ''): void {
    if (message) {
      // 其他端顶出
      this.logOffMsg = message;
    }
  }

  /**
   * 显示被封号弹窗
   */
  public handleBanUser(banEndTime: number) {
    this.banUserEndTime = banEndTime;
    this.banUserShowing = true;
  }

  public handleBanUserMessage(message: string) {
    this.banUserMessage = message;
    this.banUserShowing = true;
  }

  /**
   * 检测更新
   */
  public checkUpdate(): void {
    ipcRenderer.once('get-update-available', (event: any, info: any) => {
      this.updateInfo = info;
    });
    ipcRenderer.once('update-error', () => {
      // 检测更新失败禁止继续登录
      this.$notify.fail('检测更新失败！,请重启');
    });
    ipcRenderer.once('no-update', () => {
      this.updateChecked = true;
    });
    ipcRenderer.send('check-update');
  }

  public beforeRouteEnter(to: Route, from: Route, next: any): void {
    next((vm: UserLogin) => {
      if (from.path === '/') {
        vm.onOpenApp();
      } else {
        ipcRenderer.send('resize-window-small');
        vm.updateChecked = true; // 从其他页面返回则已检测更新
        const params = to.params as any; // todo 声明路由参数?
        if (params.message) {
          vm.handleLogOff(params.message);
        } else if (params.banEndTime) {
          vm.handleBanUser(Number(params.banEndTime));
        }
      }
    });
  }

  public onBannedConfirm() {
    this.banUserShowing = false;
    this.banUserEndTime = 0;
    this.banUserMessage = '';
  }

  /**
   * 首次启动该应用
   */
  private onOpenApp(): void {
    if (process.env.NODE_ENV === 'production') {
      this.checkUpdate(); // 启动app检测更新,检测不阻塞用户登录操作
    } else {
      this.updateChecked = true;
    }
  }

  private onLogWarn(data: any) {
    if (data.result === ResWarnCode.LOG_BAN) {
      this.handleBanUserMessage(data.message);
      return true;
    }
    return false;
  }
}
</script>

<style scoped>
.drag_bar_tool {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  height: 50px;
}

.fzm_login {
  width: 290px;
  padding: 40px 55px 80px;
}

.fzm_login-logo {
  height: 140px;
}
</style>
