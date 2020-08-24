<!--
  @Author: yuanzeyu
  @Date: 2019/2/19
  @Desc: 文件右栏
-->
<template>
  <div class="chat_file">
    <header class="header">
      <button
        class="g-btn_active header-btn"
        @click="tabActive='file'"
        :class="{'header-btn_active':tabActive==='file','header-btn_other':tabActive!=='file'}"
      >文件</button>
      <button
        class="g-btn_active header-btn"
        @click="showPicVideo"
        :class="{'header-btn_active':tabActive==='photo','header-btn_other':tabActive!=='photo'}"
      >图片/视频</button>
      <i class="iconfont icon-shangchuan header-icon" @click="clickUpload"></i>
      <common-input
        class="header-input"
        :placeholder="isFriend?'文件名':'文件名/上传者'"
        v-model="searchQueryBind"
        @edited="searchItem"
      ></common-input>
    </header>
    <div class="return" v-if="filterOwnerItem&&tabActive==='file'" @click="clearFilter">
      <i class="iconfont icon-xiangyou return-icon"></i>
      <span class="return-name">{{filterOwnerItem.senderName}}</span>
    </div>
    <div class="content" v-show="tabActive==='file'">
      <vue-scroll v-if="fileList.length>0" @handle-scroll="handleListScroll">
        <file-item
          v-for="(item, index) in fileList"
          :file="item"
          :key="item.id"
          :filterDisable="filterOwnerItem||isFriend"
          @filterOwner="filterOwner(item)"
          @onDelete="deleteFileItem(index)"
        ></file-item>
      </vue-scroll>
      <div v-else-if="searchQuery" class="content-empty">
        <img class="content-empty-result" src="../assets/no-result.svg" alt="没有匹配的对象" />
        <div class="content-empty-label">没有匹配的对象</div>
      </div>
      <div v-else class="content-empty">
        <img class="content-empty-file" src="../assets/no-file.svg" alt="暂无文件" />
        <div class="content-empty-label">暂无文件</div>
      </div>
    </div>
    <div class="content" v-show="tabActive==='photo'">
      <vue-scroll v-if="picVideoListBind.length>0" @handle-scroll="handleListScroll">
        <photo-item v-for="item in picVideoListBind" :key="item.timeStr" :listItem="item"></photo-item>
      </vue-scroll>
      <div v-else class="content-empty">
        <img class="content-empty-photo" src="../assets/no-photo.svg" alt="暂无图片/视频" />
        <div class="content-empty-label">暂无图片/视频</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CommonInput from "@/components/common-input.vue";
import {
  FileItemType,
  FileListPicItem,
  FileListVideoItem,
  PicVideoListItem
} from "@/config/type";
import FileItem from "@/components/items/file-item.vue";
import PhotoItem from "../components/items/photo-item.vue";
import { FileMsgApi, UserLoggedInfo, VideoMsgApi } from "@/scripts/object";
import Friend from "@/object/targets/Friend";
import Group from "@/object/targets/Group";
import { State } from "vuex-class";
import URLS from "@/config/urls";
import {
  FileListParam,
  MessageListResult,
  PicVideoListParam
} from "@/config/apiTypings";
import {
  getFilePath,
  selectUploadFile,
  selectUploadVideoOrPic
} from "@/utils/app";
import Bus from "@/scripts/bus";
import { MsgType } from "@/config/const-enums";
import { formatDate, dencryptSymmetric, isJsonString } from "@/utils/tool";
import { UserLoggedInfoParam, GroupParam, ApiMsg } from "@/config/apiTypings";
import GroupKeyDao from "@/scripts/groupKey-dao";
import Datasource from "@/scripts/data-source";

