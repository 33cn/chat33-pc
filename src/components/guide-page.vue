<template>
  <common-dialog
    :showing.sync="showing"
    :hasCancel="canClose"
    :class-name="className"
    :closeLayer="closeLayer"
  >
    <guide-background :show.sync="showing" :type="type">
      <template v-slot="mnemonic">
      </template>
    </guide-background>
  </common-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import CommonDialog from "@/components/common-dialog.vue";
import GuideBackground from "@/components/guide-background.vue";
import { ErrorMsg } from "../config/config-enum";
import Cryptography from "@/object/targets/Cryptography";
import { MySocket, UserLoggedInfo } from "@/scripts/object";
import { Getter, Mutation, State } from "vuex-class";
import Bus from "@/scripts/bus";

@Component({
  components: {
    CommonDialog,
    GuideBackground,
  }
})
export default class GuidePage extends Vue {
  @Prop({ type: String, default: "remoteExist" }) type!: string;
  @Prop({ default: true }) show!: boolean;
  @Prop() public className!: Object;
  @Prop({ type: Boolean, default: false }) canClose!: boolean;
  @Prop({ default: false }) public closeLayer!: boolean;

  get showing() {
    return this.show;
  }
  set showing(val: boolean) {
    if (val) {
      this.$emit("update:show", true);
    } else {
      this.emitClose();
    }
  }
  public emitClose(): void {
    this.$emit("update:show", false);
    this.$emit("onClose");
  }
}
</script>

<style scoped>
.content__please {
  width: 278px;
  height: 17px;
  line-height: 17px;
  font-size: 12px;
  margin-bottom: 10px;
}
.content__input {
  margin-bottom: 10px;
}
.content__button {
  width: 140px;
  height: 40px;
  background: rgba(50, 178, 247, 1);
  border-radius: 20px;
  color: white;
  border: none;
}
.content_password {
  width: 300px;
  height: 32px;
  background: rgba(241, 244, 246, 1);
  border-radius: 4px;
  margin-bottom: 10px;
  border: 0;
  padding-left: 12px;
  box-sizing: border-box;
  text-align: right;
  padding-right: 100px;
}
.content_password::placeholder {
  text-align: left;
}
.content__forget {
  width: 140px;
  height: 40px;
  border-radius: 20px;
  color: rgba(50, 178, 247, 1);
}
</style>