const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, checkRole } = require('../middleware/auth');

// 公开路由
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需要认证的路由
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/password', auth, authController.changePassword);

// 管理员路由
router.get('/users', auth, checkRole('admin'), authController.getAllUsers);
router.put('/users/:userId', auth, checkRole('admin'), authController.updateUserStatus);
router.delete('/users/:userId', auth, checkRole('admin'), authController.deleteUser);

module.exports = router;