@Component({
  components: {
    CommonInput,
    FileItem,
    PhotoItem
  }
})
export default class ChatFile extends Vue {
  @State public chatTarget!: Group | Friend;
  @State public myInfo!: UserLoggedInfo;
  // 数据
  public tabActive: "file" | "photo" = "file";
  public fileList: FileItemType[] = [];
  public picVideoList: Array<FileListPicItem | FileListVideoItem> = [];
  // 筛选发送者
  public filterOwnerItem: FileItemType | null = null;
  // 模糊搜索
  public searchQuery: string = ""; // 用户分页查询接口
  public searchQueryBind: string = ""; // 输入框绑定值
  // 分页相关
  public nextLog: string = "";
  public picVideoNextLog: string = "";

  public get picVideoListBind(): PicVideoListItem[] {
    // 按天分配
    const result: PicVideoListItem[] = [];
    this.picVideoList.forEach(item => {
      const date = formatDate(item.time);
      const exist = result.find(item2 => item2.timeStr === date);
      if (exist) {
        exist.items.push(item);
      } else {
        result.push({
          timeStr: date,
          items: [item]
        });
      }
    });
    return result;
  }

  public get isFriend() {
    return this.chatTarget instanceof Friend;
  }

  public showPicVideo() {
    this.tabActive = "photo";
    if (this.picVideoList.length === 0 && this.picVideoNextLog !== "-1") {
      this.getPicVideoList();
    }
  }

  public clickUpload() {
    if (this.tabActive === "file") {
      selectUploadFile();
    } else {
      selectUploadVideoOrPic();
    }
    this.clearFilter();
  }

  public filterOwner(file: FileItemType) {
    this.filterOwnerItem = file;
    this.searchQuery = "";
    this.searchQueryBind = ""; // 取消搜索状态
    this.fileList = [];
    this.nextLog = "";
    this.getFileList();
  }

  public clearFilter() {
    this.filterOwnerItem = null;
    this.fileList = [];
    this.nextLog = "";
    this.searchQueryBind = "";
    this.searchQuery = "";
    this.getFileList();
  }

  public searchItem(val: string) {
    this.fileList = [];
    this.nextLog = "";
    this.searchQuery = val;
    this.getFileList();
  }

  public async getFileList() {
    if (this.nextLog === "-1") {
      // 已无更多
      return;
    }
    const url = this.isFriend ? URLS.FRIEND_FILE_LIST : URLS.GROUP_FILE_LIST;
    const param: FileListParam = {
      id: this.chatTarget.id,
      startId: this.nextLog,
      number: 20,
      query: this.searchQuery,
      owner: this.filterOwnerItem ? this.filterOwnerItem.senderId : ""
    };
    const data: MessageListResult | null = await this.$post(url, param);
    if (data && data.logs) {
      data.logs.forEach(async item => {
        const { encMsg, encrypted } = await this.dencryptGroupMsg(item, true);
        const msg = item.msg.encryptedMsg as FileMsgApi;
        const file: FileItemType = {
          id: item.logId,
          name: msg.name,
          size: msg.size,
          time: item.datetime,
          senderId: item.fromId,
          senderName: item.senderInfo.nickname,
          url: msg.fileUrl,
          localPath: getFilePath(msg.fileUrl)
        };
        if (this.isFriend) {
          // 私聊的api中senderInfo不符合文档
          file.senderName =
            file.senderId === this.myInfo.id
              ? this.myInfo.name
              : this.chatTarget.name;
        }
        this.fileList.push(file);
      });
      this.nextLog = data.nextLog;
    }
  }

