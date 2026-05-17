const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const upload = require('../middleware/upload');
const { auth, checkRole } = require('../middleware/auth');

// 获取成员列表 - 需要认证
router.get('/', auth, memberController.getMembers);

// 获取成员详情 - 需要认证
router.get('/:id', auth, memberController.getMemberById);

// 添加成员 - 需要编辑权限
router.post('/', auth, checkRole('admin', 'editor'), memberController.createMember);

// 更新成员 - 需要编辑权限
router.put('/:id', auth, checkRole('admin', 'editor'), memberController.updateMember);

// 删除成员 - 需要管理员权限
router.delete('/:id', auth, checkRole('admin'), memberController.deleteMember);

// 获取祖先链
router.get('/:id/ancestors', auth, memberController.getAncestors);

// 获取后代
router.get('/:id/descendants', auth, memberController.getDescendants);

// 获取亲属关系
router.get('/:id/relatives', auth, memberController.getRelatives);

// 上传照片 - 需要编辑权限
router.post('/:id/photo', auth, checkRole('admin', 'editor'), upload.single('photo'), memberController.uploadPhoto);

module.exports = router;