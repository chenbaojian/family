const { v4: uuidv4 } = require('uuid');
const FamilyCatalog = require('../models/FamilyCatalog');

// 获取族谱目录列表
async function getCatalogs(req, res) {
  try {
    const catalogs = await FamilyCatalog.findAll();
    res.json({
      success: true,
      data: catalogs
    });
  } catch (error) {
    console.error('获取族谱目录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取族谱目录失败'
    });
  }
}

// 获取族谱目录详情
async function getCatalogById(req, res) {
  try {
    const { id } = req.params;
    const catalog = await FamilyCatalog.findById(id);
    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: '族谱目录不存在'
      });
    }
    res.json({
      success: true,
      data: catalog
    });
  } catch (error) {
    console.error('获取族谱目录详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取族谱目录详情失败'
    });
  }
}

// 创建族谱目录
async function createCatalog(req, res) {
  try {
    const { title, description } = req.body;
    const pdfUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '标题不能为空'
      });
    }

    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        message: '请上传PDF文件'
      });
    }

    const newCatalog = {
      id: uuidv4(),
      title,
      description: description || null,
      pdf_url: pdfUrl,
      created_by: req.user.id
    };

    await FamilyCatalog.create(newCatalog);

    res.status(201).json({
      success: true,
      message: '创建成功',
      data: { id: newCatalog.id, pdf_url: pdfUrl }
    });
  } catch (error) {
    console.error('创建族谱目录错误:', error);
    res.status(500).json({
      success: false,
      message: '创建族谱目录失败'
    });
  }
}

// 更新族谱目录（可更换PDF）
async function updateCatalog(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_by: req.user.id };

    // 如果有新上传的PDF文件
    if (req.file) {
      updateData.pdf_url = `/uploads/${req.file.filename}`;
    }

    const result = await FamilyCatalog.update(id, updateData);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '族谱目录不存在'
      });
    }

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新族谱目录错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
}

// 删除族谱目录
async function deleteCatalog(req, res) {
  try {
    const { id } = req.params;
    await FamilyCatalog.remove(id);
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除族谱目录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
}

module.exports = {
  getCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog
};