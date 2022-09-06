// pages/okr_edit/okr_edit.js
const db = wx.cloud.database();

Page({
  data: {
    objective: "",
    array: [],
    btn: "保存"
  },
  count: 1,
  objectiveId: null,
  onLoad(options) {
    this.showOkr(options.id);
  },
  showOkr(id) {
		wx.showLoading({
			title: "加载中",
			mask: true
		});
    this.objectiveId = id;
    const that = this;
    db.collection("objective").doc(id).get({
      success(res) {
        const objective = res.data.objective;
        that.setData({ objective });
        db.collection("keyresult").where({ objective_id: id, deleted_at: null }).get({
          success(res) {
            const array = res.data;
            array.forEach(kr => kr.kr = that.count++);
            that.setData({ array });
						wx.hideLoading();
          },
          fail() {
            that.fail();
          }
				});
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
  changeValue(event) {
    const value = event.detail.value;
    const kr = event.currentTarget.dataset.kr;
    let array = this.data.array;
    array.forEach(data => {
      if (data.kr == kr) {
        data.keyresult = value;
      }
    });
    this.setData({
      array: array,
    });
  },
  addKR() {
    let array = this.data.array;
    array.push({ "kr": this.count++, "keyresult": null });
    this.setData({
      array: array,
    });
  },
  reduceKR(event) {
    const kr = event.currentTarget.dataset.kr;
    let array = this.data.array;
    const that = this;
    if (event.currentTarget.id) {
      const id = event.currentTarget.id;
      wx.showModal({
        title: "信息提示",
        content: "此为已保存过的数据，删除后若想恢复可联系管理员处理",
        showCancel: true,
        success(res) {
          if (res.confirm) {
            const deleted_at = db.serverDate();
            db.collection("keyresult").doc(id).update({
              data: { deleted_at },
              success() {
                array = array.filter(data => data._id != id);
                that.setData({
                  array: array,
                });
                wx.showToast({
                  title: "删除成功",
                  mask: true,
                });
              },
              fail() {
                that.fail();
              }
            })
          }
        }
      })
    } else {
      array = array.filter(data => data.kr != kr);
      this.setData({
        array: array,
      });
    }
  },
  formSubmit(event) {
    const okr = event.detail.value;
    const objective = okr.objective.trim();
    const keyresult = this.data.array;
    const blank = keyresult.filter(data => !data.keyresult);
    if (!objective || blank.length > 0) {
      wx.showToast({
        title: "输入框不能为空",
        icon: "none",
        mask: true,
      });
      return;
    }
    const objective_id = this.objectiveId;
    const updated_at = db.serverDate();
    const that = this;
    db.collection("objective").doc(objective_id).update({
      data: { objective, updated_at },
      success() {
        keyresult.map((data, index) => {
          if (data._id) {
            const keyresult = data.keyresult;
            db.collection("keyresult").doc(data._id).update({
              data: { keyresult },
              fail() {
                that.fail();
                return;
              }
            });
          } else if (!data._id) {
            const keyresult = data.keyresult.trim();
            const status = "doing";
            const done_at = null;
            const deleted_at = null;
            db.collection("keyresult").add({
              data: { keyresult, objective_id, status, done_at, deleted_at },
              fail() {
                that.fail();
                return;
              }
            })
          }
          if (keyresult.length - 1 == index) {
            wx.navigateBack({
              delta: 1,
              success() {
                wx.showToast({
                  title: "保存成功",
                  mask: true,
                });
              }
            });
          }
        });
      }
    })
  },
})