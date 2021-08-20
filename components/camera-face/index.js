// components/camera-face/index.js

import { getAuthorize, setAuthorize, throttle, checkVersion } from './utils'

// 提示信息
const tips = {
  ready: '请确保光线充足,正面镜头',
  recording: '人脸录制中..',
  complete: '已录制完成',
  error: '录制失败'
}

Component({

  // 组件的属性列表
  properties: {
    // 人脸整体可信度 [0-1], 参考wx.faceDetect文档的res.confArray.global
    // 当超过这个可信度且正脸时开始录制人脸, 反之停止录制
    faceCredibility: {
      type: Number,
      value: 0.8
    },
    // 人脸偏移角度正脸数值参考wx.faceDetect文档的res.angleArray 
    // 越接近0越正脸，包括p仰俯角(pitch点头）, y偏航角（yaw摇头), r翻滚角（roll左右倾）
    faceAngle: {
      type: Object,
      value: { p: 0.2, y: 0.2, r: 0.2 }
    },
    // 录制视频时长,不能超过30s
    duration: {
      type: Number,
      value: 3000
    },
    // 是否压缩视频
    compressed: {
      type: Boolean,
      value: false
    },
    // 前置或者后置 front,back
    devicePosition: {
      type: String,
      value: 'front'
    },
    // 指定期望的相机帧数据尺寸 small,medium,large
    frameSize: {
      type: String,
      value: 'medium'
    },
    // 分辨率 low,medium,high
    resolution: {
      type: String,
      value: 'medium'
    },
    // 闪光灯 auto,on,off,torch 
    flash: {
      type: String,
      value: 'off'
    },
    // 检测视频帧的节流时间，默认500毫秒执行一次
    throttleFrequency: {
      type: Number,
      value: 500
    }
  },

  // 组件页面的生命周期
  pageLifetimes: {
    // 页面被隐藏
    hide: function() {
      this.stop()
    },
  },
  detached: function() {
    // 在组件实例被从页面节点树移除时执行
    this.stop()
  },

  // 组件的初始数据
  data: {
    isRecoding: false, // 是否正在录制中
    bottomTips: '', // 底部提示文字
  },

  /**
   * 组件的方法列表
   */
  methods: {

    // 开启相机ctx
    async start() {
      const result = await this.initAuthorize();
      if (!result) return false;
      if (!this.ctx) this.ctx = wx.createCameraContext();
      return true;
    },

    // 准备录制
    async readyRecord() {
      const canUse = checkVersion('2.18.0', () => {
        this.triggerEvent('cannotUse')
      })
      if(!canUse) return; // 检测版本号
      const result = await this.start();
      if (!result || !this.ctx) return;
      console.log('准备录制')
      this.setData({ bottomTips: tips.ready })
      // 视频帧回调节流函数
      let fn = throttle((frame) => {
        console.log(frame.data instanceof ArrayBuffer, frame.width, frame.height)
        // 人脸识别
        wx.faceDetect({
          frameBuffer: frame.data,
          width: frame.width,
          height: frame.height,
          enableConf: true,
          enableAngle: true,
          success: (res) => this.processFaceData(res),
          fail: (err) => console.log('人脸识别失败', err)
        })
      }, this.properties.throttleFrequency);

      // 初始化人脸识别
      wx.initFaceDetect({
        success: () => {
          const listener = this.listener = this.ctx.onCameraFrame((frame) => fn(frame));
          listener.start();
        },
        fail: (err) => {
          console.log('初始人脸识别失败', err)
          this.setData({
            bottomTips: ''
          })
          wx.showToast({ title: '初始人脸识别失败', icon: 'none' })
        }
      })
    },

    // 处理人脸识别数据
    processFaceData(res) {
      if(res.confArray && res.angleArray) {
        const { global } = res.confArray;
        const g = this.properties.faceCredibility;
        const { pitch, yaw, roll } = res.angleArray;
        const { p, y, r } = this.properties.faceAngle;
        console.log('res.confArray.global:', global)
        console.log('res.angleArray:',  pitch, yaw, roll)
        const isGlobal = global >= g;
        const isPitch = Math.abs(pitch) <= p;
        const isYaw = Math.abs(yaw) <= y;
        const isRoll = Math.abs(roll) <= r;
        if( isGlobal && isPitch && isYaw && isRoll ){
          console.log('人脸可信，且是正脸');
        }else {
          console.log('人脸不可信,或者不是正脸');
        }
      }else {
        console.log('获取人脸识别数据失败', res);
      }
    },

    // 开始录制
    startRecord() {
      console.log('开始录制')
      this.ctx.startRecord({
        success: (res) => {
          this.setRecordingTips();
          this.timer = setTimeout(() => {
            clearInterval(this.interval);
            this.completeRecord()
          }, this.properties.duration)
        },
        timeoutCallback: (res) => {
          // 超过30s或页面 onHide 时会结束录像
          this.stop();
        },
        fail: () => {}
      })
    },
    // 设置录制中的提示文字和倒计时
    setRecordingTips() {
      let second = this.properties.duration / 1000;
      this.interval = setInterval(() => {
        if (second <= 1) clearInterval(this.interval);
        this.setData({
          bottomTips: tips.recording + second-- + 's'
        })
      }, 1000)
    },

    // 完成录制
    completeRecord() {
      console.log('完成录制');
      wx.stopFaceDetect();
      this.listener.stop();
      this.ctx.stopRecord({
        compressed: this.properties.compressed,
        success: (res) => {
          this.setData({
            bottomTips: tips.complete
          })
          // 向外触发完成录制的事件
          this.triggerEvent('complete', res.tempVideoPath)
        },
        fail: () => {}
      })
    },
    // 用户切入后台/人脸移出等停止使用摄像头
    stop() {
      console.log('停止录制');
      clearTimeout(this.timer);
      clearInterval(this.interval);
      if(this.listener) this.listener.stop();
      if(this.ctx) this.ctx.stopRecord();
      wx.stopFaceDetect();
      this.setData({
        bottomTips: ''
      })
    },
    // 用户不允许使用摄像头
    error(e) {
      // const cameraName = 'scope.camera';
      // this.triggerEvent('noAuth', cameraName)
    },

    // 初始相机和录音权限
    async initAuthorize() {
      const cameraName = 'scope.camera';
      const recordName = 'scope.record';
      const scopeCamera = await getAuthorize(cameraName);
      // 未授权相机
      if (!scopeCamera) {
        // 用户拒绝授权相机
        if (!(await setAuthorize(cameraName))) this.openSetting();
        return false;
      }
      const scopeRecord = await getAuthorize(recordName);
      if (!scopeRecord) {
        // 用户拒绝授权录音
        if (!(await setAuthorize(recordName))) {
          this.openSetting();
          return false;
        }
      }
      return true;
    },

    // 打开设置授权
    openSetting() {
      wx.showModal({
        title: '开启摄像头和录音权限',
        showCancel: true,
        content: '是否打开？',
        success: (res) => {
          this.triggerEvent('noAuth', '打开设置授权')
          if (res.confirm) {
            wx.openSetting();
          }
        }
      });
    }
  }
})