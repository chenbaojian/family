const { v4: uuidv4 } = require('uuid');
const Member = require('../models/Member');

// 日期格式化函数：将 ISO 格式转换为 YYYY-MM-DD
function formatDate(dateStr) {
  if (!dateStr) return null;
  // 如果已经是 YYYY-MM-DD 格式，直接返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // 如果是 ISO 格式，提取日期部分
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取成员列表（支持分页）
async function getMembers(req, res) {
  try {
    const { generation, gender, isAlive, search, page, pageSize } = req.query;
    
    const options = {};
    if (generation) options.generation = parseInt(generation);
    if (gender) options.gender = gender;
    if (isAlive !== undefined) options.isAlive = isAlive === 'true';
    if (search) options.search = search;
    if (page) options.page = parseInt(page);
    if (pageSize) options.pageSize = parseInt(pageSize);
    
    const result = await Member.findAll(options);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: Math.ceil(result.total / result.pageSize)
      }
    });
  } catch (error) {
    console.error('获取成员列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取成员列表失败'
    });
  }
}

// 获取成员详情
async function getMemberById(req, res) {
  try {
    const { id } = req.params;
    const member = await Member.findById(id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '成员不存在'
      });
    }
    
    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('获取成员详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取成员详情失败'
    });
  }
}

// 添加成员
async function createMember(req, res) {
  try {
    const {
      name, gender, birth_date, death_date,
      birth_place, residence, phone, email, spouse_name, spouse_id,
      father_id, mother_id, generation,
      education, occupation, contribution, biography
    } = req.body;

    // 验证必填字段
    if (!name || !gender || !birth_date || !generation) {
      return res.status(400).json({
        success: false,
        message: '姓名、性别、出生日期和代数为必填项'
      });
    }

    const newMember = {
      id: uuidv4(),
      name,
      gender,
      photo_url: null,
      birth_date: formatDate(birth_date),
      death_date: death_date ? formatDate(death_date) : null,
      birth_place: birth_place || null,
      residence: residence || null,
      phone: phone || null,
      email: email || null,
      spouse_name: spouse_name || null,
      spouse_id: spouse_id || null,
      father_id: father_id || null,
      mother_id: mother_id || null,
      generation: parseInt(generation),
      order_in_generation: 0,
      education: education || null,
      occupation: occupation || null,
      contribution: contribution || null,
      biography: biography || null,
      created_by: req.user.id
    };

    await Member.create(newMember);

    res.status(201).json({
      success: true,
      message: '添加成员成功',
      data: { id: newMember.id }
    });
  } catch (error) {
    console.error('添加成员错误:', error);
    res.status(500).json({
      success: false,
      message: '添加成员失败'
    });
  }
}

// 更新成员
async function updateMember(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_by: req.user.id };

    // 处理数值字段
    if (updateData.generation !== undefined && updateData.generation !== null) {
      updateData.generation = parseInt(updateData.generation);
    }

    // 处理日期字段，转换为 YYYY-MM-DD 格式
    if (updateData.birth_date) {
      updateData.birth_date = formatDate(updateData.birth_date);
    }
    if (updateData.death_date) {
      updateData.death_date = formatDate(updateData.death_date);
    }

    console.log('更新成员数据:', { id, updateData });

    const result = await Member.update(id, updateData);

    console.log('更新结果:', result);

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新成员错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败: ' + error.message
    });
  }
}

// 删除成员
async function deleteMember(req, res) {
  try {
    const { id } = req.params;
    
    // 检查是否有子女
    const children = await Member.findChildren(id);
    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该成员有子女，无法删除'
      });
    }
    
    await Member.remove(id);
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除成员错误:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
}

// 获取成员的祖先链
async function getAncestors(req, res) {
  try {
    const { id } = req.params;
    const ancestors = await Member.getAncestors(id);
    
    res.json({
      success: true,
      data: ancestors
    });
  } catch (error) {
    console.error('获取祖先链错误:', error);
    res.status(500).json({
      success: false,
      message: '获取祖先链失败'
    });
  }
}

// 获取成员的后代
async function getDescendants(req, res) {
  try {
    const { id } = req.params;
    const descendants = await Member.getDescendants(id);
    
    res.json({
      success: true,
      data: descendants
    });
  } catch (error) {
    console.error('获取后代错误:', error);
    res.status(500).json({
      success: false,
      message: '获取后代失败'
    });
  }
}

// 获取成员的亲属关系
async function getRelatives(req, res) {
  try {
    const { id } = req.params;
    const member = await Member.findById(id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '成员不存在'
      });
    }
    
    const relatives = {
      father: null,
      mother: null,
      spouse: null,
      children: [],
      siblings: []
    };
    
    // 获取父亲
    if (member.father_id) {
      relatives.father = await Member.findById(member.father_id);
    }
    
    // 获取母亲
    if (member.mother_id) {
      relatives.mother = await Member.findById(member.mother_id);
    }
    
    // 获取配偶
    if (member.spouse_id) {
      relatives.spouse = await Member.findById(member.spouse_id);
    }
    
    // 获取子女
    relatives.children = await Member.findChildren(id);
    
    // 获取兄弟姐妹
    if (member.father_id || member.mother_id) {
      const allChildrenResult = await Member.findAll({ page: 1, pageSize: 10000 });
      const allChildren = allChildrenResult.rows;
      relatives.siblings = allChildren.filter(m => 
        m.id !== id && 
        ((member.father_id && m.father_id === member.father_id) ||
         (member.mother_id && m.mother_id === member.mother_id))
      );
    }
    
    res.json({
      success: true,
      data: relatives
    });
  } catch (error) {
    console.error('获取亲属关系错误:', error);
    res.status(500).json({
      success: false,
      message: '获取亲属关系失败'
    });
  }
}

// 上传照片
async function uploadPhoto(req, res) {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的照片'
      });
    }
    
    const photoUrl = `/uploads/${req.file.filename}`;
    
    await Member.update(id, { photo_url: photoUrl });
    
    res.json({
      success: true,
      message: '照片上传成功',
      data: { photoUrl }
    });
  } catch (error) {
    console.error('上传照片错误:', error);
    res.status(500).json({
      success: false,
      message: '上传照片失败'
    });
  }
}

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getAncestors,
  getDescendants,
  getRelatives,
  uploadPhoto
};