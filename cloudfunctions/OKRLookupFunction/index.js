// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: "cloud1-2gh9k9bo21f99f8a" });
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const _id = event.id;
  return db.collection("objective").aggregate().match({ _id })
  .lookup({
    from: "keyresult",
    localField: "_id",
    foreignField: "objective_id",
    as: "keyresult"
  })
  .lookup({
    from: "todo_keyresult",
    localField: "keyresult._id",
    foreignField: "keyresult_id",
    as: "okr"
  })
  .lookup({
    from: "todo",
    localField: "okr.todo_id",
    foreignField: "_id",
    as: "todos"
  })
  .end()
  .then(res => {
    const list = res.list[0];
    let keyresult = list.keyresult;
    const okr = list.okr;
    const todos = list.todos;
    keyresult = keyresult.filter(data => !data.deleted_at)
    for (let i = 0; i < keyresult.length; i++) {
      keyresult[i].todos = [];
      okr.map(data => {
        if (data.keyresult_id == keyresult[i]._id) {
          todos.map(todo => {
            if (todo._id == data.todo_id && !todo.deleted_at) {
              keyresult[i].todos.push(todo);
            }
          })
        }
      })
    };
    return { list: res.list, keyresult }
  })
  .catch(err => data = err);
}