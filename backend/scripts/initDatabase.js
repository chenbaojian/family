const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库初始化脚本
async function initDatabase() {
  let connection;

  try {
    // 先连接MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ 已连接MySQL服务器');

    // 创建数据库
    const dbName = process.env.DB_NAME || 'family_tree';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 "${dbName}" 已创建/存在`);

    // 切换到该数据库
    await connection.changeUser({ database: dbName });

    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
        status ENUM('pending', 'active', 'disabled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 用户表已创建');

    // 创建家族成员表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        gender ENUM('male', 'female') NOT NULL,
        photo_url VARCHAR(255),
        birth_date DATE NOT NULL,
        death_date DATE,
        birth_place VARCHAR(100),
        residence VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        spouse_name VARCHAR(50),
        spouse_id VARCHAR(36),
        father_id VARCHAR(36),
        mother_id VARCHAR(36),
        generation INT NOT NULL,
        order_in_generation INT DEFAULT 0,
        education VARCHAR(100),
        occupation VARCHAR(100),
        contribution TEXT,
        biography TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by VARCHAR(36),
        updated_by VARCHAR(36),

        FOREIGN KEY (father_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (mother_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (spouse_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 家族成员表已创建');

    // 添加phone和email字段（如果表已存在但字段不存在）
    try {
      await connection.execute(`ALTER TABLE members ADD COLUMN phone VARCHAR(20)`);
      console.log('✅ 手机号字段已添加');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }
    try {
      await connection.execute(`ALTER TABLE members ADD COLUMN email VARCHAR(100)`);
      console.log('✅ 邮箱字段已添加');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }

    // 创建照片表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS photos (
        id VARCHAR(36) PRIMARY KEY,
        member_id VARCHAR(36) NOT NULL,
        url VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 照片表已创建');

    // 创建家族简介表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS family_intro (
        id INT PRIMARY KEY DEFAULT 1,
        title VARCHAR(100) DEFAULT '家族简介',
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by VARCHAR(36)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 家族简介表已创建');

    // 插入默认家族简介
    try {
      await connection.execute(`
        INSERT IGNORE INTO family_intro (id, title, content)
        VALUES (1, '陈氏家族简介', '欢迎来到陈氏家族族谱系统。这里记录了陈氏家族的血脉传承和家族成员信息。')
      `);
    } catch (err) {
      // 忽略已存在的错误
    }

    // 创建默认管理员账号
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);

    try {
      await connection.execute(
        `INSERT INTO users (id, username, password, role, status) VALUES (?, ?, ?, 'admin', 'active')`,
        [adminId, 'admin', hashedPassword]
      );
      console.log('✅ 默认管理员账号已创建');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
      console.log('   ⚠️  请登录后立即修改密码！');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  管理员账号已存在，跳过创建');
      } else {
        throw err;
      }
    }

    console.log('\n🎉 数据库初始化完成！\n');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();