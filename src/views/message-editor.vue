<!--
  @Author: yuanzeyu
  @Date: 2019/1/29
  @Desc: 消息列表底部输入框，发送文字消息
-->
<template>
  <div class="message_editor">
    <div class="icon_box" :class="{'icon_box_snap':target.isSendSnap}">
      <!-- 发送图片 -->
      <i class="iconfont icon-tupiancopy" @click="showImageInput"></i>
      <template v-if="!target.isSendSnap">
        <!-- 发送视频 -->
        <i class="iconfont icon-shipin" @click="selectUploadVideo"></i>
        <!-- 发送文件 -->
        <i class="iconfont icon-wenjiancopy" @click="selectUploadFile"></i>
      </template>
      <!-- 发送阅后即焚 -->
      <i
        v-show="!target.isSendSnap"
        class="iconfont icon-yuehoujifen"
        @click="target.isSendSnap=true"
      ></i>
      <i v-show="target.isSendSnap" class="iconfont icon-16pxcha" @click="target.isSendSnap=false"></i>
    </div>
    <textarea
      class="input"
      v-model="target.msgEditing"
      @paste="pasteInput"
      @contextmenu.prevent="showEditorMenu"
      @keydown.enter="pressEnter"
      @keyup.delete.exact="pressDelete"
      @compositionstart="blockEnter=true"
      @compositionend="blockEnter=false"
      :maxlength="target.isSendSnap ? FormLimit.SnapMsg : FormLimit.Msg"
      ref="msgEditorInput"
      placeholder="想说点什么"
      @keyup.shift="aitdown"
    ></textarea>
    <input
      type="file"
      accept="image/png, image/jpeg, image/jpg"
      multiple="multiple"
      ref="imageInput"
      @change="imageFileChanged"
      hidden
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { clipboard } from "electron";
import { State, namespace } from "vuex-class";
import {
  ErrorMsg,
  FormLimit,
  IMAGE_SEND_LIMIT,
  ImageTypeLimit
} from "@/config/config-enum";
import { BackspaceEvent } from "@/config/apiTypings";
import { OnSendParam } from "@/config/type";
import { MsgType } from "@/config/const-enums";
import {
  copy2Clipboard,
  selectUploadFile,
  selectUploadVideo
} from "@/utils/app";
import { base64ToFile, insertStr } from "@/utils/tool";
import { UserLoggedInfo } from "@/scripts/object";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import showContextMenu from "@/plugins/ContextMenu";

const addressSign = namespace("addressSign");

@Component({
  components: {}
})
export default class MessageEditor extends Vue {
  @Prop() public target!: Friend | Group;
  @State public myInfo!: UserLoggedInfo;

  @addressSign.State("aitList") aitList!: Array<any>;
  @addressSign.Mutation("setPageShowing") setFriendPageShowing!: (
    payload: any
  ) => void;

  // @addressSign.State("addressPersonIdList") addressPersonIdList!: Array<string>;

  @Watch("aitList")
  public watchAddressPersonName(newVal: Array<any>) {
    if (newVal.length > 0) {
      let aitInfo = newVal[newVal.length - 1];
      this.target.msgEditing += '@'+aitInfo.name;
      this.target.aitInfos.push(aitInfo);
    }
  }
  @Watch("target.msgEditing")
  public watchTextModel(newVal: any) {
    console.log(newVal);
    const inputDom = this.$refs.msgEditorInput as HTMLTextAreaElement;
    console.dir(inputDom);
    // const end = inputDom.selectionEnd + aitInfo.name.length;
    // console.log(end);

    // aitInfo.end =end;
    // aitInfo.length = aitInfo.name.length;
  }
  // @Watch("addressPersonIdList")
  // public watchAddressPersonId(newVal: Array<string>) {
  //   if (newVal.length > 0) {
  //     this.target.aitList = newVal;
  //   }
  // }

  public blockEnter: boolean = false; // 输入中文时阻止回车发送
  public FormLimit = FormLimit;
  public selectUploadFile = selectUploadFile;
  public selectUploadVideo = selectUploadVideo;

