var app = getApp();
var url = app.globalData.url;
var url_common = app.globalData.url_common;
Page({
  data: {

  },
  onLoad(options) {
    let project_id = options.project_id;
    console.log(project_id)
    let user_id = wx.getStorageSync("user_id");
    let that = this;
    app.httpPost({
      url: url_common + '/api/source/competitorList',
      data: {
        project_id: project_id,
        user_id: user_id
      }
    }, that).then(res => {
      let competitorList = res.data.data;
      console.log(competitorList)
      that.setData({
        competitorList: competitorList
      })
    })
  },
  onshow() {

  },
})