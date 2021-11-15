// pages/page1/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  
  // 跳转到人脸录像页，todo可以将获取摄像头录音等权限同步放到这一步，目前是在组件内初始权限
  handleTap() {
    wx.navigateTo({
      url: '/pages/page2/index',
    })
  }
})