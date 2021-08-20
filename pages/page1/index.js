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
  
  // 跳转到人脸录像页
  handleTap() {
    wx.navigateTo({
      url: '/pages/page2/index',
    })
  }
})