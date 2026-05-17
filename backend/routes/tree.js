const express = require('express');
const router = express.Router();
const treeController = require('../controllers/treeController');
const { auth } = require('../middleware/auth');

// 获取家族树
router.get('/', auth, treeController.getFamilyTree);

// 获取指定代的成员
router.get('/generation/:gen', auth, treeController.getGenerationMembers);

// 获取统计数据
router.get('/stats', auth, treeController.getStatistics);

// 搜索成员
router.get('/search', auth, treeController.searchMembers);

module.exports = router;