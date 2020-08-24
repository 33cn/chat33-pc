<!--
  @Author: yuanzeyu
  @Date: 2018/12/27
  @Desc: 添加好友
-->
<template>
  <div class="add_wrapper">
    <common-header class="info-header" :url="friend.avatar" @click.native="imageViewer(friend.avatar)"></common-header>
    <div class="info-text_wrapper info-text_wrapper_dialog">
      <h2 class="info-text-name">{{friend.name}}</h2>
      <p class="info-text-id">UID {{friend.uid}}</p>
    </div>
    <div class="hr hr_add"></div>
    <div v-if="friend.isLoggedUser" class="info-item">
      <span class="info-item-label">账号</span>
      <span>{{friend.account}}</span>
    </div>
    <div v-else class="info-item">
      <span class="info-item-label">备注</span>
      <text-editor class="note-editor_dialog"
                   :text="preEditRemark"
                   placeholder="点击备注"
                   :maxLength="FormLimit.Name"
                   @onEdited="handleEditRemark"
                   inputWidth="300px"
                   :showIcon="true">
      </text-editor>
    </div>

    <!-- 验证 -->
    <template v-if="friend.isTemp">
      <template v-if="friend.needAnswer">
        <h2 class="question-tip theme-title">你需要回答以下问题后添加好友</h2>
        <div class="counter counter_question">{{answer.length}}/20</div>
        <label class="question-title" for="answerInput">{{friend.addQuestion}}</label>
        <input id="answerInput" class="theme-input question-input" type="text" v-model="answer" maxlength="20" placeholder="请输入答案">
      </template>
      <template v-if="friend.needCheck">
        <div class="counter counter_check">{{checkText.length}}/50</div>
        <label class="check-title theme-title" for="checkInput">你需要发送验证申请，等待对方通过</label>
        <textarea id="checkInput" class="theme-input check-input" v-model="checkText" maxlength="50" :placeholder="`我是 ${myInfo.name}`"></textarea>
      </template>
    </template>

    <button v-if="friend.isLoggedUser" class="g-btn_active g-btn_active_disable common-btn btn_dialog">不可添加自己</button>
    <button v-else-if="friend.isTemp"
            class="g-btn_active common-btn btn_dialog"
            :class="{'g-btn_active_disable': addDisabled}"
            @click="addFriend">
      添加好友
    </button>
    <button v-else class="g-btn_active common-btn btn_dialog" @click="emitClickSend">发送消息</button>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {UserLoggedInfo} from '../../scripts/object';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import CommonHeader from '../../components/common-header.vue';
  import TextEditor from '../../components/text-editor.vue';
  import {ErrorMsg, FormLimit, SuccessMsg} from '../../config/config-enum';
  import URLS from '../../config/urls';
  import Bus from '../../scripts/bus';
  import imageViewer from '../../plugins/ImageViewer';
  import {AddFriendState, SourceType} from '../../config/const-enums';
  import {State} from 'vuex-class';

  @Component({
    components: {
      CommonHeader,
      TextEditor
    }
  })
  export default class AddFriend extends Vue {
    @Prop() public friend!: Friend | UserLoggedInfo; // 展示的信息
    @Prop({default: ''}) public question!: string;
    @Prop({default: false}) public needCheck!: boolean;
    @Prop({default: ''}) public groupId!: string;
    @Prop({default: false}) public noSource!: boolean;
    @State public myInfo!: UserLoggedInfo;

    public FormLimit = FormLimit;
    public imageViewer = imageViewer;
    public preEditRemark: string = '';
    public answer: string = '';
    public checkText: string = '';

    public get addDisabled() {
      return this.friend.needAnswer && !this.answer.trim();
    }

    public handleEditRemark(val: string) {
      const friend = this.friend as Friend;
      if (friend.isTemp) {
        this.preEditRemark = val;
      } else {
        this.saveRemark(val);
      }
    }

    public async addFriend() {
      this.checkText = this.checkText.trim();
      this.answer = this.answer.trim();
      if (this.addDisabled) {
        return;
      }
      const data = await this.$post(URLS.ADD_FRIEND_APPLY, {
        id: this.friend.id,
        remark: this.preEditRemark,
        reason: this.checkText,
        sourceId: this.groupId,
        sourceType: this.noSource ? SourceType.NoSource : (this.groupId ? SourceType.Group : SourceType.Search),
        answer: this.answer
      });
      if (data) {
        const res = data.state;
        if (res === AddFriendState.WrongAnswer) {
          this.$notify.fail(ErrorMsg.ADD_ANSWER_WRONG);
        } else {
          this.$notify.success(res === AddFriendState.Waiting ? SuccessMsg.ADD_FRIEND : SuccessMsg.ADD_FRIEND_DIRECT);
          this.$emit('afterAddFriend'); // 通知父组件关闭
        }
      }
    }

    /**
     * 跳转到当前聊天
     */
    public emitClickSend() {
      this.$emit('onClickBtn');
      Bus.$emit('onTrySendMsg', this.friend);
    }

    /**
     * 提交编辑备注
     */
    private async saveRemark(val: string) {
      const friend = this.friend as Friend;
      const backUp = friend.remark;
      friend.remark = val;
      const data = await this.$post(URLS.SET_FRIEND_REMARK, {
        id: friend.id,
        remark: val
      });
      if (!data) {
        friend.remark = backUp;
      }
    }
  }
</script>

<style scoped>
  @import '../../styles/var.css';
  @import './common.css';

  .info-text_wrapper_dialog {
    margin-left: 10px;
    width: 264px;
  }

  .note-editor_dialog {
    vertical-align: top;
  }

  .info-item {
    margin-bottom: 10px;
    line-height: 20px;
    color: var(--font-color-light);
  }

  .info-item-label {
    display: inline-block;
    width: 49px;
  }

  .btn_dialog {
    display: block;
    margin: 30px auto;
  }

  .theme-title {
    display: block;
    line-height: 17px;
    margin: 30px 0 0 0;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    font-weight: 500;
  }

  .counter {
    float: right;
    line-height: 17px;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    font-weight: 500;
  }

  .counter_question {
    margin-top: 22px;
  }

  .counter_check {
    margin-top: 30px;
  }

  .theme-input {
    box-sizing: border-box;
    width: 100%;
    padding: 0 10px;
    border-radius: 4px;
    line-height: 20px;
    font-weight: 500;
    font-size: var(--normal-font-size);
    border: none;
    outline: none;
    background: var(--gray-background);
  }


  .question-input {
    margin-top: 9px;
    height: 32px;
  }

  .check-input {
    margin-top: 10px;
    padding: 10px;
    height: 60px;
    resize: none;
  }


  .question-title {
    display: inline-block;
    margin-top: 20px;
    line-height: 20px;
  }
</style>
