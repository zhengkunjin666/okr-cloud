// app.js

App({
  onLaunch() {
		this.cloudInit();
	},
	cloudInit() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
				env: 'cloud1-2gh9k9bo21f99f8a',
        traceUser: true,
      });
		}
	},
});