  public showImageInput() {
    const inputDom = this.$refs.imageInput as HTMLElement;
    inputDom.click();
  }
  /**
   * 按下退格键
   */
  public pressDelete(e: BackspaceEvent) {
    console.log(e);
    console.log(e.target.value);
    console.log(e.target.selectionStart);
  }
  /**
   * 按下回车事件
   * @desc 没有同时按下shift时：屏蔽换行，发送消息
   */
  public pressEnter(e: KeyboardEvent) {
    //  this.setAddressPersonId(this.message.senderId);

    if (!e.shiftKey && !this.blockEnter) {
      // shift+回车 换行 （e.ctrlKey||e.metaKey）
      const content = this.target.msgEditing;
      e.preventDefault();
      if (content) {
        const param: OnSendParam = {
          content,
          type: MsgType.Text
        };
        this.$emit("onSend", param);
        this.target.msgEditing = "";
        // this.target.aitList = [];
      }
    }
  }
  /**
   * @按下shift+2
   */
  public aitdown(e: KeyboardEvent) {
    if (e.code === "Digit2") {
      this.setFriendPageShowing({ showFriendList: true });
    }
  }
  /**
   * 点击图标选图片
   * @desc 从input存下选中的图片，File
   */
  public imageFileChanged(e: Event) {
    const inputDom = e.target as HTMLInputElement;
    if (inputDom.files) {
      let len = inputDom.files.length;
      if (len > IMAGE_SEND_LIMIT) {
        this.$toast(ErrorMsg.OVER_IMAGE_LIMIT);
        len = IMAGE_SEND_LIMIT;
      }
      for (let i = 0; i < len; i++) {
        // this.$emit('onAddPic', inputDom.files[i]);
        const param: OnSendParam = {
          content: inputDom.files[i],
          type: MsgType.Picture
        };
        this.$emit("onSend", param); // input选取的直接发送
      }
      inputDom.value = "";
    }
  }

  /**
   * 粘贴图片
   * @desc 输入框粘贴（按键） mac only复制图片文件只能上传一张
   */
  public pasteInput(e: ClipboardEvent) {
    // todo 优化统一发图片相关代码
    const ImageFiles = [];
    const files = (e.clipboardData as DataTransfer).items; // files?
    for (let i = 0, len = files.length; i < len; i++) {
      if (files[i].kind === "file") {
        const item = files[i].getAsFile();
        if (item) {
          if (ImageTypeLimit.includes(item.type)) {
            if (ImageFiles.length === IMAGE_SEND_LIMIT) {
              this.$toast(ErrorMsg.OVER_IMAGE_LIMIT);
              break;
            }
            ImageFiles.push(item);
          }
        }
      }
    }
    if (ImageFiles.length > 0) {
      e.preventDefault();
      ImageFiles.forEach(item => {
        this.$emit("onAddPic", item);
      });
    }
  }

  /**
   * 显示聊天消息输入框的右键菜单
   */
  public showEditorMenu(e: MouseEvent) {
    const inputDom = this.$refs.msgEditorInput as HTMLTextAreaElement;
    const start = inputDom.selectionStart;
    const end = inputDom.selectionEnd;
    const oldText = this.target.msgEditing;
    const existText = clipboard.readText();
    const existImage = clipboard.readImage();
    const menuItems = [];
    menuItems.push({
      label: "复制",
      onClick: () => {
        copy2Clipboard(false, oldText.substring(start, end));
      },
      disabled: start === end // 未选区时禁用
    });
    menuItems.push({
      label: "粘贴",
      onClick: () => {
        if (existText) {
          this.target.msgEditing = insertStr(
            oldText,
            existText,
            start,
            end - start
          );
        } else {
          // 粘贴的是图片
          this.$emit(
            "onAddPic",
            base64ToFile(existImage.toDataURL(), String(Date.now()))
          );
        }
      },
      disabled: !(existText || existImage)
    });
    showContextMenu(menuItems, e, false);
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.message_editor {
}

.icon_box {
  height: 50px;
  line-height: 50px;
  color: var(--icon-active-color);

  & > i {
    /* 此图标周围带空白 */
    margin-left: 20px;
    font-size: 22px;
    cursor: pointer;
  }
}

.icon_box_snap {
  background: #fff7f2;

  & > i {
    color: #ef883e;
  }
}

.input {
  background: transparent;
  display: block;
  margin: 10px 20px 0 20px;
  padding: 0;
  width: calc(100% - 40px);
  height: 80px;
  border: none;
  resize: none;
  outline: none;
  color: var(--font-color-dark);
  line-height: 20px;
  font-size: var(--normal-font-size);
}
</style>
