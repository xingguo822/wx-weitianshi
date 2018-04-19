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
      url: url_common + '/api/source/memberList',
      data: {
        user_id: user_id,
        project_id: project_id,
        page: 1
      }
    }, that).then(res => {
      let memberList = res.data.data;
      console.log(projectList)
      that.setData({
        projectList: projectList
      })
    })
  },
  onshow() {

  },
})