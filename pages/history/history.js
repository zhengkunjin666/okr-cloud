// pages/history/history.js
const util = require('../../utils/util.js');
const db = wx.cloud.database();

Page({
  data: {
    list: [],
  },
	count: 1,
  onLoad() {
    this.showList();
  },
  onShow() {
    this.showList();
	},
  showList() {
		if (this.count == 1) {
			this.count++;
			wx.showLoading({
				title: "加载中",
				mask: true
			});
		}
    const table = "todo";
    const _openid = wx.getStorageSync("openid");
    const status = "done";
    const done_at = true;
    const that = this;
    wx.cloud.callFunction({
      name: "queryFunction",
      data: { table, _openid, status, done_at },
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
    const done_at = null;
		const that = this;
    wx.showActionSheet({
			itemList: ["标记为未完成", "删除"],
			success(res) {
				const tapIndex = res.tapIndex;
				switch(tapIndex) {
					case 0:
						db.collection("todo").doc(id).update({
							data: { status: "doing", done_at },
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
          case 1:
            wx.showModal({
              title: "信息提示",
              content: "删除后若想恢复可联系管理员处理",
              showCancel: true,
              success(res) {
                if (res.confirm) {
                  const deleted_at = db.serverDate();
                  db.collection("todo").doc(id).update({
                    data: { deleted_at },
                    success() {
                      const table = "todo_keyresult";
                      const todo_id = id;
                      wx.cloud.callFunction({
                        name: "updateFunction",
                        data: { table, todo_id },
                        fail() {
                          that.fail();
                          return;
                        }
                      });
                      that.showList();
                      wx.showToast({
                        title: "删除成功",
                        mask: true,
                      });
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