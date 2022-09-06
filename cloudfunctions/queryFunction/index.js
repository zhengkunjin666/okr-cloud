// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cloud1-2gh9k9bo21f99f8a" });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const table = event.table;
  const _openid = event._openid;
  let status;
  !event.status ? "" : status = event.status;
  let done_at = event.done_at;
  if (!done_at) {
    return db.collection(table)
    .where({
      _openid,
      deleted_at: null,
      status,
    })
    .limit(1000)
    .orderBy("created_at", "desc")
    .get()
    .then(res => res)
    .catch(err => err);
  } else {
    return db.collection(table)
    .where({
      _openid,
      deleted_at: null,
      status,
    })
    .limit(1000)
    .orderBy("done_at", "desc")
    .get()
    .then(res => res)
    .catch(err => err);
  }
}