const { pool } = require('../config/database');

// 获取家族简介
async function getIntro() {
  const [rows] = await pool.execute(
    'SELECT * FROM family_intro WHERE id = 1'
  );
  return rows[0];
}

// 更新家族简介
async function updateIntro(data) {
  const { title, content, updated_by } = data;
  
  const [result] = await pool.execute(
    `UPDATE family_intro SET title = ?, content = ?, updated_by = ? WHERE id = 1`,
    [title, content, updated_by]
  );
  return result;
}

module.exports = {
  getIntro,
  updateIntro
};