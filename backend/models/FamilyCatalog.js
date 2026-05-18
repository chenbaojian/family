const { pool } = require('../config/database');

// 获取所有族谱目录
async function findAll() {
  const [rows] = await pool.execute(
    'SELECT * FROM family_catalog ORDER BY created_at DESC'
  );
  return rows;
}

// 根据ID获取族谱目录
async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM family_catalog WHERE id = ?',
    [id]
  );
  return rows[0];
}

// 创建族谱目录
async function create(data) {
  const { id, title, description, pdf_url, created_by } = data;
  const [result] = await pool.execute(
    `INSERT INTO family_catalog (id, title, description, pdf_url, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [id, title, description || null, pdf_url, created_by]
  );
  return result;
}

// 更新族谱目录
async function update(id, data) {
  const fields = [];
  const values = [];
  const allowedFields = ['title', 'description', 'pdf_url', 'updated_by'];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) return null;

  const sql = `UPDATE family_catalog SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);
  const [result] = await pool.execute(sql, values);
  return result;
}

// 删除族谱目录
async function remove(id) {
  const [result] = await pool.execute(
    'DELETE FROM family_catalog WHERE id = ?',
    [id]
  );
  return result;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};