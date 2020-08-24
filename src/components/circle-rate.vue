<!--  -->
<template>
  <div class="circle-box">
    <canvas id="circle" :width="radius*2" :height="radius*2"></canvas>
  </div>
</template>

<script>
/* tslint:disable */
export default {
  data() {
    return {

    };
  },
  props:{
    percent:{//进度
      type:Number,
      validator: function (value) {
        return value>=0&&value<=1
      }
    },
    direction:{
      type:Boolean,
      default:false
    },
    backColor:{//背景色
      type:String,
    },
    contColor:{//内容颜色
      type:String,
    },
    radius:{//半径
      type:Number,
    }
  },
  mounted() {
    this.fraw();
  },
  watch:{
    percent:function () {
      this.fraw()
    }
  },
  methods: {
    fraw() {
      const graphAngle=Math.PI*2*this.percent-Math.PI/2;//这个角度从三点钟方向开始算,是canvas的结束角度
      const c = document.getElementById('circle');
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,400,400)
      ctx.beginPath();
      ctx.arc(this.radius, this.radius, this.radius, Math.PI*1.5, graphAngle, this.direction);
      ctx.fillStyle = this.contColor;
      ctx.lineTo(this.radius,this.radius)
      ctx.lineTo(this.radius,0)
      ctx.fill(); 
      ctx.closePath()
      ctx.beginPath();
      ctx.arc(this.radius, this.radius, this.radius, Math.PI*1.5, graphAngle, !this.direction);
      ctx.fillStyle = this.backColor;
      ctx.lineTo(this.radius,this.radius)
      ctx.lineTo(this.radius,0)
      ctx.fill(); 
      ctx.closePath()
    }
  }
};
</script>
<style lang='css' scoped>
.circle-box {
  display:inline-block;
}
</style>