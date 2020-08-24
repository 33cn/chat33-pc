<template>
  <div>
    <header class="header"></header>
    <common-input
      class="header-input"
      placeholder="搜索群成员名称"
      @edited="searchBlur"
      @onEnter="searchEnter"
    ></common-input>
    <div class="title">
      <span>选择成员</span>
      <div class="search_wrap">
        <input type="button" class="search_icon" @click="showSearchBar" />
      </div>
    </div>
    <van-index-bar>
      <template v-for="item in memberCharsDic">
        <van-index-anchor :index="item.key" :key="item.key" />
        <van-cell
          v-for="(cellItem,index) in item.value"
          :key="index"
          :value="cellItem.name"
          value-class="content_class"
          clickable
          @click="goBack(cellItem)"
        >
          <van-icon slot="icon" class-prefix="my-icon" name="extra" />
        </van-cell>
      </template>
    </van-index-bar>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { MessageType } from "../object/messages";
import { State, Mutation, Action } from "vuex-class";
import { ChannelType } from "@/config/const-enums";
import { defaultImage } from "@/config/config-enum";

import Group from "../object/targets/Group";
import Friend from "@/object/targets/Friend";
const pinyin = require("js-pinyin");
import CommonInput from "@/components/common-input.vue";

@Component({
  components: { CommonInput }
})
export default class MemberList extends Vue {
  @Prop({ default: false }) canBeClick!: boolean;
  @Prop() public group!: Group;
  @State public message!: MessageType; // todo 改为prop isMine?
  @State public chatTarget!: Group | Friend;

  public memberArr: Array<any> = this.group.memberList;
  public searchQueryBind: string = ""; // 输入框绑定值
  created() {
    this.getMemberList();
  }

  public get header() {
    return defaultImage.Friend;
  }

  get memberCharsDic() {
    let Dic: any = {};
    this.memberArr.forEach((item, index) => {
      if (item.name) {
        let key = pinyin.getCamelChars(item.name)[0].toUpperCase();
        if (Dic[key]) {
          Dic[key].push(item);
        } else {
          this.$set(Dic, key, [item]);
        }
      }
    });
    let arr: Array<any> = [];
    //字典转数组
    Object.keys(Dic).forEach((item, index) => {
      arr.push({ key: item, value: Dic[item] });
    });

    arr.sort((p1: any, p2: any) => {
      return p1.key.localeCompare(p2.key);
    });
    return arr;
  }

  getMemberList() {
    if (this.searchQueryBind) {
      const arr = this.group.memberList;
      this.memberArr = arr.filter(item =>
        pinyin
          .getCamelChars(item.name)
          .split("")
          .find(
            (item: string) =>
              item.toLowerCase() === this.searchQueryBind.toLowerCase()
          ) || item.name.split("").find(item=> item === this.searchQueryBind) 
      );
    } else {
      this.memberArr = this.group.memberList;
    }
  }
  searchEnter(val: any) {
    this.memberArr = [];
    this.searchQueryBind = val;
    this.getMemberList();
  }

  searchBlur(val: any) {
    this.memberArr = [];
    this.searchQueryBind = val;
    this.getMemberList();
  }

  showSearchBar() {
    console.log("...");
  }

  goBack(e:any) {
    console.log(e);
    this.$emit('goBack',e);
  }
}
</script>

<style>
@import "../styles/var.css";
.header {
  height: 24px;
}

.header-input {
  margin-left: 10px;
  width: 380px;
}

.title {
  text-align: center;
  font-size: 20px;
  color: var(--common-blue);
  font-weight: bold;
  height: 50px;
  line-height: 50px;
}

.my-icon {
  background-image: url("../assets/user_header.svg");
  background-repeat: no-repeat;
  background-size: 100%;
  width: 35px;
  height: 35px;
}

.search_wrap {
  float: right;
}

.search_icon {
  border: none;
  background-color: aliceblue;
  background-image: url("../assets/member_search.png");
  background-repeat: no-repeat;
  background-size: 100%;
  width: 17.5px;
  height: 17.5px;
  margin-right: 10px;
  vertical-align: baseline;
}

.content_class {
  margin-left: 10px;
  text-align: left;
  height: 35px;
  line-height: 35px;
}
</style>