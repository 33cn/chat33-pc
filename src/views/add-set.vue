<!--
  @Author: yuanzeyu
  @Date: 2019/1/2
  @Desc: 添加好友设置问题和答案
-->
<template>
  <div>
    <common-checkbox class="tool-checkbox set-add-select"
                     v-model="needAnswer"
                     @click.native="selectNeedAnswer"
                     label="加我为好友时需回答问题">
    </common-checkbox>
    <template v-if="needAnswer">
      <div class="set-add_wrapper">
        <div class="set-add-counter">{{question.length}}/20</div>
        <label class="set-add-title" for="questionInput">设置问题</label>
        <input id="questionInput"
               class="set-add-input"
               type="text"
               v-model="question"
               maxlength="20"
               @input="emptyTipShowing=false"
               placeholder="请设置添加我为好友时需验证的问题">
        <div v-show="emptyTipShowing" class="set-add_wrapper-tip">问题不能为空</div>
      </div>
      <div class="set-add_wrapper">
        <div class="set-add-counter">{{answer.length}}/20</div>
        <label class="set-add-title" for="setAnswerInput">设置答案</label>
        <input id="setAnswerInput"
               class="set-add-input"
               type="text"
               v-model="answer"
               maxlength="20"
               @input="emptyTipShowing=false"
               placeholder="请设置答案">
        <div v-show="emptyTipShowing" class="set-add_wrapper-tip">答案不能为空</div>
      </div>
      <button class="g-btn_active set-add-btn"
              :class="{'g-btn_active_disable':!submitEnabled}"
              @click="submitAddQuestion">
        应用
      </button>
    </template>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
  import CommonCheckbox from '../components/common-checkbox.vue';
  import URLS from '../config/urls';
  import {UserLoggedInfo} from '../scripts/object';
  import {AddQuestionType} from '../config/const-enums';

  @Component({
    components: {
      CommonCheckbox
    }
  })
  export default class AddSet extends Vue {
    @Prop() public myInfo!: UserLoggedInfo;
    public needAnswer: boolean = false;
    public question: string = '';
    public answer: string = '';
    public emptyTipShowing: boolean = false;

    public get submitEnabled() {
      const checkedChanged = this.needAnswer !== this.myInfo.needAnswer;
      const strChanged = this.question !== this.myInfo.addQuestion || this.answer !== this.myInfo.addAnswer;
      return this.question.trim() && this.answer.trim() && (checkedChanged || strChanged);
    }

    public selectNeedAnswer() {
      if (this.needAnswer) { // 开启
        this.initBind();
      } else if (this.needAnswer !== this.myInfo.needAnswer) { // 关闭直接发送
        this.closeQuestion();
      }
    }

    /**
     * 提交打开/编辑添加好友问题
     */
    public async submitAddQuestion() {
      this.question = this.question.trim();
      this.answer = this.answer.trim();
      if (!this.submitEnabled) {
        this.emptyTipShowing = true;
        return;
      }
      const data = await this.$post(URLS.SET_ADD_QUESTION, {
        tp: this.myInfo.needAnswer ? AddQuestionType.Edit : AddQuestionType.Open, // 原设置为需回答则为编辑
        question: this.question,
        answer: this.answer
      });
      if (data) {
        this.myInfo.needAnswer = this.needAnswer;
        this.myInfo.addQuestion = this.question;
        this.myInfo.addAnswer = this.answer;
      }
    }

    public created() {
      this.needAnswer = this.myInfo.needAnswer;
      this.initBind();
    }

    @Watch('myInfo.needAnswer')
    public syncChange() {
      this.needAnswer = this.myInfo.needAnswer;
      this.initBind();
    }

    private initBind() {
      this.question = this.myInfo.addQuestion;
      this.answer = this.myInfo.addAnswer;
    }

    /**
     * 关闭加好友需回答问题
     */
    private async closeQuestion(): Promise<void> {
      const data = await this.$post(URLS.SET_ADD_QUESTION, {
        tp: AddQuestionType.Close,
        question: '',
        answer: ''
      });
      if (data) {
        this.myInfo.needAnswer = false;
      } else {
        this.needAnswer = true;
      }
    }
  }
</script>

<style scoped>
  @import '../styles/var.css';

  .set-add_wrapper {
    position: relative;
    margin-top: 10px;
    width: 340px;
    font-size: var(--small-font-size);
    font-weight: 500;
    line-height: 17px;
    color: var(--font-color-light);
  }

  .set-add_wrapper-tip {
    position: absolute;
    right: -94px;
    bottom: 6px;
    color: var(--font-color-red);
    line-height: 20px;
    font-size: var(--normal-font-size);
  }

  .set-add-counter {
    float: right;
    font-size: var(--small-font-size);
    font-weight: 500;
    line-height: 17px;
    color: var(--font-color-light);
  }

  .set-add-input {
    margin-top: 10px;
    box-sizing: border-box;
    width: 100%;
    padding: 6px 10px;
    border-radius: 4px;
    line-height: 20px;
    font-weight: 500;
    font-size: var(--normal-font-size);
    border: none;
    outline: none;
    background: var(--gray-background);
  }


  .set-add-btn {
    margin-top: 20px;
    width: 90px;
    height: 30px;
  }
</style>
