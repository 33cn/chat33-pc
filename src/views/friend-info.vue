<!--
  @Author: yuanzeyu
  @Date: 2018/10/17
  @Desc: 联系人信息右栏
-->
<template>
  <div id="friend_info" class="friend_info">
    <div class="content_wrapper">
      <vue-scroll>
        <div v-if="!friend.isTemp">
          <!-- 基本信息 -->
          <div class="info">
            <common-header class="info-header"
                           :url="friend.avatar"
                           @click.native="imageViewer(friend.avatar)">
            </common-header>
            <div class="info-name">{{friend.name}}</div>
            <div class="info-uid">UID {{friend.uid}}</div>
          </div>
          <!-- 置顶设置 -->
          <div class="item">
            <span class="item-key">置顶聊天</span>
            <common-switch class="item-value item-value_margin"
                           v-model="friend.isTop"
                           @click.native="submitIsTop">
            </common-switch>
          </div>
          <!-- 免打扰设置 -->
          <div class="item">
            <span class="item-key">消息免打扰</span>
            <common-switch class="item-value item-value_margin"
                           v-model="friend.muted"
                           @click.native="submitMuted">
            </common-switch>
          </div>
          <!-- 备注设置 -->
          <div class="item">
            <img class="item-edit" src="../assets/more.svg" alt="编辑">
            <span class="item-key">备注名</span>
            <text-editor class="item-value item-value-editor"
                         :text="friend.remark"
                         :maxLength="FormLimit.Name"
                         @onEdited="saveRemark"
                         inputWidth="146px"
                         placeholder="添加备注名">
            </text-editor>
          </div>
          <!-- 无任何详细备注时仅显示添加更多备注 -->
          <div v-if="!hasDetailNote" class="item" @click="editNoteShowing=true">
            <img class="item-edit" src="../assets/more.svg" alt="编辑">
            <span class="item-key">更多备注</span>
            <span class="item-value item-value_holder">添加更多备注</span>
          </div>
          <template v-else>
            <!-- 图片备注设置 -->
            <div v-if="friend.notePictures.length>0" class="item item_click" @click="editNoteShowing=true">
              <img class="item-edit" src="../assets/more.svg" alt="编辑">
              <span class="item-key">图片</span>
              <div class="item-pic_wrapper item-value">
                <div class="item-pic"
                     v-for="(item, index) in friend.notePictures"
                     :key="index"
                     :style="`background-image:url(${item})`">
                </div>
              </div>
            </div>
            <!-- 电话备注设置 -->
            <div v-if="telCount" class="item item_click" :class="{'item-length':telCount>0}" @click="editNoteShowing=true">
              <img class="item-edit" src="../assets/more.svg" alt="编辑">
              <span class="item-key">电话</span>
              <span class="item-value item-value_holder">共{{telCount}}个</span>
              <div v-for="(item, index) in friend.noteTels" class="item-tel_wrapper" :key="index">
                <span>{{item.label}}</span>
                <span class="item-tel_value">{{item.value}}</span>
              </div>
            </div>
            <!-- 描述设置 -->
            <div v-if="friend.noteDesc.length>0" class="item item_click" :class="{'item-length':friend.noteDesc.length>0}"
                 @click="editNoteShowing=true">
              <img class="item-edit" src="../assets/more.svg" alt="编辑">
              <span class="item-key">描述</span>
              <div class="item-desc">{{friend.noteDesc}}</div>
            </div>
          </template>
          <!-- 加好友来源 -->
          <div class="item item-length">
            <span class="item-key">来源</span>
            <div class="item-value_source">{{friend.source}}</div>
          </div>
        </div>
        <!-- 临时好友右栏(被删除) -->
        <div v-else class="temp_wrapper">
          <common-header class="temp-avatar" :url="friend.avatar"
                         @click.native="imageViewer(friend.avatar)"></common-header>
          <h2 class="temp-name">{{friend.name}}</h2>
          <p class="temp-uid">UID {{friend.uid}}</p>
        </div>
      </vue-scroll>
    </div>
    <!-- 底部设置 -->
    <div class="item item_bottom">
      <template v-if="!friend.isTemp">
        <div class="item_bottom-del" @click="deleteFriendShowing=true">删除好友</div>
        <div class="item_bottom-create" @click="emitCreateGroup">创建群聊</div>
      </template>
      <div v-else class="item_bottom-add" @click="showAddFriend">添加好友</div>
    </div>

    <confirm-dialog v-show="deleteFriendShowing" @cancel="deleteFriendShowing = false" @confirm="confirmDelete">
      <div>删除后，将同时删除与该联系人的聊天记录，确定删除联系人 <span>{{this.friend.name}}</span> 吗？</div>
    </confirm-dialog>
    <top-pop ref="addPop" v-if="friend.isTemp">
      <div class="add_pop">
        <h2 class="add_pop-title">好友申请</h2>
        <add-friend :friend="friend"
                    question="这里是需要回答的问题，最多二十个字什么？"
                    :needCheck="true"
                    :noSource="true"
                    @afterAddFriend="closePop">
        </add-friend>
      </div>
    </top-pop>

    <edit-note v-if="editNoteShowing" :show.sync="editNoteShowing" :target="friend"></edit-note>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {Action} from 'vuex-class';
  import URLS from '@/config/urls';
  import {TopStatus, Muted} from '@/config/const-enums';
  import {FormLimit} from '@/config/config-enum';
  import Friend from '@/object/targets/Friend';
  import Bus from '@/scripts/bus';
  import imageViewer from '@/plugins/ImageViewer';
  import CommonSwitch from '@/components/common-switch.vue';
  import TextEditor from '@/components/text-editor.vue';
  import ConfirmDialog from '@/components/confirm-dialog.vue';
  import CommonHeader from '@/components/common-header.vue';
  import TopPop from '@/components/top-pop.vue';
  import AddFriend from '@/views/infoViewers/add-friend.vue';
  import EditNote from '@/views/edit-note.vue';

  @Component({
    components: {
      CommonSwitch,
      TextEditor,
      ConfirmDialog,
      CommonHeader,
      TopPop,
      AddFriend,
      EditNote
    }
  })
  export default class FriendInfo extends Vue {
    @Prop() public friend!: Friend;
    @Action public deleteFriend!: (target: string | Friend) => void;

    public editNoteShowing: boolean = false;

    public FormLimit = FormLimit;
    public imageViewer = imageViewer;

    public deleteFriendShowing: boolean = false;

    /**
     * 备注电话的数量
     */
    public get telCount(): number {
      return this.friend.noteTels.length;
    }

    public get hasDetailNote(): boolean {
      const friend = this.friend;
      return friend.noteDesc.length > 0 || friend.noteTels.length > 0 || friend.notePictures.length > 0;
    }

    public async saveRemark(val: string) {
      const friend = this.friend;
      const backUp = friend.remark;
      this.friend.remark = val;
      const data = await this.$post(URLS.SET_FRIEND_REMARK, {
        id: friend.id,
        remark: val
      });
      if (!data) { // 失败恢复
        friend.remark = backUp;
      }
    }

    public async submitIsTop() {
      const friend = this.friend;
      const data = await this.$post(URLS.SET_FRIEND_TOP, {
        id: friend.id,
        stickyOnTop: friend.isTop ? TopStatus.Yes : TopStatus.No
      });
      if (!data) {
        friend.isTop = !friend.isTop;
      }
    }

    public async submitMuted() {
      const friend = this.friend;
      const data = await this.$post(URLS.SET_FRIEND_MUTED, {
        id: friend.id,
        setNoDisturbing: friend.muted ? Muted.YES : Muted.No
      });
      if (!data) {
        friend.muted = !friend.muted;
      }
    }

    public confirmDelete() {
      this.deleteFriendShowing = false;
      this.deleteFriend(this.friend);
    }

    public showAddFriend() {
      (this.$refs.addPop as any).showPop();
    }

    public emitCreateGroup() {
      this.$emit('close');
      Bus.$emit('show-created-group', [this.friend.id]);
    }

    // 关闭添加pop
    public closePop() {
      (this.$refs.addPop as any).hindPop();
    }

    public created() {
      this.friend.getFriendDetail();
    }
  }
