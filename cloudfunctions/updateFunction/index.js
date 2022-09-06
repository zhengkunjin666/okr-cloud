// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cloud1-2gh9k9bo21f99f8a" });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const table = event.table;
  let objective_id;
  !event.objective_id ? "" : objective_id = event.objective_id;
  let todo_id;
  !event.todo_id ? "" : todo_id = event.todo_id;
  const deleted_at = db.serverDate();
  try {
    return await db.collection(table).where({ objective_id, todo_id })
    .update({
      data: {
        deleted_at,
      },
    })
  } catch(e) {
    console.error(e)
  }
}