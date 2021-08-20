// 封装获取授权结果, scopeName权限名称
export const getAuthorize = (scopeName) => {
  return new Promise((resove, reject) => {
    wx.getSetting({
      success: res => {
        res.authSetting[scopeName] ? resove(true) : resove(false);
      },
      fail: () => resove(false)
    })
  })
};

// 封装设置权限, scopeName权限名称
export const setAuthorize = (scopeName) => {
  return new Promise((resove, reject) => {
    wx.authorize({
      scope: scopeName,
      success: () => resove(true),
      fail: () => resove(false)
    })
  })
};

// 节流函数
export const throttle = (fn, delay = 200) => {
  let timer;
  return function (args) {
    let _this = this;
    if (timer) {
      return;
    }
    timer = setTimeout(() => {
      fn.call(_this, args);
      clearTimeout(timer);
      timer = null;
    }, delay);
  };
};

// 比较版本号
export const compareVersion = (v1, v2) => {
  v1 = v1.split('.')
  v2 = v2.split('.')
  const len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i])
    const num2 = parseInt(v2[i])

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }
  return 0
}

// 检测版本号后的处理,version: 比较的版本号, callback: 版本号低于的处理回调 
export const checkVersion = (version, callback) => {
  const v = wx.getSystemInfoSync().SDKVersion
  console.log('比较版本号系统：', v, '比较：', version);
  if (compareVersion(v, version) >= 0) {
    return true;
  } else {
    // 如果希望用户在最新版本的客户端上体验您的小程序，可以这样子提示
    wx.showModal({
      title: '提示',
      content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
      showCancel: false,
      success: () => {
        callback()
      }
    })
    return false;
  }
}