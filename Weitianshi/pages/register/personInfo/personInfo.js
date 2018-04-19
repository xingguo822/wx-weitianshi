var app = getApp();
var url = app.globalData.url;
var url_common = app.globalData.url_common;
Page({
  data: {
    name: '',
    telephone: '',
    checkCode: '',
    result: "0",//手机号码验证是否正确
    error: "0",
    error_text: '',
    checking: "0",//获取验证码请求是否发送
    time: "0",//获取验证码按钮是否可点
    loading: "0",//加载动画控制
    getCode: "获取验证码",
    endTime: 60,//多少秒后验证码得发
    isShow: 0,//显示personInfo页面还是bindPhone页面,
    nonet: true
  },
  onLoad: function (options) {
    let type = options.type;
    let that = this;
    if (type) {
      that.setData({
        type: type
      })
    };
    app.netWorkChange(that)
  },
  onShow: function () {
    var that = this;
    //获取code,服务于微信授权绑定
    this.getCode();
    this.clearTime();
  },
  //获取code存入data中,服务于微信授权绑定(辅助函数)
  getCode() {
    let that = this;
    wx.login({
      success(res) {
        if (res.code) {
          that.setData({
            code: res.code
          })
        }
      }
    })
  },
  // 清除记时器(辅助函数)
  clearTime() {
    let that = this;
    if (this.data._time) {
      that.setData({
        time: "1"
      })
    } else {
      // 清零短信倒计时
      that.setData({
        time: "0"
      })
    }
  },
  //姓名
  stripscript: function (e) {
    var that = this;
    var name = e.detail.value;
    that.setData({
      name: name
    })
  },
  //手机号码验证
  checkPhone: function (e) {
    var temp = e.detail.value;
    var myreg = /^(1+\d{10})|(159+\d{8})|(153+\d{8})$/;
    var that = this;
    if (!myreg.test(temp)) {
      that.setData({
        result: "0"
      })
    } else {
      that.setData({
        result: "1",
        telephone: temp
      });
    }
  },
  //获取验证码按钮
  checkCode: function (e) {
    e.detail.disabled = true;
    var telephone = this.data.telephone;
    var checking = this.data.checking;
    var that = this;
    var endTime = this.data.endTime
    endTime = 60;
    that.setData({
      checking: "1",
      time: "1",
    });
    wx.request({
      url: url_common + '/api/auth/authCaptcha',
      data: {
        user_mobile: telephone
      },
      method: 'POST',
      success: function (res) {
        that.setData({
          checking: "0"
        });
        if (res.data.status_code === 2000000) {
          var _time = setInterval(function () {
            if (endTime > 1) {
              endTime--;
              that.setData({
                getCode: endTime + 's后重新获取'
              })
            }
          }, 1000)
          that.setData({
            _time: _time
          })
          setTimeout(function () {
            that.setData({
              time: "0",
              getCode: "获取验证码"
            });
            clearInterval(_time)
          }, 60000);
        } else {
          app.errorHide(that, res.data.error_msg, 3000)
        }
      },
      fail: function () {
        app.errorHide(that, res.data.error_msg, 3000)
      },
      complete: function () {
        // complete
      }
    })
  },
  //获取验证码的值 
  checkCode2: function (e) {
    var that = this;
    that.setData({
      checkCode: e.detail.value
    });
  },
  //下拉刷新
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh()
  },
  //personInfo点击跳转
  nextPage: function () {
    let that = this;
    let type = this.data.type;
    wx.login({
      success: function (res) {
        var name = that.data.name;
        var telephone = that.data.telephone;
        var result = that.data.result;
        var error = that.data.error;
        var error_text = that.data.error_text;
        var checkCode = that.data.checkCode;
        var code = res.code;
        var open_session = wx.getStorageSync('open_session');
        if (!name) {
          app.errorHide(that, '姓名不能为空', 3000)
        } else if (!telephone) {
          app.errorHide(that, '手机号码不能为空', 3000)
        } else if (!checkCode) {
          app.errorHide(that, '验证码不能为空', 3000)
        } else {
          wx.request({
            url: url_common + '/api/user/bindUser',
            data: {
              user_real_name: name,
              user_mobile: telephone,
              captcha: checkCode,
              code: code,
              open_session: open_session
            },
            method: 'POST',
            success: function (res) {
              var user_career = res.data.user_career;
              var user_company = res.data.user_company;
              var uer_email = res.data.user_email;
              if (res.data.status_code == 2000000) {
                wx.setStorageSync('user_id', res.data.user_id);
                app.globalData.user_id = res.data.user_id;
                if (type) {
                  app.href('/pages/register/companyInfo/companyInfo?user_career=' + user_career + "&&user_company=" + user_company + "&&uer_email=" + uer_email + '&&type=' + type)
                } else {
                  app.href('/pages/register/companyInfo/companyInfo?user_career=' + user_career + "&&user_company=" + user_company + "&&uer_email=" + uer_email)
                }
              } else {
                app.errorHide(that, res.data.error_msg, 3000)
              }
            }
          })
        }
      }
    })
  },
  //其他手机绑定
  goBack() {
    this.getCode();
    this.clearTime();
    this.setData({
      isShow: 0,
      name:'',
      telephone:'',
      checkCode:'',
    })
  },
  //bindPhone点击跳转
  nextPage1() {
    let that = this;
    let type = this.data.type;
    wx.login({
      success: function (res) {
        var name = that.data.name;
        var telephone = that.data.telephone;
        var result = that.data.result;
        var error = that.data.error;
        var error_text = that.data.error_text;
        var open_session = wx.getStorageSync('open_session')
        if (!name) {
          app.errorHide(that, '姓名不能为空', 3000)
        } else if (!telephone) {
          app.errorHide(that, '手机号码不能为空', 3000)
        } else if (telephone == 'undefined') {
          app.errorHide(that, '获取手机号码失败,请重试', 3000)
        } else {
          wx.request({
            url: url_common + '/api/user/bindUser',
            data: {
              user_real_name: name,
              user_mobile: telephone,
              open_session: open_session,
              oauth: "wx_oauth"
            },
            method: 'POST',
            success: function (res) {
              var user_career = res.data.user_career;
              var user_company = res.data.user_company;
              var uer_email = res.data.user_email;
              if (res.data.status_code == 2000000) {
                wx.setStorageSync('user_id', res.data.user_id);
                app.globalData.user_id = res.data.user_id;
                if (type) {
                  app.href('/pages/register/companyInfo/companyInfo?user_career=' + user_career + "&&user_company=" + user_company + "&&uer_email=" + uer_email + '&&type=' + type, )

                } else {
                  app.href('/pages/register/companyInfo/companyInfo?user_career=' + user_career + "&&user_company=" + user_company + "&&uer_email=" + uer_email, )
                }
              } else {
                app.errorHide(that, res.data.error_msg, 3000)
              }
            }
          })
        }
      }
    })
  },
  //微信授权绑定
  getPhoneNumber(e) {
    let encryptedData = e.detail.encryptedData;
    let iv = e.detail.iv;
    let that = this;
    let name = that.data.name;
    let code = that.data.code;
    wx.request({
      url: 'https://wx.weitianshi.cn/api/wx/returnWxOauthMobile',
      data: {
        app_key:app.globalData.app_key,
        code: code,
        encryptedData: encryptedData,
        iv: iv
      },
      method: "POST",
      success(res) {
        if (res.data.status_code == 2000000) {
          let telephone = res.data.user_mobile;
          that.setData({
            telephone: telephone,
            isShow: 1
          })
          // app.href('/pages/register/bindPhone/bindPhone?name=' + name + '&&telephone=' + telephone)
        } else {
          that.getCode();
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
});