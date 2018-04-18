var app = getApp();
var url = app.globalData.url;
var url_common = app.globalData.url_common;
Page({
  data: {
    imgUrls: app.globalData.picUrl.push_success,
    disabled: false,
    nonet: true
  },
  onLoad: function () {
    let that = this;
    app.netWorkChange(that)
  },
  btnYes: function () {
    console.log(4544)
    wx.navigateBack({
      delta: 2
    })
  },
  // 重新加载
  refresh() {
    let timer = '';
    wx.showLoading({
      title: 'loading',
      mask: true
    });
    timer = setTimeout(x => {
      wx.hideLoading();
      this.onShow();
    }, 1500)
  }
})