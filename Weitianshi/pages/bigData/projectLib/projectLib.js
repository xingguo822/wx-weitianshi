let app = getApp();
let url_common = app.globalData.url_common;
import * as FilterModel from '../../../utils/model/filterModel';
Page({
  data: {
    //筛选搜索 
    SearchInit: FilterModel.data,
    label_industry: FilterModel._label_industry,
    linkDataShow: FilterModel._linkDataShow,
    //置顶
    scrollTop: 3000
  },
  onLoad() {
    let that = this;
    let user_id = wx.getStorageSync('user_id');
    let SearchInit = that.data.SearchInit;
    let tab = SearchInit.tab;
    //更改搜索模块初始化设置
    FilterModel.reInitSearch(that, {
      tab: [
        { type: 2, name: '领域', label: 'label_industry', itemId: 'industry_id', itemName: 'industry_name', longCheckBox: false, page: '0' },
        { type: 1, name: '地区', label: "hotCity", itemId: 'area_id', itemName: 'area_title', longCheckBox: false },
        { type: 1, name: '轮次', label: "scale", itemId: 'scale_id', itemName: 'scale_money', longCheckBox: true },
        { type: 1, name: '类型', label: "label_type", itemId: 'type_id', itemName: 'type_name', longCheckBox: true },
      ],
    });
    if (SearchInit.industry.length < 1) {
      tab.forEach(x => {
        SearchInit[x.label] = wx.getStorageSync(x.label);
      });
      that.setData({
        SearchInit
      });
    }
    //----------------------------------------------------
    app.initPage(this)

    // 获得项目列表
    this.getProjectList();
  },
// -----------------------------------------------------------------------------------
  // 获取项目列表
  getProjectList() {
    app.httpPost({
      url: url_common + '/api/source/projectLists',
      data: {
        user_id: wx.getStorageSync('user_id'),
        page: this.data.currentPage,
        filter: this.data.SearchInit.searchData,
      }
    }, this).then(res => {
      let currentPage = this.data.currentPage;
      let projectList = this.data.projectList || [];
      let newList = res.data.data.list;
      projectList = projectList.concat(newList);
      currentPage++;
      this.setData({
        projectList,
        page_end:res.data.data.page_end,
        currentPage
      })
      wx.hideLoading();
    })
  },
  // 上拉加载
  loadMore(){
    wx.showLoading({
      title: 'loading',
    })
    if(this.data.page_end == true){
      wx.hideLoading();
      return app.errorHide(this,'没有更多了')
    }
    this.getProjectList();
  },

// --------------------------筛选搜索--------------------------------------------------
// 下拉框
move(e) {
  let that = this;
  let SearchInit = this.data.SearchInit;
  FilterModel.move(e, that);
},
// 标签选择
tagsCheck(e) {
  FilterModel.tagsCheck(e, this);
},
// 标签全选(单项式)
tagsCheckAll(e) {
  FilterModel.tagsCheckAll(this, e);
},
// 筛选重置
reset() {
  FilterModel.reset(this);
},
// 筛选全部重置
allReset() {
  FilterModel.allReset(this);
},
// 筛选确定
searchCertain() {
  let that = this;
  let current = this.data.currentTab;
  let SearchInit = this.data.SearchInit;
  let searchData = FilterModel.searchCertain(that);
  SearchInit.searchData = searchData;
  this.setData({
    searchInit: SearchInit
  });
  app.log(this.data.searchInit)
},
// 点击modal层
modal() {
  let that = this;
  FilterModel.modal(that);
},
// 搜索
searchSth() {
  let that = this;
  let str;
  str = this.data.currentTab == 0 ? "selected" : "newest";
  FilterModel.searchSth(that, str, x => {
    app.href(
      "/pages/search/globalSearch/globalSearch"
    );
  });
},
// 展示项删除
labelDelete(e) {
  FilterModel.labelDelete(e, this);
},
// 一级联动选择
linkFirstStair(e) {
  app.log("industry", this.data.label_industry);
  FilterModel.linkFirstStair(e, this);
},
// 二级联动选择
linkSecondStair(e) {
  FilterModel.linkSecondStair(e, this);
},
// 联动选择全部
linkCheckAll(e) {
  FilterModel.linkCheckAll(e, this);
},
//----------------------置顶-------------------------------------
_toTop(){
  this.setData({
    scrollTop: 0
  })
}
})