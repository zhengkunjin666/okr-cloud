// pages/okr_create/okr_create.js
const db = wx.cloud.database();

Page({
  data: {
    array: [],
    btn: "新增"
  },
  count: 1,
  addKR() {
    let array = this.data.array;
    array.push({ _id: this.count++ });
    this.setData({
      array: array,
    });
  },
  changeValue(event) {
    const value = event.detail.value;
    const id = event.currentTarget.id;
    let array = this.data.array;
    array.forEach(data => {
      if (data._id == id) {
        data.keyresult = value;
      }
    })
    this.setData({
      array: array,
    });
  },
  reduceKR(event) {
    const id = event.currentTarget.id;
    let array = this.data.array;
    array.forEach((data, index) => {
      data._id == id ? array.splice(index, 1) : "";
    })
    this.setData({
      array: array,
    });
  },
  formSubmit(event) {
    const okr = event.detail.value;
    const objective = okr.objective.trim();
    if (!objective) {
      wx.showToast({
        title: '缺少参数',
      });
      return;
    }
    const created_at = db.serverDate();
    const status = "doing";
    const done_at = null;
    const deleted_at = null;
    const that = this;
    db.collection("objective").add({
      data: { objective, created_at, status, done_at, deleted_at},
      success(res) {
        delete okr.objective;
        if (Object.keys(okr).length > 0) {
          Object.keys(okr).map((key) => {
            if (okr[key]) {
              const keyresult = okr[key].trim();
              const objective_id = res._id;
              db.collection("keyresult").add({
                data: { keyresult, objective_id, status, done_at, deleted_at },
                fail() {
                  that.fail();
                  return;
                }
              })
            }
          });
        }
        wx.navigateBack({
          delta: 1,
          success() {
            wx.showToast({
              title: "新增成功",
              mask: true,
            });
          }
        })
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
})