const Member = require('../models/Member');

// 获取家族树数据
async function getFamilyTree(req, res) {
  try {
    const members = await Member.getFamilyTree();

    // 构建树形结构
    const memberMap = {};
    const tree = [];

    // 先创建映射
    members.forEach(member => {
      memberMap[member.id] = {
        ...member,
        children: [],
        spouse: null // 配偶信息
      };
    });

    // 构建配偶关系
    // 规则：
    // 1. 男性成员有子女时，配偶（母亲）显示在男性旁边（仅当母亲没有父亲时）
    // 2. 女性成员有父亲（属于家族），配偶显示在女性旁边
    // 3. 女性成员无父亲（外姓人），作为配偶显示在男性旁边
    members.forEach(member => {
      if (member.gender === 'male' && memberMap[member.id]) {
        // 男性成员：查找其子女的母亲
        const children = members.filter(m => m.father_id === member.id && m.mother_id);
        if (children.length > 0) {
          const motherId = children[0].mother_id;
          if (motherId && memberMap[motherId] && !memberMap[motherId]._isSpouseOf) {
            const motherNode = memberMap[motherId];
            // 只有当母亲没有父亲（外姓人）时，才把母亲作为配偶
            if (!motherNode.father_id) {
              memberMap[member.id].spouse = motherNode;
              motherNode._isSpouseOf = member.id;
            }
          }
        }
      } else if (member.gender === 'female' && memberMap[member.id] && member.spouse_id) {
        // 女性成员有配偶
        // 只有当女性有父亲（属于家族成员）时，才把配偶显示在她旁边
        if (member.father_id && memberMap[member.father_id]) {
          const spouseNode = memberMap[member.spouse_id];
          if (spouseNode && !spouseNode._isSpouseOf) {
            memberMap[member.id].spouse = spouseNode;
            spouseNode._isSpouseOf = member.id;
          }
        }
      }
    });

    // 构建树
    members.forEach(member => {
      const node = memberMap[member.id];

      // 如果该成员已作为配偶处理，跳过（不作为独立节点显示）
      if (node._isSpouseOf) return;

      if (member.father_id && memberMap[member.father_id]) {
        const fatherNode = memberMap[member.father_id];
        // 如果父亲是某人的配偶（被跳过），检查母亲是否是主节点
        if (fatherNode._isSpouseOf) {
          // 父亲是配偶，子女应该挂在母亲（配偶的主节点）下面
          const motherMainNode = memberMap[fatherNode._isSpouseOf];
          if (motherMainNode) {
            motherMainNode.children.push(node);
          }
        } else {
          // 父亲是主节点，子女挂在父亲下面
          fatherNode.children.push(node);
        }
      } else if (member.mother_id && memberMap[member.mother_id] && !member.father_id) {
        // 如果只有母亲，需要找到母亲作为配偶的父节点
        const motherNode = memberMap[member.mother_id];
        if (motherNode._isSpouseOf) {
          // 母亲是某人的配偶，子女挂在那个父亲节点下
          memberMap[motherNode._isSpouseOf].children.push(node);
        } else {
          // 母亲不是配偶，直接挂在母亲节点下
          motherNode.children.push(node);
        }
      } else {
        // 根节点（始祖）
        tree.push(node);
      }
    });

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('获取家族树错误:', error);
    res.status(500).json({
      success: false,
      message: '获取家族树失败'
    });
  }
}

// 获取指定代的成员
async function getGenerationMembers(req, res) {
  try {
    const { gen } = req.params;
    const members = await Member.findAll({ generation: parseInt(gen) });
    
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('获取代际成员错误:', error);
    res.status(500).json({
      success: false,
      message: '获取代际成员失败'
    });
  }
}

// 获取统计数据
async function getStatistics(req, res) {
  try {
    const stats = await Member.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
}

// 搜索成员
async function searchMembers(req, res) {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }
    
    const members = await Member.findAll({ search: q });
    
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('搜索成员错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
}

module.exports = {
  getFamilyTree,
  getGenerationMembers,
  getStatistics,
  searchMembers
};