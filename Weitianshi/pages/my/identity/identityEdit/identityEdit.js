var app = getApp();
var url = app.globalData.url;
var url_common = app.globalData.url_common;
Page({
  data: {
    array: ['否', '是'],
    upLoadSuccess: false,
    buttonOneText: '提交',
    nonet: true
  },
  onLoad(option) {
    let that = this;
    app.netWorkChange(that);
    //用来判断是否是重新认证
    let recertification = option.isUpdate;
    // group_id 18:买方FA 19:卖方FA  6:投资人 3:创业者 8:其他
    let group_id = option.group_id;
    let authenticate_id = option.authenticate_id;
    let user_id = wx.getStorageSync('user_id');
    that.setData({
      group_id: group_id,
      recertification: recertification
    });
    //请求数据  recertification 1: 重新认证  0: 第一次认证
    if (recertification == 1) {
      wx.request({
        url: url_common + '/api/user/getUserGroupByStatus',
        data: {
          user_id: user_id
        },
        method: 'POST',
        success(res) {
          // 0:未认证1:待审核 2 审核通过 3审核未通过
          let status = res.data.status;
          let group_id = res.data.group.group_id;
          let authenticate_id = res.data.authenticate_id;
          that.setData({
            status: status,
            group_id: group_id,
            // type: type,
            authenticate_id: authenticate_id
          });
          wx.request({
            url: url_common + '/api/user/getUserAuthenticateInfo',
            data: {
              user_id: user_id,
              authenticate_id: authenticate_id
            },
            method: 'POST',
            success(res) {
              let user_info = res.data.user_info;
              let invest_info = res.data.invest_info;
              that.setData({
                user_info: user_info,
                invest_info: invest_info,
                is_FA_part: user_info.is_FA_part,
                is_alliance: user_info.is_alliance,
                is_financing: user_info.is_finacing,
                is_identify_member: user_info.is_identify_member,
                is_saas: user_info.is_saas
              });
            }
          });
        }
      });
    } else if (recertification == 0) {
      wx.request({
        url: url_common + '/api/user/getUserBasicInfo',
        data: {
          user_id: user_id
        },
        method: 'POST',
        success(res) {
          let user_info = res.data.user_info;
          let invest_info = res.data.invest_info;
          app.log("invest_info",invest_info);
          wx.setStorageSync("tran_scale", invest_info.invest_scale);
          wx.setStorageSync("tran_stage", invest_info.invest_stage);
          wx.setStorageSync("tran_hotCity", invest_info.invest_area);
          wx.setStorageSync("tran_industry", invest_info.invest_industry);
          that.setData({
            user_info: user_info,
            invest_info: invest_info,
            authenticate_id: authenticate_id
          });
        }
      });
    }
  },
  onShow() {
    let that=this;
    //更改某一项表单值后返回表单页面数据更新
    let invest_info = this.data.invest_info;
    app.log("invest_info",invest_info);
    // let user_info = this.data.user_info;
    let tran_industry = wx.getStorageSync('tran_industry') || [];
    let tran_scale = wx.getStorageSync('tran_scale') || [];
    let tran_stage = wx.getStorageSync('tran_stage') || [];
    let tran_hotCity = wx.getStorageSync('tran_hotCity') || [];
    let newScale = [];
    let newStage = [];
    let newArea = [];
    let newIndustry = [];
    let areaId = [];
    let scaleId = [];
    let stageId = [];
    let industryId = [];
    tran_industry.forEach(x => {
      newIndustry.push({ industry_name: x.industry_name });
      industryId.push({ industry_id: x.industry_id });
    });
    // 将scale_id 和scale_money 单独放入一个数组中,以便展示和保存
    tran_scale.forEach(x => {
      newScale.push({ scale_money: x.scale_money });
      scaleId.push({ scale_id: x.scale_id });
    });
    tran_stage.forEach(x => {
      newStage.push({ stage_name: x.stage_name });
      stageId.push({ stage_id: x.stage_id });
    });
    tran_hotCity.forEach(x => {
      newArea.push({ area_title: x.area_title });
      areaId.push({ area_id: x.area_id });
    });
    //如果是由更改表单某一项内容后返回该页面的话
    if (invest_info) {
      invest_info.invest_industry = newIndustry;
      invest_info.invest_scale = newScale;
      invest_info.invest_stage = newStage;
      invest_info.invest_area = newArea;
      this.setData({
        invest_info: invest_info,
        industryId: industryId,
        scaleId: scaleId,
        stageId: stageId,
        areaId: areaId
      });
    }
  },
  // 姓名type:0 手机type:1 品牌type:2 公司type:3 职位type:4 邮箱type:5  微信type:6 个人描述type:7
  //写入内容
  writeNewThing(e) {
    let type = e.currentTarget.dataset.type;
    let writeNameValue = this.data.user_info.user_real_name;
    let writeBrand = this.data.user_info.user_brand;
    let writeCompany = this.data.user_info.user_company_name;
    let writeCareer = this.data.user_info.user_company_career;
    let writeEmail = this.data.user_info.user_email;
    let writeWeChat = this.data.user_info.user_wechat;
    let writeDescrible = this.data.user_info.user_intro;
    if (type == 0) {
      app.href('/pages/form/personInfo/personInfo?name=' + writeNameValue + '&&type=0');
    } else if (type == 2) {
      app.href('/pages/form/personInfo/personInfo?brand=' + writeBrand + '&&type=2');
    }
    else if (type == 3) {
      // 跳转公司模糊搜索
      app.href('/pages/search/companySearch/companySearch?company=' + writeCompany + '&&type=3');
    }
    else if (type == 4) {
      app.href('/pages/form/personInfo/personInfo?career=' + writeCareer + '&&type=4');
    }
    else if (type == 5) {
      app.href('/pages/form/personInfo/personInfo?email=' + writeEmail + '&&type=5');
    }
    else if (type == 6) {
      app.href('/pages/form/personInfo/personInfo?writeWeChat=' + writeWeChat + '&&type=6');
    } else if (type == 7) {
      app.href('/pages/form/personInfo/personInfo?writeDescrible=' + writeDescrible + '&&type=7');
    }
  },
  // 上传名片
  scanIDcard() {
    let user_id = wx.getStorageSync('user_id');
    let group_id = this.data.group_id;
    let authenticate_id = this.data.authenticate_id;
    var that = this;
    wx.chooseImage({
      count: 1,
      success(res) {
        var tempFilePaths = res.tempFilePaths;
        let size = res.tempFiles[0].size;
        if (size <= 1048576) {
          wx.uploadFile({
            url: url_common + '/api/user/uploadCard',
            filePath: tempFilePaths[0],
            name: 'file',
            formData: {
              'user_id': user_id,
              'authenticate_id': authenticate_id
            },
            success(res) {
              let data = JSON.parse(res.data);
              if (data.status_code == 2000000) {
                wx.showToast({
                  title: '成功',
                  icon: 'success',
                  duration: 2000
                });
                that.setData({
                  upLoadSuccess: true
                });
              }
            }
          });
        } else {
          app.errorHide(that, "上传图片不能超过1M", 1500);
        }
      }
    });
  },
  // 跳转投资领域
  toIndustry() {
    app.href('/pages/form/industry/industry?current=1&identity=1');
  },
  // 跳转投资轮次
  toScale() {
    app.href('/pages/form/scale/scale');
  },
  // 跳转投资金额
  toStage() {
    app.href('/pages/form/stage/stage');
  },
  // 跳转投资地区
  toArea1() {
    app.href('/pages/form/area2/area2');
  },
  // 申请加入FA行业联盟
  bindFAService(e) {
    this.setData({
      is_alliance: e.detail.value
    });
  },
  // FA服务
  addFAService(e) {
    this.setData({
      is_identify_member: e.detail.value
    });
  },
  // sass服务
  sass(e) {
    this.setData({
      is_saas: e.detail.value
    });
  },
  // 兼职FA
  partFA(e) {
    this.setData({
      is_FA_part: e.detail.value
    });
  },
  // 需要FA顾问
  needFA(e) {
    this.setData({
      is_financing: e.detail.value
    });
  },
  // 提交保存跳转
  submit() {
    let that = this;
    let user_id = wx.getStorageSync('user_id');
    let authenticate_id = this.data.authenticate_id;
    // let group_id = this.data.group_id;
    let iden_name = this.data.user_info.user_real_name;
    let iden_company_name = this.data.user_info.user_company_name;
    let iden_company_career = this.data.user_info.user_company_career;
    let iden_email = this.data.user_info.user_email;
    let iden_wx = this.data.user_info.user_wechat;
    let iden_desc = this.data.user_info.user_intro;
    let iden_brand = this.data.user_info.user_brand;
    let is_financing = this.data.is_financing;
    let is_alliance = this.data.is_alliance;
    let is_identify_member = this.data.is_identify_member;
    let is_saas = this.data.is_saas;
    let is_FA_part = this.data.is_FA_part;
    let industry = this.data.industry;
    let recertification = this.data.recertification;
    if (iden_name == '') {
      app.errorHide(that, "姓名不能为空", 1500);
    } else if (iden_company_name == '') {
      app.errorHide(that, "公司不能为空", 1500);
    } else if (iden_company_career == '') {
      app.errorHide(that, "职位不能为空", 1500);
    } else {
      let submitData = {
        url: url_common + '/api/user/saveUserAuthentication',
        data: {
          user_id: user_id,
          authenticate_id: authenticate_id,
          iden_name: iden_name,
          iden_company_name: iden_company_name,
          iden_company_career: iden_company_career,
          iden_email: iden_email,
          iden_wx: iden_wx,
          iden_desc: iden_desc,
          iden_brand: iden_brand,
          is_financing: is_financing,
          is_alliance: is_alliance,
          is_identify_member: is_identify_member,
          is_saas: is_saas,
          is_FA_part: is_FA_part,
          industry: this.data.industryId,
          area: this.data.areaId,
          stage: this.data.stageId,
          scale: this.data.scaleId
        }
      };
      app.buttonSubmit(that, submitData, that.data.buttonOneText, res => {
        wx.removeStorageSync("tran_hotCity");
        wx.removeStorageSync("tran_stage");
        wx.removeStorageSync("tran_scale");
        wx.removeStorageSync("tran_industry");
        app.errorHide(that, '认证资料提交成功', 1000);
        setTimeout(res => {
          app.href('/pages/my/identity/identityResult/identityResult?authenticate_id=' + authenticate_id + '&&recertification=' + recertification);
        }, 1000);
      });
    }
  },
  onUnload() {
    app.initTran();
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