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
      url: url_common + '/api/source/newsList',
      data: {
        project_id: project_id,
        page: 1
      }
    }, that).then(res => {
      let newsList = res.data.data;
      console.log(newsList)
      that.setData({
        newsList: newsList
      })
    })
  },
  onshow() {

  },
})