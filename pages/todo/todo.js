// pages/todo/todo.js
const util = require('../../utils/util.js');
const db = wx.cloud.database();

Page({
  data: {
    list: [],
    inputValue: null,
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
    const status = "doing";
    const done_at = false;
    const that = this;
    wx.cloud.callFunction({
      name: "queryFunction",
      data: { table, _openid, status, done_at },
      success(res) {
        const list = res.result.data;
        list.forEach(data => {
          data.created_at = util.formatTime(new Date(data.created_at));
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
  addTodo(event) {
    const todo = event.detail.value.trim();
    if (!todo) {
      wx.showToast({
        title: "输入框不能为空",
        icon: "none",
        mask: true,
      });
      return;
    }
    const status = "doing";
    const created_at = db.serverDate();
    const done_at = null;
    const deleted_at = null;
    db.collection("todo").add({
      data: {
        todo,
        created_at,
        status,
        done_at,
        deleted_at,
      }
    })
    .then(() => {
      wx.showToast({
        title: "添加成功",
        mask: true,
      });
      this.setData({
        inputValue: null
      });
      this.showList();
    })
    .catch(() => {
      this.fail();
    });
  },
  showActionSheet(event) {
		const id = event.currentTarget.id;
    const done_at = db.serverDate();
		const that = this;
    wx.showActionSheet({
			itemList: ["关联", "标记为已完成", "删除"],
			success(res) {
				const tapIndex = res.tapIndex;
				switch(tapIndex) {
					case 0:
						wx.navigateTo({
							url: `../todo_keyresult/todo_keyresult?id=${id}`,
            });
            break;
					case 1:
						db.collection("todo").doc(id).update({
							data: { status: "done", done_at },
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
          case 2:
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