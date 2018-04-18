var app = getApp();
var url = app.globalData.url;
var url_common = app.globalData.url_common;
Page({
  data: {

  },
  onLoad(options) {
    let project_id = options.project_id;
    let user_id = wx.getStorageSync("user_id");
    let that = this;
    app.httpPost({
      url: url_common + '/api/source/projectInfo',
      data: {
        user_id: user_id,
        project_id: project_id,
        project_source: "scrapy"
      }
    }, that).then(res => {
      let projectInfo = res.data.data;
      that.setData({
        projectInfo: projectInfo,
        project_id: project_id
      })
    })
  },
  onshow() {

  },
  // 跳转到首页
  moreProject() {
    app.href('/pages/discoverProject/discoverProject')
  },
  //商业计划书
  businessBook() {
    let BPath = this.data.BPath;
    let user_id = wx.getStorageSync('user_id');
    let project_id = this.data.id;
    let that = this;
    app.checkUserInfo(this, x => {
      if (BPath) {
        let aa = BPath;
        let one = aa.lastIndexOf(".");
        let bb = aa.substring((one + 1), aa.length);
        if (bb == 'zip' || bb == 'rar') {
          wx.showModal({
            title: '提示',
            content: '小程序暂不支持当前文件格式预览',
          })
        } else {
          wx.showActionSheet({
            itemList: ['直接预览', '发送到邮箱'],
            success(res) {
              if (res.tapIndex == 1) {
                app.checkUserInfo(this, res => {
                  let userEmail = res.data.user_email;
                  if (userEmail) {
                    that.setData({
                      userEmail: userEmail,
                      sendPc: 1,
                      checkEmail: true,
                    })
                  } else {
                    that.setData({
                      sendPc: 1,
                      checkEmail: false
                    })
                  }
                })
              } else if (res.tapIndex == 0) {
                wx.showLoading({
                  title: 'loading',
                  mask: true,
                })
                app.log("BP", BPath)
                wx.downloadFile({
                  url: BPath,
                  success(res) {
                    var filePath = res.tempFilePath;
                    app.log("bp", filePath)
                    wx.openDocument({
                      filePath: filePath,
                      success(res) {
                        app.log('打开文档成功')
                        wx.hideLoading();
                        wx.request({
                          url: url_common + '/api/project/insertViewBpRecord',
                          data: {
                            type: 'preview',
                            open_session: wx.getStorageSync('open_session'),
                            user_id: user_id,
                            project_id: project_id
                          },
                          method: 'POST',
                          success(res) {

                          },
                        })
                      }
                    })
                  },
                  fail() {
                    wx.hideLoading();
                    app.errorHide(that, '预览文件过大,请发送到邮箱查看', 3000)
                  }
                })
              }
            },
            fail(res) {
              app.errorHide(that, res.errMsg, 3000)
            }
          })
        }
      } else {
        wx.showModal({
          title: '提示',
          content: '未上传商业计划书',
        })
      }
    });
  },
  //联系项目方
  contactPerson() {
    let user_id = wx.getStorageSync('user_id');
    let that = this;
    app.checkUserInfo(this, res => {
      //如果信息完整就
      // 身份通过
      if (this.data.status === 2) {
        // 如果身份是买方FA，投资人，就去联系项目方
        if (this.data.group_id === 18 || this.data.group_id === 6) {
          //可以联系项目方
          that.setData({
            modalBox: 1
          })
        } else {
          that.setData({
            authenModelBox: 1
          })
        }
        // 其他全部去那边
      } else {
        that.setData({
          authenModelBox: 1
        })
      }
    })
  },
  //关闭模态框
  closeModal() {
    this.setData({
      modalBox: 0
    })
  },
  // 跳转用户详情
  userDetail(e) {
    let member_id = e.currentTarget.dataset.user;
    app.href('/pages/bigData/memberDetail/index/index?member_id=' + member_id)
  },
  //主要产品
  mainProject() {
    let project_id = this.data.project_id;
    app.href('/pages/bigData/projectDetail/mainProject/mainProject?project_id=' + project_id)
  },
  //历史融资
  historyFinance() {
    app.href('/pages/bigData/projectDetail/historyList/historyList')
  },
  //核心成员
  coreMember() {
    app.href('/pages/bigData/projectDetail/coreMember/coreMember')
  },
  //里程碑
  milestone() {
    app.href('/pages/bigData/projectDetail/milestone/milestone')
  },
  // 相似项目
  similarProject() {
    app.href('/pages/bigData/projectDetail/similarProject/similarProject')
  },
  //媒体报道
  mediaReport() {
    app.href('/pages/bigData/projectDetail/mediaReport/mediaReport')
  }
})