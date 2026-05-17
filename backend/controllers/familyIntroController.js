const FamilyIntro = require('../models/FamilyIntro');

// 获取家族简介
async function getFamilyIntro(req, res) {
  try {
    const intro = await FamilyIntro.getIntro();
    
    res.json({
      success: true,
      data: intro || { title: '家族简介', content: '' }
    });
  } catch (error) {
    console.error('获取家族简介错误:', error);
    res.status(500).json({
      success: false,
      message: '获取家族简介失败'
    });
  }
}

// 更新家族简介
async function updateFamilyIntro(req, res) {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }
    
    const result = await FamilyIntro.updateIntro({
      title,
      content,
      updated_by: req.user.id
    });
    
    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新家族简介错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
}

module.exports = {
  getFamilyIntro,
  updateFamilyIntro
};