</script>

<!-- todo 优化右栏样式 -->
<style scoped>
  @import '../styles/var.css';

  .friend_info {
    display: flex;
    flex-direction: column;
    width: 284px;
    height: 100%;
  }

  .content_wrapper {
    flex: 1;
    height: 100%;
    overflow: auto;
  }

  .info {
    padding: 18px 20px;
  }

  .info-header {
    float: left;
    margin-right: 10px;
    width: 44px;
    height: 44px;
  }

  .info-name {
    width: 190px;
    line-height: 20px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .info-uid {
    margin-top: 6px;
    font-size: var(--small-font-size);
    color: var(--font-color-light);
    line-height: 17px;
  }

  .item {
    position: relative;
    padding: 0 20px;
    min-height: 49px;
    line-height: 49px;
    border-top: var(--common-border);
  }

  .item_click {
    cursor: pointer;
  }

  .item-edit {
    float: right;
    margin: 17px 0 0 10px;
  }

  .item-key {
    color: var(--font-color-light);
  }

  .item-value {
    float: right;
    color: var(--font-color-dark);
  }

  .item-value_holder {
    color: var(--font-color-light);
    font-size: var(--small-font-size);
  }

  .item-value_source {
    margin-top: 16px;
  }

  .item-value-editor {
    max-width: 146px;
    text-align: right;
  }

  .item-value-input {
    outline: none;
    border: none;
    padding: 0;
    font-size: 13px;
    line-height: 18px;
    text-align: right;
  }

  .item-value_margin {
    margin-top: 16px;
  }

  .item-length {
    padding-top: 6px;
    line-height: 20px;
    & > .item-edit {
      margin-top: 2px;
    }
  }

  .item_bottom {
    display: flex;
    align-content: space-around;
    text-align: center;
    cursor: pointer;
    background: #fff;
    & > div {
      flex: 1;
    }
  }

  .item_bottom-del {
    color: var(--font-color-red);
  }

  .item_bottom-add, .item_bottom-create {
    color: var(--icon-active-color);
  }

  .temp_wrapper {
    text-align: center;
  }

  .temp-avatar {
    margin-top: 80px;
    width: 100px;
    height: 100px;
  }

  .temp-name {
    margin: 20px 0 0 0;
    font-size: 24px;
    font-weight: 600;
    line-height: 33px;
  }

  .temp-uid {
    margin: 11px 0 0 0;
    line-height: 20px;
    color: var(--font-color-light);
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

  .item-pic_wrapper {
    display: inline-block;
    line-height: 50px;
  }

  .item-pic {
    display: inline-block;
    vertical-align: middle;
    margin-left: 10px;
    width: 30px;
    height: 30px;
    background-size: cover;
    background-position: center;
    border-radius: 4px;
  }

  .item-tel_wrapper {
    line-height: 40px;
  }

  .item-tel_value {
    float: right;
  }

  .item-desc {
    margin: 16px 0 9px;
    line-height: 20px;
    word-break: break-word;
  }
</style>

<style>
  @import '../styles/var.css';

  #friend_info {
    & .text_input_holder {
      font-size: var(--small-font-size);
    }
  }
</style>
