<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 全局移动端适配 */
@media screen and (max-width: 768px) {
  /* Element Plus 表格在手机端允许横向滚动 */
  .el-table {
    font-size: 13px;
  }

  /* Element Plus 描述列表手机端单列 */
  .el-descriptions {
    --el-descriptions-table-border: none;
  }
  .el-descriptions .el-descriptions__body .el-descriptions__table {
    table-layout: fixed;
    width: 100%;
  }

  /* Element Plus 弹窗手机端全屏 */
  .el-dialog {
    width: 92% !important;
    margin-top: 5vh !important;
  }

  /* Element Plus Drawer 手机端全屏 */
  .el-drawer {
    width: 100% !important;
  }

  /* Element Plus 卡片手机端减少间距 */
  .el-card__body {
    padding: 15px;
  }

  /* 表单 label-width 手机端缩短 */
  .el-form--label-left .el-form-item__label,
  .el-form--label-top .el-form-item__label {
    padding-bottom: 4px;
  }
}
</style>