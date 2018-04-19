var app = getApp();
var url = app.globalData.url;
var url_common = app.globalData.url_common;
Page({

  data: {

  },
  onLoad(options) {
    let memberId = options.member_id;
    let that = this;
    let user_id = wx.getStorageSync('user_id');
    app.httpPost({
      url: url_common + '/api/source/memberInfo',
      data: {
        user_id: user_id,
        member_id: memberId
      }
    }, that).then(res => {
      let memberInfo = res.data.data;
      console.log(memberInfo)
      that.setData({
        memberInfo: memberInfo
      })
    })
  }
})