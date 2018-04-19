// pages/organization/subPage/list_media/list_media.js
let app = getApp();
let url = app.globalData.url;
let url_common = app.globalData.url_common;
import * as ShareModel from '../../../../utils/model/shareModel';
Page({
  data: {
    project_id: '',
    nonet: true
  },
  onLoad(options) {
    this.setData({
      project_id: options.project_id,
    });
    let that = this;
    app.netWorkChange(that)
  },
  onShow() {
    let that = this;
    that.setData({
      newPage: '',
      requestCheck: true,
      currentPage: 0,
      page_end: false,
      investment_list: []
    })
    // app.initPage(that);
    this.loadMore();
  },
  //下拉刷新
  onPullDownRefresh() {
    
  },
  loadMore() {
    let that = this;
    let currentPage = this.data.currentPage;
    let investment_list = this.data.investment_list;
    let request = {
      url: url_common + '/api/investment/matchs',
      data: {
        project_id: this.data.project_id,
        page: this.data.currentPage
      },
    }
    app.loadMore2(that, request, res => {
      app.log("机构版买家图谱", res)
      let newPage = res.data.data;
      let list = res.data.data.investment_list;
      let page_end = res.data.data.page_end;
      if (list) {
        let newProject = investment_list.concat(list)
        currentPage++;
        that.setData({
          newPage: newPage,
          investment_list: newProject,
          page_end: page_end,
          requestCheck: true,
          currentPage: currentPage
        })
      }
      if (page_end == true) {
        app.errorHide(that, '没有更多了', 3000)
      }
    })
  },
  // 跳转详情页
  institutionalDetails1(e) {
    let thisData = e.currentTarget.dataset;
    app.href('/pages/organization/org_detail/org_detail?investment_id=' + thisData.id)
  },
  onShareAppMessage() {
    let that = this;
    return ShareModel.match1(that);
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