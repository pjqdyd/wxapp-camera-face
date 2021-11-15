// pages/page2/index.js
Page({

  onHide() {
    // 在录制中退出后台页面隐藏，返回上一页，确保重新进入当前页
    // 防止在录制中退出后台导致下次重新录制失败 "operateCamera:fail:is stopping"
    console.log('页面隐藏')
    if (this.data.isBack) wx.navigateBack()
  },

  onShow() {
    console.log('页面显示')
    this.setData({ isBack: true })
  },

  data: {
    videoSrc: '', // 录制的视频临时路径
    isBack: false // 是否返回上一页,用于页面隐藏时判断
  },

  // 当取消授权或者打开设置授权
  handleNoAuth(res) {
    console.log("用户拒绝授权：", res);
    // 因为在设置里授权摄像头不会立即生效，所以要返回上一页,确保重新进入当前页使摄像头生效
    setTimeout(() => {
      wx.navigateBack()
    }, 500)
  },

  // 版本号过低的回调
  handleCannotuse() {
    console.log('版本号过低无法使用, 组件内已经弹窗提示过了');
    wx.navigateBack()
  },

  // 视频录制完成
  handleComplete(e) {
    console.log('视频文件路径:', e.detail)
    // e.detail: 视频临时路径
    this.setData({ videoSrc: e.detail, isBack: false })

    // 打印视频信息文件
    wx.getFileInfo({
      filePath: e.detail,
      success: (res) => {
        const { size } = res
        console.log("视频文件大小M:", size / Math.pow(1024, 2));
      },
      fail: (err) => {
        console.log("获取视频文件失败", err);
      }
    })

    // 上传文件, 实际业务中为人脸识别活体检测接口
    // wx.showLoading({ title: '上传中..', mask: true })
    // wx.uploadFile({
    //   url: 'http://192.168.15.172:8080/test/upload', //仅为示例，非真实的接口地址
    //   filePath: e.detail,
    //   name: 'file',
    //   complete: (res) => {
    //     console.log('上传结果', res)
    //     wx.hideLoading()
    //   }
    // })
  }
})
