Page({
  onLoad() {},
  data: {
    videoSrc: '', // 录制的视频临时路径
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
    console.log('版本号过低无法使用, 已经弹窗提示过了');
    wx.navigateBack()
  },

  // 视频录制完成 
  handleComplete(e) {
    console.log('视频文件路径:', e.detail)
    // e.detail: 视频临时路径
    this.setData({ videoSrc: e.detail })

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
  }
})