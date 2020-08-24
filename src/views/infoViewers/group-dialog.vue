<!--
  @Author: yuanzeyu
  @Date: 2018/12/26
  @Desc: 群信息弹窗，仅用于新朋友列表
-->
<template>
  <div class="contact_info_dialog">
    <common-header class="info-header" :url="group.avatar" @click.native="imageViewer(group.avatar)"></common-header>
    <div class="info-text_wrapper info-text_wrapper_dialog">
      <div class="info-text-name">{{group.name}}</div>
      <p class="info-text-id">群号 {{group.markId}}</p>
    </div>`
    <div class="hr hr_dialog"></div>
    <div class="info-item">
      <span class="info-item-label">群成员</span>
      <span>{{group.memberCount}}人</span>
    </div>
    <template v-if="group.isTemp">
      <button v-if="group.joinPermission===JoinGroupAuthority.Forbidden"
              class="g-btn_active g-btn_active_disable common-btn btn_dialog">
        禁止加群
      </button>
      <button v-else class="g-btn_active common-btn btn_dialog" @click="joinGroup">
        {{group.joinPermission===JoinGroupAuthority.NeedApproval ? '申请入群' : '进入群聊'}}
      </button>
    </template>
    <!-- 点击跳转到该群聊天 -->
    <button v-else class="g-btn_active common-btn btn_dialog" @click="emitClickSend">进入群聊</button>
    <top-pop ref="addPop" v-if="group.isTemp">
      <div class="add_pop">
        <h2 class="add_pop-title">加群申请</h2>
        <add-group :group="group" @onClose="closePop"></add-group>
      </div>
    </top-pop>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Group from '@/object/targets/Group';
  import CommonHeader from '../../components/common-header.vue';
  import TextEditor from '../../components/text-editor.vue';
  import {FormLimit} from '../../config/config-enum';
  import URLS from '../../config/urls';
  import Bus from '../../scripts/bus';
  import {JoinGroupAuthority, SourceType} from '../../config/const-enums';
  import imageViewer from '../../plugins/ImageViewer/index';
  import TopPop from '../../components/top-pop.vue';
  import AddGroup from './add-group.vue';

  @Component({
    components: {
      CommonHeader,
      TextEditor,
      TopPop,
      AddGroup
    }
  })
  export default class GroupDialog extends Vue {
    @Prop() public group!: Group; // 展示的信息

    public FormLimit = FormLimit;
    public groupId: string = '';
    public imageViewer = imageViewer;
    public JoinGroupAuthority = JoinGroupAuthority;


    public async joinGroup() {
      const group = this.group;
      if (group.joinPermission === JoinGroupAuthority.NeedApproval) {
        (this.$refs.addPop as any).showPop();
      } else {
        Bus.$emit('directJoinGroup', group.id);
        const data = await this.$post(URLS.APPLY_JOIN_GROUP, {
          roomId: group.id,
          applyReason: '',
          sourceType: SourceType.Search, // pc只有搜索加入
          sourceId: ''
        });
        if (data) {
          this.$emit('onClickBtn');
        } else { // 请求失败则取消直接打开该群
          Bus.$emit('directJoinGroupCancel', group.id);
        }
      }
    }

    /**
     * 跳转到当前聊天
     */
    public emitClickSend() {
      this.$emit('onClickBtn');
      Bus.$emit('onTrySendMsg', this.group);
    }

    // 关闭添加pop
    public closePop() {
      (this.$refs.addPop as any).hindPop();
      this.$emit('onClickBtn');
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';
  @import './common.css';
  .hr_dialog {
    margin: 20px 0;
  }

  .contact_info_dialog {
    padding: 30px;
    width: 380px;
    background: #fff;
  }

  .info-text_wrapper_dialog {
    margin-left: 10px;
    width: 264px;
  }

  .info-item {
    margin-bottom: 10px;
    line-height: 20px;
  }

  .info-item-label {
    display: inline-block;
    width: 70px;
    color: var(--font-color-light);
  }

  .btn_dialog {
    display: block;
    margin: 30px auto 0;
  }

  .add_pop {
    padding: 0 40px;
    min-height: calc(500px - 36px);
    width: calc(500px - 80px);
  }

  .add_pop-title {
    margin: 0;
    line-height: 50px;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
  }
</style>
