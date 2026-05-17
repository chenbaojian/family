const { pool } = require('../config/database');

// 创建用户
async function create(user) {
  const [result] = await pool.execute(
    `INSERT INTO users (id, username, password, email, phone, role, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.username, user.password, user.email, user.phone, user.role, user.status]
  );
  return result;
}

// 根据用户名查找用户
async function findByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return rows[0];
}

// 根据ID查找用户
async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

// 更新用户信息
async function update(id, userData) {
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(userData)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (fields.length === 0) return null;
  
  values.push(id);
  const [result] = await pool.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return result;
}

// 获取所有用户
async function findAll() {
  const [rows] = await pool.execute(
    'SELECT id, username, email, phone, role, status, created_at FROM users'
  );
  return rows;
}

// 删除用户
async function remove(id) {
  const [result] = await pool.execute(
    'DELETE FROM users WHERE id = ?',
    [id]
  );
  return result;
}

module.exports = {
  create,
  findByUsername,
  findById,
  update,
  findAll,
  remove
};