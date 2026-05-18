const express = require('express');
const router = express.Router();
const familyCatalogController = require('../controllers/familyCatalogController');
const pdfUpload = require('../middleware/pdfUpload');
const upload = require('../middleware/upload');
const { auth, checkRole } = require('../middleware/auth');

// 获取族谱目录列表 - 所有登录用户可访问
router.get('/', auth, familyCatalogController.getCatalogs);

// 获取族谱目录详情 - 所有登录用户可访问
router.get('/:id', auth, familyCatalogController.getCatalogById);

// 创建族谱目录 - 管理员和编辑者可访问
router.post('/', auth, checkRole('admin', 'editor'), pdfUpload.single('pdf'), familyCatalogController.createCatalog);

// 更新族谱目录 - 管理员和编辑者可访问
router.put('/:id', auth, checkRole('admin', 'editor'), pdfUpload.single('pdf'), familyCatalogController.updateCatalog);

// 删除族谱目录 - 管理员可访问
router.delete('/:id', auth, checkRole('admin'), familyCatalogController.deleteCatalog);

module.exports = router;