// pages/okr/okr.js
const util = require('../../utils/util.js');
const db = wx.cloud.database();

Page({
  data: {
    list: [],
    show: false,
    btn: [
      { id: null, event: "toOkrDetail", name: "查看"},
      { id: null, event: "toOkrEdit", name: "编辑"},
      { id: null, event: "changeStatus", name: "标记为已完成", status: 0},
      { id: null, event: "deleteObjective", name: "删除"},
      { id: null, event: "hidePage", name: "取消"},
    ]
  },
  onLoad() {
    this.showList();
  },
  onShow() {
    this.showList();
  },
  showList() {
		wx.showLoading({
			title: "加载中",
			mask: true
		});
    const table = "objective";
    const _openid = wx.getStorageSync("openid");
    const done_at = false;
    const that = this;
    wx.cloud.callFunction({
      name: "queryFunction",
      data: { table, _openid, done_at },
      success(res) {
        const list = res.result.data;
        list.forEach(data => {
          data.created_at = util.formatTime(new Date(data.created_at));
          data.done_at = util.formatTime(new Date(data.done_at));
        })
        that.setData({ list });
				wx.hideLoading();
      },
      fail() {
        that.fail();
      }
    });
  },
  fail() {
    wx.showToast({
      title: "网络错误",
      icon: "error",
      mask: true
    })
  },
  toOkrCreate () {
    wx.navigateTo({
      url: '../okr_create/okr_create',
    })
  },
  showActionSheet(event) {
    const id = event.currentTarget.id;
    let status = event.currentTarget.dataset.status;
    let done_at = db.serverDate();
    let text;
    if (status == "doing") {
      text = "标记为已完成";
      status = "done";
    } else {
      text = "标记为未完成";
      status = "doing";
      done_at = null;
    }
		const that = this;
    wx.showActionSheet({
			itemList: ["查看", "编辑", text, "删除"],
			success(res) {
				const tapIndex = res.tapIndex;
				switch(tapIndex) {
					case 0:
						wx.navigateTo({
              url: `../okr_detail/okr_detail?id=${id}`,
            });
            break;
          case 1:
            wx.navigateTo({
              url: `../okr_edit/okr_edit?id=${id}`,
            });
            break;
					case 2:
						db.collection("objective").doc(id).update({
							data: { status, done_at },
							success() {
								wx.showToast({
									title: "标记成功",
									mask: true,
								});
								that.showList();
              },
              fail() {
                that.fail();
              }
            });
            break;
          case 3:
            wx.showModal({
              title: "信息提示",
              content: "删除后若想恢复可联系管理员处理",
              showCancel: true,
              success(res) {
                if (res.confirm) {
                  const deleted_at = db.serverDate();
                  db.collection("objective").doc(id).update({
                    data: { deleted_at },
                    success() {
                      const table = "keyresult";
                      const objective_id = id;
                      wx.cloud.callFunction({
                        name: "updateFunction",
                        data: { table, objective_id },
                        fail() {
                          that.fail();
                          return;
                        }
                      });
                      wx.showToast({
                        title: "删除成功",
                        mask: true,
                      });
                      that.showList();
                    }
                  })
                }
              },
              fail() {
                that.fail();
              }
            })
				}
			}
		})
  },
})