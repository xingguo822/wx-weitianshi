import * as httpModel from './utils/httpModel';
import * as OperationModel from './utils/operationModel';
import { picUrl } from './utils/picUrlModel';
//app.js
App({
  // onLaunch 用于监听小程序初始化,当完成时会触发onLaunch(全局只会触发一次)
  onLaunch(options) {
    let url_common = this.globalData.url_common;
    //如果是在是点击群里名片打开的小程序,则向后台发送一些信息
    if (options.shareTicket) {
      //获取codes
      wx.login({
        success: function (login) {
          let code = login.code;
          if (code) {
            // 群分享时有效，
            let path = options.path;
            let shareTicket = options.shareTicket;
            //获取群ID
            wx.getShareInfo({
              shareTicket: shareTicket,
              success(res) {
                let encryptedData = res.encryptedData;
                let iv = res.iv;
                //向后台发送信息
                wx.request({
                  url: url_common + '/api/log/clickLogRecord',
                  data: {
                    code: code,
                    path: path,
                    encryptedData: encryptedData,
                    iv: iv
                  },
                  method: 'POST',
                  success() {
                  }
                });
              }
            });
          }
        }
      });
    }
  },
  onShow() {
    wx.onNetworkStatusChange(function (res) {
      // app.log(this,res.isConnected);
      // app.log(this,res.networkType);
    });
  },
  //进入页面判断是否有open_session
  loginPage(cb) {
    //群分享打点准备
    /* wx.showShareMenu({
         withShareTicket: true
     })*/
    if (this.globalData.open_session) {
      let timeNow = Date.now();
      let session_time = this.globalData.session_time;
      let differenceTime = timeNow - session_time;
      if (differenceTime > 432000000) {//432000000代表2个小时
        // this.log(this,"已超时");
        this.getSession(cb);
      } else {
        typeof cb == 'function' && cb(this.globalData.user_id)
      }
    } else {
      this.getSession(cb); // 赋值在这里;
    }
  },

  //获取open_session  
  getSession(cb) {
    let that = this;
    //获取code
    wx.login({
      success: function (login) {
        let code = login.code;
        that.globalData.code = code;
        //获取encryptedData和iv
        wx.getUserInfo({
          //用户授权
          success: function (res) {
            that.globalData.userInfo = res.userInfo;//这里,赋完值函数就结束了
            that.globalData.encryptedData = res.encryptedData;
            that.globalData.iv = res.iv;
            that.httpPost({
              url: that.globalData.url + '/api/wx/returnOauth',
              data: {
                code: code,
                encryptedData: res.encryptedData,
                iv: res.iv,
                app_key: that.globalData.app_key
              }
            }, that).then(res => {
              console.log('这里是用户授权后调用returnOauth,获取并设置了open_session,session_time,user_id')
              //在globalData里存入open_session,session_time,user_id;
              that.globalData.open_session = res.data.open_session;
              wx.setStorageSync('open_session', res.data.open_session);
              that.globalData.session_time = Date.now();
              that.globalData.user_id = res.data.user_id;
              wx.setStorageSync("user_id", res.data.user_id);
              typeof cb == "function" && cb(wx.getStorageSync("user_id"));
            });
          },
          //用户不授权
          fail: function () {
            that.httpPost({
              url: that.globalData.url + '/api/wx/returnOauth',
              data: {
                code: code,
                app_key: that.globalData.app_key
              }
            }, that).then(res => {
              // this.log(this,"这里是用户没授权后调用returnOauth,获取并设置了open_session,session_time,user_id")
              //在globalData里存入open_session,session_time,user_id;
              that.globalData.open_session = res.data.open_session;
              wx.setStorageSync('open_session', res.data.open_session);
              that.globalData.session_time = Date.now();
              that.globalData.user_id = res.data.user_id;
              wx.setStorageSync("user_id", res.data.user_id);
              typeof cb == "function" && cb(wx.getStorageSync("user_id"));
            });
          },
        });
      }
    });
  },

  //进行授权验证
  getUserInfo(cb) {
    let that = this;
    //如果全局变量里有userInfo就去执行cb函数,如果全局变量里没有userInfo就去调用授权接口
    if (this.globalData.userInfo) {
      // this.log(this,"全局变量userInfo存在");
      typeof cb == "function" && cb(this.globalData.userInfo);
    } else {
      // this.log(this,"全局变量userInfo不存在");
      //调用登录接口
      wx.login({
        success: function (login) {
          let code = login.code;
          that.globalData.code = code;
          //获取用户信息
          wx.getUserInfo({
            success: function (res) {
              // this.log(this,"这里是wx.getUserInfo");
              // this.log(this,res);
              that.globalData.userInfo = res.userInfo;
              that.globalData.encryptedData = res.encryptedData;
              that.globalData.iv = res.iv;
              typeof cb == "function" && cb(that.globalData.userInfo);
            },
            fail: function (res) {
              // this.log(this,res);
            },
            complete: function () {
              //如果已经存在session_time就进行比较,如果不没有就建一个session_time;
              if (that.globalData.session_time) {

              } else {
                that.checkLogin(that);
              }
            }
          });
        }
      });
    }
  },

  //弹框--跳转首页或者完善信息页面(user_id为0)
  noUserId() {
    wx.showModal({
      title: "提示",
      content: "请先绑定个人信息",
      success: function (res) {
        if (res.confirm == true) {
          wx.navigateTo({
            url: '/pages/register/personInfo/personInfo',
          });
        } else {
          wx.switchTab({
            url: '/pages/discoverProject/discoverProject',
          });
        }
      }
    });
  },

  //根据用户信息完整度跳转不同的页面/*注册且信息完善:targetUrl; 注册信息不完善:companyInfo; 未注册: personInfo;*/
  infoJump(targetUrl) {
    let user_id = wx.getStorageSync('user_id');
    // 核对用户信息是否完整
    wx.request({
      url: this.globalData.url_common + '/api/user/checkUserInfo',
      data: {
        user_id: user_id
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status_code == 2000000) {
          let complete = res.data.is_complete;
          if (complete == 1) {
            if (targetUrl) {
              wx.navigateTo({
                url: targetUrl
              });
            }
          } else if (complete == 0) {
            wx.navigateTo({
              url: '/pages/register/companyInfo/companyInfo'
            });
          }
        } else {//后台返回500状态码,可能原因为参数的user_id传了0过去
          wx.navigateTo({
            url: '/pages/register/personInfo/personInfo'
          });
        }
      },
    });
  },
  // 检查用户信息,信息完整刚进行回调
  checkUserInfo(callBack) {
    let user_id = wx.getStorageSync('user_id');
    wx.getStorageSync('user_id');
    wx.request({
      url: this.globalData.url_common + '/api/user/checkUserInfo',
      data: {
        user_id: user_id
      },
      method: 'POST',
      success: function (res) {
        if (res.data.status_code == 2000000) {
          var complete = res.data.is_complete;
          if (complete == 1) {
            if (callBack) {
              callBack(res);
            }
          } else if (complete == 0) {
            wx.showModal({
              title: "提示",
              content: "请先绑定个人信息",
              success: function (res) {
                if (res.confirm == true) {
                  wx.navigateTo({
                    url: '/pages/register/companyInfo/companyInfo?type = ' + 2
                  });
                }
              }
            });
          }
        } else {
          wx.showModal({
            title: "提示",
            content: "请先绑定个人信息",
            success: function (res) {
              if (res.confirm == true) {
                wx.navigateTo({
                  url: '/pages/register/personInfo/personInfo?type =' + 1
                });
              }
            }
          });
        }
        // this.log(this,'checkUserInfo', res);
      }
    });
  },

  //industry多选标签数据预处理
  industryDeal(data) {
    if (data.length > 0) {
      let industry = wx.getStorageSync('industry');
      let newIndustry = industry;
      newIndustry.forEach(x => {
        data.forEach(y => {
          if (x.industry_name == y.industry_name) {
            x.check = true;
          }
        });
      });
      return newIndustry;
    } else {
      return data;
    }
  },

  // 多选标签页面间传值显示
  dealTagsData(that, data, dataCard, itemValue, itemId) {
    if (data) {
      dataCard.value = [];
      dataCard.id = [];
      data.forEach((x) => {
        if (x.check == true) {
          dataCard.id.push(x[itemId]);
          dataCard.value.push(x[itemValue]);
        }
      });
    }
    if (dataCard.value != "选择领域") {
      dataCard.css = "checkOn";
    } else {
      dataCard.css = "";
    }
    // this.log(this, dataCard.value);
    // this.log(this, dataCard.id)
  },

  //下拉加载事件封装(request需要设置,包括url和请求request所需要的data,str为展示数据字段,dataStr为取值数据字段)
  /* 初始必须在onShow()里初始化requestCheck:true(防多次请求),currentPage:1(当前页数),page_end:false(是否为最后一页) */
  loadMore(that, request, str, dataStr) {
    let user_id = wx.getStorageSync("user_id");
    let dataSum = that.data[str];
    if (that.data.requestCheck) {
      if (that.data.page_end == false) {
        wx.showToast({
          title: 'loading...',
          icon: 'loading'
        })
        request.data.page++;
        that.setData({
          currentPage: request.data.page,
          requestCheck: false,
          atBottom: false
        });
        //请求加载数据
        wx.request({
          url: request.url,
          data: request.data,
          method: 'POST',
          success: function (res) {
            let newPage = res.data.data;
            let page_end = res.data.page_end;
            if (dataStr && typeof dataStr == "string") {
              newPage = res.data[dataStr];
            }
            dataSum = dataSum.concat(newPage)
            that.setData({
              [str]: dataSum,
              page_end: page_end,
              requestCheck: true
            })
            if (page_end) {
              that.setData({
                atBottom: true
              })
            }
          },
          complete() {
            wx.hideLoading();
          }
        })
      } else {
        this.hasNothingMore(that);
        wx.hideLoading();
        that.setData({
          requestCheck: true
        });
      }
    }
  },
  loadMore2(that, request, callback) {
    let user_id = wx.getStorageSync("user_id");
    if (that.data.requestCheck) {
      if (that.data.page_end == false) {
        wx.showToast({
          title: 'loading...',
          icon: 'loading'
        })
        request.data.page++;
        that.setData({
          currentPage: request.data.page,
          requestCheck: false
        });
        //请求加载数据
        wx.request({
          url: request.url,
          data: request.data,
          method: 'POST',
          success: callback
        })
      } else {
        // this.errorHide(that, "没有更多了", 3000)
        that.setData({
          requestCheck: true
        });
      }
    }
  },
  // 买家图谱翻页
  loadMoreM(that, request, str, dataStr) {
    let user_id = wx.getStorageSync("user_id");
    let dataSum = that.data[str];
    if (that.data.requestCheck) {
      if (that.data.page_end1 == false) {
        wx.showToast({
          title: 'loading...',
          icon: 'loading'
        })
        request.data.page++;
        that.setData({
          currentPage1: request.data.page,
          requestCheck: false,
          atBottom: false
        });
        //请求加载数据
        wx.request({
          url: request.url,
          data: request.data,
          method: 'POST',
          success: function (res) {
            let newPage = res.data.data.investment_list;
            let page_end1 = res.data.data.page_end;
            if (dataStr && typeof dataStr == "string") {
              newPage = res.data[dataStr];
            }
            dataSum = dataSum.concat(newPage)
            that.setData({
              [str]: dataSum,
              page_end1: page_end1,
              requestCheck: true
            })
            if (page_end1) {
              that.setData({
                atBottom: true
              })
            }
          },
          complete() {
            wx.hideLoading();
          }
        })
      } else {
        this.hasNothingMore(that);
        wx.hideLoading();
        that.setData({
          requestCheck: true
        });
      }
    }
  },
  //初始化页面(others为其他要初始化的数据,格式为键值对.如{key:value},常用于上拉加载功能)
  initPage(that, others) {
    let user_id = wx.getStorageSync('user_id');
    that.setData({
      user_id: user_id,
      requestCheck: true,
      currentPage: 1,
      page_end: false
    })
    if (others) {
      that.setData(others)
    }
  },

  //添加人脉
  addContacts(that, addType, user_id, followed_id, callBack1, callBack2) {
    if (addType == 1) {
      wx.request({
        url: url + '/api/user/followUser',
        data: {
          user_id: user_id,
          followed_user_id: followed_id
        },
        method: 'POST',
        success: function (res) {
          callBack1(res)
        }
      })
    } else if (addType == 2) {
      wx.request({
        url: url + '/api/user/UserApplyFollowUser',
        data: {
          user_id: user_id,
          applied_user_id: followed_id
        },
        method: 'POST',
        success: function (res) {
          callBack2(res)
        }
      })
    } else {
      // this.log(this,"addType写错了")
    }
  },

  //重新封装console.log
  console(x) {
    if (this.globalData.url == 'https://wx.weitianshi.cn') {

    } else {
      // this.log(this,x)
    }
  },
  //展开
  allPoint(that, i, n = 7) {
    if (i == 0) {
      let checkedArr = {};
      for (let x = 0; x < n; x++) {
        let str1 = 'ischecked' + x;
        checkedArr[str1] = true;
      }
      that.setData({
        checkedArr: checkedArr
      })
    } else {
      let checkedArr = that.data.checkedArr;
      for (let x = 0; x < n; x++) {
        let str1 = 'ischecked' + x;
        checkedArr[str1] = !checkedArr[str1];
      }
      that.setData({
        checkedArr: checkedArr
      })
    }
  },
  //时间戳转换
  changeTime(x) {
    let n;
    if (x.length === 13) {
      n = x * 1
    } else {
      n = x * 1000
    }
    let date = new Date(n);
    let Y = date.getFullYear() + '-';
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    let D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    return (Y + M + D)
  },
  changeTimeStyle(x) {
    let n;
    if (x.length === 13) {
      n = x * 1
    } else {
      n = x * 1000
    }
    let date = new Date(n);
    let Y = date.getFullYear() + '.';
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '.';
    let D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    return (Y + M + D)
  },
  changeTimeStyle1(x) {
    let n;
    if (x.length === 13) {
      n = x * 1
    } else {
      n = x * 1000
    }
    let date = new Date(n);
    let Y = date.getFullYear() + '.';
    let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    return (Y + M)
  },
  //邮箱检验
  checkEmail(data) {
    let myreg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
    if (myreg.test(data)) {
      return true
    } else {
      return false
    }
  },

  //错误提示
  errorHide(target, errorText, time = 3000) {
    let that = target;
    that.setData({
      error: "1",
      error_text: errorText
    })
    let errorTime = setTimeout(function () {
      that.setData({
        error: "0"
      });
    }, time)
  },

  //头像上传
  headPic(that) {
    let user_id = that.data.user_id;
    let user_info = that.data.user_info;
    let url_common = this.globalData.url_common;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        let tempFilePaths = res.tempFilePaths;
        let avatar = tempFilePaths[0];
        let size = res.tempFiles[0].size;
        if (size <= 1048576) {
          wx.showLoading({
            title: '头像上传中',
            mask: true,
          })
          wx.uploadFile({
            url: url_common + '/api/team/uploadLogo', //仅为示例，非真实的接口地址
            filePath: tempFilePaths[0],
            name: 'avatar',
            formData: {
              user_id: user_id,
            },
            success: function (res) {
              let data = JSON.parse(res.data);
              if (data.status_code === 2000000) {
                wx.hideLoading();
                let image_id = data.data.image_id;
                that.setData({
                  image_id: image_id
                })
              }
            }
          })
          if (user_info.user_avatar_url) {
            user_info.user_avatar_url = tempFilePaths;
          } else if (user_info.user_avatar_text) {
            delete user_info.user_avatar_text;
            user_info.user_avatar_url = tempFilePaths;
          }
          that.setData({
            user_info: user_info
          })
        } else {
          app.errorHide(that, "上传图片不能超过1M", 1500)
        }
      }
    })
  },

  //身份信息
  identity(user_id, func) {
    let url_common = this.globalData.url_common;
    wx.request({
      url: url_common + '/api/user/getUserGroupByStatus',
      data: {
        user_id: user_id
      },
      method: 'POST',
      success: func
    })
  },

  //请求封装
  httpPost(data, that, callBack) {
    return httpModel.httpPost(data, that, callBack)
  },
  //用户操作模块(util/operationModel)
  operationModel() {
    let func = arguments[0];
    let parameter = [];
    if (typeof func != 'string') {
      // this.log(this,'第一个参数必需为调用函数名')
      return
    }
    for (let i = 0; i < arguments.length; i++) {
      if (i > 0) {
        parameter.push(arguments[i])
      }
    }
    switch (parameter.length) {
      case 0:
        OperationModel[func]();
        break;
      case 1:
        OperationModel[func](parameter[0]);
        break;
      default:
        OperationModel[func](...parameter);
        break;
    }
  },

  //分享引导模块跳转
  shareJump(num) {
    switch (num) {
      case '0':
        wx.switchTab({
          url: '/pages/discoverProject/discoverProject',
        });
        break;
      case '1':
        wx.switchTab({
          url: '/pages/discoverProject/discoverProject',
        });
        break;
      case '2':
        wx.switchTab({
          url: '/pages/discoverProject/discoverProject',
        });
        break;
      default:
        // this.log(this,'app.shareJump()参数错数');
        break;
    }
  },

  //投后股份格式校验
  stockCheck(that, pro_finance_stock_after) {
    // 投后股份项数值限定
    function checkNumber(data) {
      var reg = /^\d+\.[0-9]{2}/;
      if (reg.test(data)) {
        return true;
      }
      return false;
    }
    //处理下投后股份数据类型 
    if (isNaN(pro_finance_stock_after)) {
    } else {
      pro_finance_stock_after = Number(Number(pro_finance_stock_after).toFixed(2));
    }
    if (typeof pro_finance_stock_after != 'number' || pro_finance_stock_after < 0 || pro_finance_stock_after > 100) {
      if (pro_finance_stock_after < 0) {
        this.errorHide(that, '投后股份项应该为大于等0的数字', 3000);
      } else if (pro_finance_stock_after > 100) {
        this.errorHide(that, '投后股份项应该为小于等于100的小数位不超过两位的数字', 3000);
      } else if (typeof pro_finance_stock_after != 'number') {
        this.errorHide(that, '投后股份项应该为数字', 3000);
      }
      return;
    }
  },

  //保存按钮之后置灰,改方案,加loading
  disableButton(that) {
    that.setData({
      disabled: true,
      buttonOneText: '提交中'
    })
    wx.showLoading({
      title: 'loading',
      mask: true,
    })
  },

  //表单按钮后防连续点击处理
  buttonSubmit(that, submitData, buttonOneText, callBack) {
    this.disableButton(that);
    this.httpPost(submitData, that).then(res => {
      // this.log(this,'res', res)
      if (res.data.status_code == 2000000) {
        wx.hideLoading();
        callBack(res);
        setTimeout(x => {
          that.setData({
            disabled: false,
            buttonOneText: buttonOneText
          })
        }, 1000)
      } else {
        this.errorHide(that, res.data.error_msg, 3000)
        // 提交中过渡态处理
        wx.hideLoading();
        that.setData({
          disabled: false,
          buttonOneText: buttonOneText
        })
      }
    }).catch(res => {
      // 提交中过渡态处理
      wx.hideLoading();
      that.setData({
        disabled: false,
        buttonOneText: buttonOneText
      })
    })
  },

  //非表单提交按钮防连续点击处理
  delayDeal(callBack) {
    // this.log(this,this.globalData.delay_time)
    if (this.globalData.delay_time == 0) {
      this.globalData.delay_time == 1000;
      // this.log(this,this.globalData.delay_time)
      setTimeout(x => {
        this.globalData.delay_time == 0
      }, 1000)
      callBack()
    }
  },

  //页栈超出处理
  href(url = '/pages/discoverProject/discoverProject') {
    let indexList = [
      '/pages/discoverProject/discoverProject',
      '/pages/message/message/message',
      '/pages/my/myNew/myNew'
    ];
    let routerPage = this.globalData.routerPage;
    if (!routerPage.includes(url)) {
      // 记录路由
      routerPage.push(url);
      // this.log(this, this.globalData.url);
      setTimeout(rex => {
        routerPage.pop();
        // this.log(this, this.globalData.url);
      }, 1000)
      if (indexList.includes(url)) wx.switchTab({ url: url })
      else wx.navigateTo({ url: url })
    }
  },

  //多选
  checkMore(e, item, itemArr, that, itemName) {
    let target = e.currentTarget.dataset.item;
    let index = e.currentTarget.dataset.index;//获取当前点击的项的 index
    if (target.check == false) {
      //判断当前选中项是未选中的状态,如果是未选中的状态,则进入下面的判断
      if (itemArr.length < 5) {
        item[index].check = true;//当前点击项的check值更改为true
        itemArr.push(target)// 将当前选中的这项,添加到 itemArr中
      } else {
        this.errorHide(that, '不能选择超过5个标签', 3000)
      }
    } else {
      item[index].check = false;
      itemArr.forEach((y, index) => {
        if (target[itemName] == y[itemName]) {
          itemArr.splice(index, 1)
        }
      })
    }
    return {
      item: item,
      tran_arr: itemArr,
    }
  },

  //unLoad时消空tran_缓存
  initTran() {
    wx.setStorageSync('tran_industry', []);
    wx.setStorageSync('tran_scale', []);
    wx.setStorageSync('tran_stage', []);
    wx.setStorageSync('tran_area', []);
    wx.setStorageSync('tran_hotCity', []);
    wx.removeStorageSync('projectShopFilterCache');
  },
  //判断网络状态
  netWorkChange(that) {
    wx.onNetworkStatusChange(function (res) {
      if (res.networkType == "none") {
        that.setData({ nonet: false })
      } else {
        that.setData({ nonet: true })
      }
    })
  },

  hasNothingMore(that, page_end) {
    that.setData({
      atBottom: true
    })
  },
  // console.log 显示
  log(that, text, res) {
    if (this.globalData.url_common == 'https://wx.dev.weitianshi.cn') {
      console.log(text, res);
    } else {

    }
  },
  //初始本地缓存
  globalData: {
    routerPage: [],
    error: 0,
    picUrl: picUrl,
    app_id: 'wx02699b49950f4df2',
    app_key: 'wxos_czhd',
    open_session: '',
    delay_time: 0,
    // product
    url: "https://wx.weitianshi.cn",
    url_common: "https://wx.weitianshi.cn"

    // test
    // url: "https://wx.dev.weitianshi.cn",
    // url_common: "https://wx.dev.weitianshi.cn"
  },
}); 