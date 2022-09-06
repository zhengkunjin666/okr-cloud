// pages/todo_keyresult/todo_keyresult.js
const db = wx.cloud.database();

Page({
  data: {
    okr: [],
  },
  todo_id: null,
  onLoad(option) {
    this.showPage(option.id, this.showActive);
  },
  showPage(id, callback) {
    this.todo_id = id;
    const table = "objective";
    const _openid = wx.getStorageSync("openid");
    const status = "doing";
    const done_at = false;
    const that = this;
    wx.cloud.callFunction({
      name: "queryFunction",
      data: { table, _openid, status, done_at },
      success(res) {
        const list = res.result.data;
        let okr = [];
        list.map((data, index) => {
          const objective_id = data._id;
          const deleted_at = null;
          db.collection("keyresult").where({ objective_id, deleted_at }).get({
            success(res) {
              okr.push({ objective: data.objective, keyresult: res.data });
              that.setData({ okr });
              list.length - 1 == index ? callback() : "";
            }
          })
        })
      },
      fail() {
        that.fail();
      }
    });
  },
  showActive(){
    const okr = this.data.okr;
    const todo_id = this.todo_id;
    const that = this;
    db.collection("todo_keyresult").where({ todo_id }).get({
      success(res) {
        const todo_keyresult = res.data;
        okr.forEach(data => {
          data.keyresult.forEach(kr => {
            todo_keyresult.forEach(data => {
              if (data.keyresult_id == kr._id) {
                kr.active = "active";
                kr.okr_id = data._id;
              }
            })
          })
        });
        that.setData({
          okr: okr,
        })
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
  changeColor(event) {
    const todo_id = this.todo_id;
    const keyresult_id = event.currentTarget.id;
    const active = event.currentTarget.dataset.active;
    const okr = this.data.okr;
    const that = this;
    if (!active) {
      okr.forEach(data => {
        data.keyresult.forEach(kr => {
          if (kr._id == keyresult_id && kr.active) {
            kr.active = "";
            const okr_id = kr.okr_id;
            db.collection("todo_keyresult").doc(okr_id).remove();
          }
        });
      });
      that.setData({
        okr: okr
      });
      return;
    }
    db.collection("todo_keyresult").add({
      data: { todo_id, keyresult_id, deleted_at: null },
      success(res) {
        okr.forEach(data => {
          data.keyresult.forEach(kr => {
            if (kr._id == keyresult_id) {
              kr.active = "active";
              kr.okr_id = res._id;
            }
          });
        })
        that.setData({
          okr: okr
        });
      },
      fail() {
        that.fail();
      }
    })
  }
})