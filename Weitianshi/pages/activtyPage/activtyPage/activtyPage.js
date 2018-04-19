let app = getApp();
Page({
  data: {
    activtyPagePic: app.globalData.picUrl.banner_jump1
  },
  onLoad(options) {
    let that=this;
    let index = options.index;//入口banner
    let str = 'banner_jump' + index;
    this.setData({
      activtyPagePic: app.globalData.picUrl[str]
    })
    let title = [0, 'FA的智能助理', '中国FA行业联盟成立大会', '微天使招募合伙人', '中国FA榜评选活动', '投募投资年度合作伙伴'];
    wx.setNavigationBarTitle({
      title: title[index],
    }),
      app.netWorkChange(that)
  }
})