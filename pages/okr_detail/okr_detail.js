// pages/okr_detail/okr_detail.js
const util = require('../../utils/util.js');
const db = wx.cloud.database();

Page({
  data: {
    list: [],
    okr: [],
	},
	count: 1,
  objectiveId: null,
  onLoad(option) {
    this.showList(option.id);
  },
  showList(id) {
		if (this.count == 1) {
			this.count++;
			wx.showLoading({
				title: "加载中",
				mask: true
			});
		}
    this.objectiveId = id;
    const that = this;
    wx.cloud.callFunction({
      name: "OKRLookupFunction",
      data: { id },
      success(res) {
        const list = res.result.list;
        list[0].created_at = util.formatTime(new Date(list[0].created_at));
        list[0].done_at = util.formatTime(new Date(list[0].done_at));
        that.setData({ list });
        const keyresult = res.result.keyresult;
        keyresult.forEach(data => {
          if (data.status == "done") {
            data.active = "active";
          } else {
            data.active = "";
          }
          data.todos.forEach(todo => {
            if (todo.status == "done") {
              todo.active = "active";
            }
          })
        })
        that.setData({ okr: keyresult });
				wx.hideLoading();
      },
      fail() {
        that.fail();
      }
    })
  },
  fail() {
    wx.showToast({
      title: "网络错误",
      icon: "error",
      mask: true
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
			itemList: [text, "删除"],
			success(res) {
				const tapIndex = res.tapIndex;
				switch(tapIndex) {
					case 0:
            db.collection("objective").doc(id).update({
              data: { status, done_at },
							success() {
								wx.showToast({
									title: "标记成功",
									mask: true,
								});
								that.showList(id);
              },
              fail() {
                that.fail();
              }
            })
            break;
          case 1:
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
                      wx.switchTab({
                        url: "/pages/okr/okr",
                        success() {
                          wx.showToast({
                            title: "删除成功",
                            mask: true,
                          });
                        }
                      })
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
  changeKRStatus(event) {
    const objectiveId = this.objectiveId;
    const id = event.currentTarget.id;
    let status = event.currentTarget.dataset.status;
    let done_at = db.serverDate();
    if (status == "doing") {
      status = "done";
    } else {
      status = "doing";
      done_at = null;
    }
    const that = this;
    db.collection("keyresult").doc(id).update({
      data: { status, done_at },
      success() {
        wx.showToast({
          title: "标记成功",
          mask: true,
        });
        that.showList(objectiveId);
      },
      fail() {
        that.fail();
      }
    })
  }
})