const { pool } = require('../config/database');

// 创建成员
async function create(member) {
  const [result] = await pool.execute(
    `INSERT INTO members (
      id, name, gender, photo_url, birth_date, death_date,
      birth_place, residence, phone, email, spouse_name, spouse_id,
      father_id, mother_id, generation, order_in_generation,
      education, occupation, contribution, biography, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      member.id, member.name, member.gender, member.photo_url, member.birth_date, member.death_date,
      member.birth_place, member.residence, member.phone, member.email, member.spouse_name, member.spouse_id,
      member.father_id, member.mother_id, member.generation, member.order_in_generation,
      member.education, member.occupation, member.contribution, member.biography, member.created_by
    ]
  );
  return result;
}

// 根据ID查找成员
async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM members WHERE id = ?',
    [id]
  );
  return rows[0];
}

// 获取所有成员
async function findAll(options = {}) {
  let sql = 'SELECT * FROM members WHERE 1=1';
  const values = [];
  
  if (options.generation) {
    sql += ' AND generation = ?';
    values.push(options.generation);
  }
  
  if (options.gender) {
    sql += ' AND gender = ?';
    values.push(options.gender);
  }
  
  if (options.isAlive !== undefined) {
    if (options.isAlive) {
      sql += ' AND death_date IS NULL';
    } else {
      sql += ' AND death_date IS NOT NULL';
    }
  }
  
  if (options.search) {
    sql += ' AND name LIKE ?';
    values.push(`%${options.search}%`);
  }
  
  sql += ' ORDER BY generation, order_in_generation, birth_date';
  
  const [rows] = await pool.execute(sql, values);
  return rows;
}

// 更新成员信息
async function update(id, memberData) {
  const fields = [];
  const values = [];

  // 定义允许更新的字段（与数据库字段名一致）
  const allowedFields = [
    'name', 'gender', 'photo_url', 'birth_date', 'death_date',
    'birth_place', 'residence', 'phone', 'email', 'spouse_name', 'spouse_id',
    'father_id', 'mother_id', 'generation', 'order_in_generation',
    'education', 'occupation', 'contribution', 'biography', 'updated_by'
  ];

  for (const key of allowedFields) {
    if (memberData[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(memberData[key]);
    }
  }

  if (fields.length === 0) {
    console.log('没有需要更新的字段');
    return null;
  }

  const sql = `UPDATE members SET ${fields.join(', ')} WHERE id = ?`;
  values.push(id);

  console.log('执行SQL:', sql);
  console.log('参数值:', values);

  const [result] = await pool.execute(sql, values);
  console.log('更新结果:', result);
  return result;
}

// 删除成员
async function remove(id) {
  const [result] = await pool.execute(
    'DELETE FROM members WHERE id = ?',
    [id]
  );
  return result;
}

// 获取成员的子女
async function findChildren(memberId) {
  const [rows] = await pool.execute(
    'SELECT * FROM members WHERE father_id = ? OR mother_id = ? ORDER BY birth_date',
    [memberId, memberId]
  );
  return rows;
}

// 获取成员的祖先链
async function getAncestors(memberId, ancestors = []) {
  const member = await findById(memberId);
  if (!member) return ancestors;
  
  if (member.father_id) {
    const father = await findById(member.father_id);
    if (father) {
      ancestors.push({ ...father, relation: '父亲' });
      await getAncestors(member.father_id, ancestors);
    }
  }
  
  if (member.mother_id) {
    const mother = await findById(member.mother_id);
    if (mother) {
      ancestors.push({ ...mother, relation: '母亲' });
      await getAncestors(member.mother_id, ancestors);
    }
  }
  
  return ancestors;
}

// 获取成员的后代
async function getDescendants(memberId, descendants = []) {
  const children = await findChildren(memberId);
  
  for (const child of children) {
    descendants.push(child);
    await getDescendants(child.id, descendants);
  }
  
  return descendants;
}

// 获取统计信息
async function getStatistics() {
  const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM members');
  const [aliveResult] = await pool.execute('SELECT COUNT(*) as alive FROM members WHERE death_date IS NULL');
  const [generationResult] = await pool.execute(
    'SELECT generation, COUNT(*) as count FROM members GROUP BY generation ORDER BY generation'
  );
  const [genderResult] = await pool.execute(
    'SELECT gender, COUNT(*) as count FROM members GROUP BY gender'
  );
  
  return {
    total: totalResult[0].total,
    alive: aliveResult[0].alive,
    deceased: totalResult[0].total - aliveResult[0].alive,
    byGeneration: generationResult,
    byGender: genderResult
  };
}

// 获取家族树数据
async function getFamilyTree() {
  const [rows] = await pool.execute(
    'SELECT * FROM members ORDER BY generation, order_in_generation, birth_date'
  );
  return rows;
}

module.exports = {
  create,
  findById,
  findAll,
  update,
  remove,
  findChildren,
  getAncestors,
  getDescendants,
  getStatistics,
  getFamilyTree
};