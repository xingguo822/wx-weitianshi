let app = getApp();
let url = app.globalData.url;
let url_common = app.globalData.url_common;
import * as ShareModel from '../../../utils/shareModel'
Page({
  data: {

  },
  onLoad: function (options) {
    let team_id = options.team_id;
    let that = this;
    app.netWorkChange(that)
    that.setData({
      team_id: team_id,
    })
  },

  onShow: function () {
    app.netWorkChange(that)
    let that = this;
    let team_id = this.data.team_id;
    let user_id = wx.getStorageSync('user_id');
    //follow_status: 0 未加入战队  1:已加入战队
    wx.request({
      url: url_common + '/api/team/membersList',
      data: {
        team_id: team_id,
        user_id: user_id,
        page: 1
      },
      method: 'POST',
      success: function (res) {
        let follow_status = res.data.data.follow_status;
        let warMemberList = res.data.data.members;
        let team_name = res.data.data.team_name;
        wx.setNavigationBarTitle({
          title: team_name + '的战队成员'
        })
        that.setData({
          warMemberList: warMemberList,
          follow_status: follow_status,
          team_name: team_name
        })
        if (warMemberList.length == 0) app.errorHide(that, '该战队暂时没有成员', 3000)
      }
    })
    that.setData({
      requestCheck: true,
      currentPage: 1,
      page_end: false
    })
  },
  //搜索战队
  searchSth(e) {
    let str = e.detail.value;
    let that = this;
    let timer = this.data.timer;
    //防止多次请求进行延时处理
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(x => {
      wx.showLoading({
        title: 'loading',
        mask: true
      })
      this.getInfo(str, 1)
    }, 1500)
    this.setData({
      timer: timer,
      str: str
    })
    app.initPage(that)
  },
  //加载更多
  loadMore: function () {
    //请求上拉加载接口所需要的参数
    let that = this;
    let user_id = wx.getStorageSync('user_id');
    let team_id = this.data.team_id;
    let currentPage = this.data.currentPage;
    let warMemberList = this.data.warMemberList;

    let request = {
      url: url_common + '/api/team/membersList',
      data: {
        team_id: team_id,
        user_id: user_id,
        page: this.data.currentPage
      }
    }
    app.loadMore2(that, request, res => {
      let members = res.data.data.members;
      let page_end = res.data.data.page_end;
      let NewWarMemberList = warMemberList.concat(members)
      let page = this.data.currentPage;
      that.setData({
        warMemberList: NewWarMemberList,
        page_end: page_end,
        requestCheck: true
      })
    })
  },
  //跳转用户详情
  goTo: function (e) {
    let id = e.currentTarget.dataset.id;
    let user_id = wx.getStorageSync('user_id');
    if (user_id == id) {
      app.href('/pages/my/my/my')
    } else {
      app.href('/pages/userDetail/networkDetail/networkDetail?id=' + id)
    }
  },
  //添加人脉
  addPerson: function (e) {
    let user_id = wx.getStorageSync('user_id');
    let team_id = this.data.team_id;
    let follow_status = this.data.follow_status;
    let warMemberList = this.data.warMemberList;
    let that = this;
    wx.request({
      url: url_common + '/api/user/checkUserInfo',
      data: {
        user_id: user_id
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status_code == 2000000) {
          let complete = res.data.is_complete;
          if (complete == 1) {
            let user_id = wx.getStorageSync('user_id');
            let applied_user_id = e.currentTarget.dataset.applyid;
            let follow_status = e.currentTarget.dataset.status;
            if (follow_status == 0) {
              wx.request({
                url: url + '/api/user/UserApplyFollowUser',
                data: {
                  user_id: user_id,
                  applied_user_id: applied_user_id
                },
                method: 'POST',
                success: function (res) {
                  warMemberList.forEach((x) => {
                    if (x.user_id == applied_user_id) {
                      x.follow_status = 2
                    }
                  })
                  that.setData({
                    warMemberList: warMemberList
                  })
                }
              })
            } else if (follow_status == 3) {
              wx.request({
                url: url + '/api/user/handleApplyFollowUser',
                data: {
                  user_id: user_id,
                  apply_user_id: applied_user_id
                },
                method: 'POST',
                success: function (res) {
                  //将状态改为"已互为人脉
                  warMemberList.forEach((x) => {
                    if (x.user_id == applied_user_id) {
                      x.follow_status = 1
                    }
                  })
                  that.setData({
                    warMemberList: warMemberList
                  })
                }
              })
            }
          } else if (complete == 0) {
            wx.removeStorageSync('followed_user_id')
            app.href('/pages/register/companyInfo/companyInfo?type=1')
          }
        } else {
          wx.removeStorageSync('followed_user_id')
          app.href('/pages/register/personInfo/personInfo?type=2')
        }
      }
    })

  },
  //分享页面
  onShareAppMessage: function () {
    let that = this;
    return ShareModel.warbandMemberShare(that)
  },
  //加入战队
  addWar: function (e) {
    // let xxx = e.currentTarget.dataset.url;
    let user_id = wx.getStorageSync('user_id');
    let team_id = this.data.team_id;
    let follow_status = this.data.follow_status;
    let that = this;
    wx.request({
      url: url_common + '/api/user/checkUserInfo',
      data: {
        user_id: user_id
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status_code == 2000000) {
          let complete = res.data.is_complete;
          if (complete == 1) {
            //添加战队
            let user_id = wx.getStorageSync('user_id');
            let arr = [];
            let parameter = [];
            arr.push(user_id);
            arr.push(team_id);
            parameter.push(arr)
            wx.request({
              url: url_common + '/api/team/join',
              data: {
                teams: parameter
              },
              method: 'POST',
              success: function (res) {
                if (res.data.status_code == 2000000) {
                  that.setData({
                    follow_status: 1
                  })
                } else {
                  app.errorHide(that, res.data.error_msg, 3000)
                }
              }
            })
          } else if (complete == 0) {
            wx.removeStorageSync('followed_user_id')
            app.href('/pages/register/companyInfo/companyInfo?type=1')
          }
        } else {
          wx.removeStorageSync('followed_user_id')
          app.href('/pages/register/personInfo/personInfo?type=2')
        }
      }
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