  public async getPicVideoList() {
    if (this.picVideoNextLog === "-1") {
      return;
    }
    const url =
      this.chatTarget instanceof Group
        ? URLS.GROUP_PHOTO_LIST
        : URLS.FRIEND_PHOTO_LIST;
    const param: PicVideoListParam = {
      id: this.chatTarget.id,
      startId: this.picVideoNextLog,
      number: 40
    };
    const data: MessageListResult | null = await this.$post(url, param);
    if (data && data.logs) {
      let dencList: Array<FileListPicItem | FileListVideoItem> = [];
      for (const item of data.logs) {
        const { encMsg, encrypted } = await this.dencryptGroupMsg(item, true);
        if (item.msgType === MsgType.Picture) {
          dencList.push({
            url: (encMsg.msg.encryptedMsg as any).imageUrl,
            time: item.datetime
          } as FileListPicItem);
        } else {
          const video = encMsg.msg.encryptedMsg as VideoMsgApi;
          const mediaUrl = video.mediaUrl;
          dencList.push({
            url: mediaUrl,
            localPath: getFilePath(mediaUrl),
            time: item.datetime,
            duration: video.time,
            width: video.width,
            height: video.height
          } as FileListVideoItem);
        }
      }
      this.picVideoList = this.picVideoList.concat(dencList);

      this.picVideoNextLog = data.nextLog;
    }
  }

  public async dencryptGroupMsg(encMsg: ApiMsg, encrypted: boolean) {
    const groupKeyDao = new GroupKeyDao(Datasource.getInstance());

    // 对解密群的消息进行解密
    if (
      encMsg.msgType === MsgType.Picture ||
      encMsg.msgType === MsgType.Video ||
      encMsg.msgType === MsgType.File
    ) {
      if (typeof encMsg.msg.encryptedMsg === "string") {
        const groupSessionKey = await groupKeyDao.getGroupKeyByKeyId(
          encMsg.msg.kid
        );
        if (groupSessionKey) {
          const dencResult = await dencryptSymmetric(
            groupSessionKey,
            encMsg.msg.encryptedMsg
          );
          if (isJsonString(dencResult)) {
            encrypted = true;
            encMsg.msg.encryptedMsg = JSON.parse(dencResult); //解密消息
          } else {
            encrypted = false;
          }
        } else {
          encrypted = false;
        }
      }
    } // todo 临时覆盖
    return { encMsg, encrypted };
  }

  public created() {
    // todo 加载第一页文件列表
    this.getFileList();
    Bus.$on("onReceiveFileMsg", (target: Group | Friend) => {
      if (
        target.id === this.chatTarget.id &&
        this.filterOwnerItem === null &&
        this.searchQuery === ""
      ) {
        this.clearFilter(); // 当前聊天收到文件消息且当前非搜索/筛选状态：刷新
      }
    });
  }

  public beforeDestroy() {
    Bus.$off("onReceiveFileMsg");
  }

  public handleListScroll(vertical: any) {
    if (vertical.process === 1) {
      // 滚动到底部
      if (this.tabActive === "photo") {
        this.getPicVideoList();
      } else {
        this.getFileList();
      }
    }
  }

  public deleteFileItem(index: number) {
    this.fileList.splice(index, 1);
  }
}
</script>

<style scoped>
@import "../styles/var.css";

.chat_file {
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 100%;
}

.header {
  height: 30px;
  padding: 10px 20px;
}

.header-btn {
  width: 90px;
}

.header-icon {
  margin-left: 27px;
  font-size: 16px;
  color: #b2bcc6;
  cursor: pointer;

  &:hover {
    color: var(--common-blue);
  }
}

.header-input {
  margin-left: 10px;
  width: 120px;
}

.header-btn_other {
  background: #fff;
  color: var(--font-color-light);
  border: none;
}

.return {
  height: 34px;
  font-size: 0;
  line-height: 34px;
  padding-left: 20px;
  color: var(--common-blue);
  cursor: pointer;
}

.return-icon {
  transform: rotate(180deg);
  display: inline-block;
  font-size: 12px;
  vertical-align: top;
}

.return-name {
  margin-left: 8px;
  font-size: var(--small-font-size);
}

.content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.content-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.content-empty-file {
  width: 201px;
  height: 160px;
}

.content-empty-result {
  width: 200px;
  height: 160px;
}

.content-empty-photo {
  width: 200px;
  height: 161px;
}

.content-empty-label {
  text-align: center;
  font-size: var(--small-font-size);
  color: var(--font-color-light);
  line-height: 17px;
  margin-top: 20px;
}
</style>
