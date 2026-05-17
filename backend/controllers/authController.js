const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// 用户注册
async function register(req, res) {
  try {
    const { username, password, email, phone } = req.body;
    
    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码为必填项'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      email: email || null,
      phone: phone || null,
      role: 'viewer', // 默认为查看者
      status: 'pending' // 默认待审核
    };
    
    await User.create(newUser);
    
    res.status(201).json({
      success: true,
      message: '注册成功，请等待管理员审核'
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
}

// 用户登录
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码为必填项'
      });
    }
    
    // 查找用户
    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 检查用户状态
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: '账号待审核，请等待管理员审核'
      });
    }
    
    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }
    
    // 生成Token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
}

// 获取当前用户信息
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
}

// 更新用户信息
async function updateProfile(req, res) {
  try {
    const { email, phone } = req.body;
    
    await User.update(req.user.id, { email, phone });
    
    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
}

// 修改密码
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码和新密码为必填项'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    // 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '旧密码错误'
      });
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.update(req.user.id, { password: hashedPassword });
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
}

// 获取所有用户（管理员）
async function getAllUsers(req, res) {
  try {
    const users = await User.findAll();
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
}

// 更新用户状态（管理员）
async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status, role } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;

    await User.update(userId, updateData);

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
}

// 删除用户（管理员）
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    // 不能删除自己
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账号'
      });
    }

    // 检查用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能删除管理员
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: '不能删除管理员账号'
      });
    }

    await User.remove(userId);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserStatus,
  deleteUser
};