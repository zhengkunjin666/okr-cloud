// pages/welcome/welcome.js

Page({
  onLoad() {
    this.hasUser();
  },
  hasUser() {
    const userId = wx.getStorageSync("userId");
    if (userId) {
      wx.switchTab({
        url: "/pages/todo/todo"
      })
    }
  },
  login() {
    wx.getUserProfile({
      desc: "用于获取用户头像和昵称",
      success(res) {
        console.log(res)
        let userInfo = res.userInfo;
        const name = userInfo.nickName;
        const avatar = userInfo.avatarUrl;
        const db = wx.cloud.database();
        const created_at = db.serverDate();
        db.collection("user").add({
          data: {
            name,
            avatar,
            created_at,
            isManager: false,
          }
        })
        .then((res) => {
          wx.setStorage({
            key: "userId",
            data: res._id
          });
          wx.cloud.callFunction({
            name: "wxContext",
            success(res) {
              const openid = res.result.openid;
              wx.setStorage({
                key: "openid",
                data: openid
              });
            }
          });
          wx.switchTab({
            url: "/pages/todo/todo"
          });
        })
        .catch(() => {
          wx.showToast({
            title: '网络错误',
            icon: error,
            mask: true
          })
        })
      }
    })
  },
  fail(err) {
    console.error("[云函数] [wxContext] 调用失败", err);
  }
})