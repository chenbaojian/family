const express = require('express');
const router = express.Router();
const { getFamilyIntro, updateFamilyIntro } = require('../controllers/familyIntroController');
const { auth, checkRole } = require('../middleware/auth');

// 获取家族简介（所有登录用户可访问）
router.get('/', auth, getFamilyIntro);

// 更新家族简介（管理员和编辑者可访问）
router.put('/', auth, checkRole('admin', 'editor'), updateFamilyIntro);

module.exports = router;