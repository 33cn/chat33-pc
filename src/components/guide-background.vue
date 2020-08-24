<template>
  <div class="wrap">
    <div class="wrap__margin">
      <div class="wrap__title">加密聊天</div>
      <div
        class="wrap__content"
      >加密聊天是指用户之间的聊天消息和聊天文件均为加密传输，只有参与者可解密查看，更换设备登录时需输入密聊密码才可解密历史加密消息，若忘记密码则无法解密历史加密消息，需设置新的密聊密码加密未来的消息。</div>

      <template v-if="myType ==='set'|| myType ==='forget'">
        <password-setup key="set" :type.sync="myType" :show.sync="showing"></password-setup>
      </template>
      <template v-else-if="myType ==='remoteExist'||myType ==='remoteAbsent'">
        <password-enter key="enter" :type.sync="myType" :show.sync="showing"></password-enter>
      </template>
      <slot name="mnemonic"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import PasswordEnter from "@/components/password-enter.vue";
import PasswordSetup from "@/components/password-setup.vue";
import { Getter, Mutation, State } from "vuex-class";

@Component({
  components: {
    PasswordEnter,
    PasswordSetup
  }
})
export default class GuideBackground extends Vue {
  @Prop({ default: true }) show!: boolean;
  @Prop({ type: String, default: "remoteExist" }) type!: string;

  private myType: string = this.type

  get showing() {
    return this.show;
  }
  set showing(val: boolean) {
    if (val) {
      this.$emit("update:show", true);
    }else {
      this.$emit("update:show", false);
    }
  }
  created() {
    console.log(this.myType);
  }
  beforeUpdate() {
    console.log(this.myType);
  }
}
</script>

<style scoped>
.wrap {
  width: 100%;
  height: 600px;
  background-image: url(../assets/mask.svg);
  background-repeat: no-repeat;
  background-position: 305px 160px;
  overflow: hidden;
}
.wrap__title {
  font-size: 24px;
  color: #24374e;
  font-weight: bold;
  margin-bottom: 10px;
}
.wrap__margin {
  margin-left: 60px;
  margin-top: 70px;
}
.wrap__content {
  font-size: 12px;
  width: 360px;
  height: 68px;
  line-height: 17px;
  margin-bottom: 50px;
}
</style>