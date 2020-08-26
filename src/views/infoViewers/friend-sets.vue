<!--
  @Author: yuanzeyu
  @Date: 2019/2/15
  @Desc: 弹窗（已加好友）内的属性项
-->
<template>
  <div>
    <div class="more_wrapper">
      <span @click="editMore">更多备注</span>
      <i class="iconfont icon-bianji more_wrapper-icon" @click="editMore"></i>
    </div>
    <ul class="list">
      <li class="item item_remark">
        <div class="item-key">备注</div>
        <div class="item-value">
          <input v-if="remarkEditing"
                 type="text"
                 class="item-value-input"
                 v-model="remarkBindValue"
                 ref="remarkInput"
                 @keydown.enter="$event.target.blur()"
                 :maxlength="FormLimit.Name"
                 @blur.prevent="handleBlur">
          <div v-else @click="editRemark">
            <span :class="{'item-value-placeholder':!friend.remark}">{{friend.remark || '点击备注'}}</span>
            <i class="iconfont icon-bianji item-value-add_icon"></i>
          </div>
        </div>
      </li>
      <li v-if="chatTarget instanceof Group" class="item">
        <div class="item-key">群昵称</div>
        <div class="item-value">{{nameInGroup}}</div>
      </li>
      <li v-if="friend.notePictures.length>0" class="item">
        <div class="item-key">图片</div>
        <div class="item-value">
          <common-header class="item-value-pic"
                         v-for="(item, index) in friend.notePictures"
                         :url="item"
                         @click="imageViewer(item)"
                         :key="index">
          </common-header>
        </div>
      </li>
      <li v-if="friend.noteTels.length>0" class="item">
        <div class="item-key">电话</div>
        <div class="item-value">
          <div v-for="(item, index) in friend.noteTels" :key="index">{{item.label}}—{{item.value}}</div>
        </div>
      </li>
      <li v-if="friend.noteDesc" class="item">
        <div class="item-key">描述</div>
        <div class="item-value">{{friend.noteDesc}}</div>
      </li>
      <li class="item">
        <div class="item-key">来源</div>
        <div class="item-value">{{friend.source}}</div>
      </li>
    </ul>
    <edit-note v-if="detailSetShowing" :show.sync="detailSetShowing" :target="friend"></edit-note>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import Friend from '@/object/targets/Friend';
  import Group from '@/object/targets/Group';
  import {FormLimit} from '@/config/config-enum';
  import URLS from '@/config/urls';
  import imageViewer from '@/plugins/ImageViewer';
  import EditNote from '@/views/edit-note.vue';
  import CommonHeader from '@/components/common-header.vue';

  @Component({
    components: {
      CommonHeader,
      EditNote
    }
  })
  export default class FriendSets extends Vue {
    @Prop() public friend!: Friend;
    @Prop({default: null}) public chatTarget!: Friend | Group | null;

    public remarkEditing: boolean = false;
    public detailSetShowing: boolean = false;
    public remarkBindValue: string = '';
    public FormLimit = FormLimit;
    public imageViewer = imageViewer;
    public Group = Group;

    public get nameInGroup(): string {
      const group = this.chatTarget as Group;
      const member = group.memberList.find((item) => item.id === this.friend.id);
      if (member && member.nameInGroup) {
        return member.nameInGroup;
      }
      return '无';
    }

    public editRemark() {
      this.remarkBindValue = this.friend.remark;
      this.remarkEditing = true;
      this.$nextTick(()  => {
        (this.$refs.remarkInput as HTMLElement).focus();
      });
    }

    public handleBlur() {
      if (this.remarkBindValue !== this.friend.remark) {
        this.saveRemark(this.remarkBindValue);
      }
      this.remarkEditing = false;
    }

    public editMore() {
      this.detailSetShowing = true;
    }

    /**
     * 提交编辑备注
     */
    public async saveRemark(val: string) {
      const friend = this.friend;
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

  .more_wrapper {
    color: var(--common-blue);
    line-height: calc(20px + 8px);
    text-align: right;
    cursor: pointer;
  }

  .more_wrapper-icon {
    margin-left: 10px;
    font-size: 12px;
    cursor: pointer;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    line-height: 20px;
  }

  .item {
    display: flex;
    margin-bottom: 10px;
  }

  .item_remark {
    margin-bottom: 4px;
    line-height: 32px;
  }

  .item_remark-more_btn {
    margin-left: 10px;
    color: var(--font-color-light);
    cursor: pointer;
  }

  .item-key {
    width: 70px;
    color: var(--font-color-light);
  }

  .item-value {
    flex: 1;
  }

  .item-value-input {
    width: 100%;
    box-sizing: border-box;
    height: 32px;
    padding: 0 10px;
    background: var(--gray-background);
    border-radius: 4px;
    outline: none;
    border: none;
    font-size: var(--normal-font-size);
    color: var(--font-color-dark);
  }

  .item-value-placeholder {
    color: var(--font-color-light);
  }

  .item-value-pic {
    margin-right: 10px;
    width: 30px;
    height: 30px;
  }

  .item-value-add_icon {
    position: absolute;
    margin-left: 10px;
    font-size: 12px;
    color: #B2BCC6;
  }
</style>
