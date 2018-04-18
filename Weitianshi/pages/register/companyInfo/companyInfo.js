var app = getApp();
var url = app.globalData.url;
var url_common = app.globalData.url_common;
Page({
  data: {
    company: "",
    position: "",
    email: "",
    result: "1",
    error: "0",
    error_text: '',
    nonet: true
  },
  //onLoad
  onLoad: function (options) {
    var that = this;
    var type = options.type;
    var company = options.user_company;
    var position = options.user_career;
    var email = options.user_email;
    var user_id = wx.getStorageSync('user_id');
    wx.request({
      url: url_common + '/api/user/checkUserInfo',
      data: {
        user_id: user_id
      },
      method: 'POST',
      success: function (res) {
        var complete = res.data.is_complete;
        if (res.data.status_code == 2000000 || res.data.status_code == 0) {
          that.setData({
            company: res.data.user_company_name,
            position: res.data.user_company_career,
            email: res.data.user_email,
            brand: res.data.user_brand
          });
        }
      },
    });
    if (company == "null") {
      company = '';
    }
    if (position == "null") {
      position = '';
    }
    if (email == "null") {
      email = '';
    }
    that.setData({
      company: company,
      position: position,
      email: email,
      type: type
    });
    app.netWorkChange(that);
  },
  //下拉刷新
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
  },
  //公司项的特殊符号过滤和值的双向绑定
  company: function (e) {
    var that = this;
    var pattern = new RegExp("[`~!@#$^&*=|{}':;',\\[\\].<>/?~！@#￥……&*——|{}【】‘；：”“'。，、？]");
    var rs = "";
    var company = e.detail.value;
    for (var i = 0; i < company.length; i++) {
      rs = rs + company.substr(i, 1).replace(pattern, '');
    }
    wx.request({
      url: url_common + '/api/dataTeam/checkCompany',
      data: {
        com_name: company
      },
      method: 'POST',
      success: function (res) { }
    });
    that.setData({
      company: rs
    });
  },
  //职位项的特殊符号过滤和值的双向绑定
  position: function (e) {
    var that = this;
    var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    var rs = ""; 
    var position = e.detail.value;
    for (var i = 0; i < position.length; i++) {
      rs = rs + position.substr(i, 1).replace(pattern, '');
    }
    that.setData({
      position: rs
    });
  },
  //邮箱验证
  checkEmail: function (e) {
    var that = this;
    var temp = e.detail.value;
    var email = this.data.email;
    var myreg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
    if (!myreg.test(temp) && temp !== '') {
      app.log(that,'请输入有效的E_mail！');
      that.setData({
        result: "0"
      });
    } else {
      that.setData({
        result: "1"
      });
    }
    that.setData({
      email: temp
    });
  },
  //品牌验证
  checkBrand: function (e) {
    let that = this;
    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    let rs = "";
    let brand = e.detail.value;
    for (let i = 0; i < brand.length; i++) {
      rs = rs + brand.substr(i, 1).replace(pattern, '');
    }
    that.setData({
      brand: rs
    });
  },
  //点击跳转
  backHome: function () {
    let that = this;
    let company = this.data.company;
    let position = this.data.position;
    let brand = this.data.brand;
    let result = this.data.result;
    let error = this.data.error;
    let error_text = this.data.error_text;
    let email = this.data.email;
    let user_id = wx.getStorageSync('user_id');
    let type = this.data.type;
    if (result == "1" && company !== "" && position !== "") {
      //向后台发送公司信息
      wx.request({
        url: url_common + '/api/user/updateUser',
        data: {
          user_id: user_id,
          user_company_name: company,
          user_company_career: position,
          user_email: email,
          user_brand: brand
        },
        method: 'POST',
        success: function (res) {
          let pages = getCurrentPages();
          let num = pages.length - 1;
          if (res.data.status_code == 2000000) {
            let followed_user_id = wx.getStorageSync('followed_user_id');
            if (followed_user_id) {
              let driectAdd = wx.getStorageSync("driectAdd");
              if (driectAdd) {
                //直接添加为好友
                wx.request({
                  url: url + '/api/user/followUser',
                  data: {
                    user_id: user_id,
                    followed_user_id: followed_user_id
                  },
                  method: 'POST',
                  success: function (res) {
                    if (res.data.status_code == 2000000) {
                      wx.showModal({
                        title: "提示",
                        content: "添加成功,请到人脉列表查看",
                        showCancel: false,
                        confirmText: "到人脉库",
                        success: function () {
                          app.href('/pages/discoverInvest/discoverInvest')
                        }
                      });
                      wx.removeStorageSync("driectAdd");
                      wx.removeStorageSync('followed_user_id');
                    }else{
                      app.errorHide(that, res.data.error_msg, 1500);
                    }
                  },
                });
              } else {
                //正常申请添加为好友
                wx.request({
                  url: url + '/api/user/UserApplyFollowUser',
                  data: {
                    user_id: user_id,
                    applied_user_id: followed_user_id
                  },
                  method: 'POST',
                  success: function (res) {
                    if (res.data.status_code == 2000000) {
                      wx.showModal({
                        title: "提示",
                        content: "添加成功,等待对方同意",
                        showCancel: false,
                        confirmText: "到人脉库",
                        success: function () {
                          wx.removeStorageSync('followed_user_id');
                          app.href('/pages/discoverInvest/discoverInvest')
                        }
                      });
                    }
                  },
                });
              }
            } else {
              if (type) {
                app.href('/pages/register/bindSuccess/bindSuccess?type=' + type);
              } else {
                app.href('/pages/register/bindSuccess/bindSuccess?type=' + 0);
              }
            }
          } else {
            var error_msg = res.data.error_msg;
            wx.showModal({
              title: "错误提示",
              content: error_msg
            });
          }
        },
      });
      //取消错误提示
      that.setData({
        error: '0'
      });
    } else {
      that.setData({
        error: '1'
      });
      if (company == '') {
        app.errorHide(that, "公司不能为空", 1500);
      } else if (position == '') {
        app.errorHide(that, "职位不能为空", 1500);
      } else {
        app.errorHide(that, "请正确填写邮箱", 1500);
      }
    }
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
    }, 1500);
  }
});