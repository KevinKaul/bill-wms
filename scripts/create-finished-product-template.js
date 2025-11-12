/**
 * 创建组合产品导入模板
 * 运行: node scripts/create-finished-product-template.js
 */

const ExcelJS = require('exceljs');
const path = require('path');

async function createTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // 创建示例Sheet 1 - 花环产品
  const sheet1 = workbook.addWorksheet('花环-FP001');
  
  // 设置列宽
  sheet1.columns = [
    { width: 15 }, // 封面图片
    { width: 15 }, // SKU
    { width: 25 }, // 产品名称
    { width: 40 }, // 产品描述
  ];
  
  // 产品信息区域
  sheet1.addRow(['封面图片', 'SKU', '产品名称', '产品描述']);
  sheet1.addRow(['', 'FP001', '精美花环', '由多种原材料组成的精美花环产品']);
  
  // 样式设置 - 产品信息表头
  sheet1.getRow(1).font = { bold: true, size: 11 };
  sheet1.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet1.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // 添加空行
  sheet1.addRow([]);
  
  // BOM结构区域
  sheet1.addRow(['原材料SKU', '需要数量']);
  sheet1.addRow(['RM001', '10']);
  sheet1.addRow(['RM002', '5']);
  sheet1.addRow(['RM003', '8']);
  
  // 样式设置 - BOM表头
  sheet1.getRow(4).font = { bold: true, size: 11 };
  sheet1.getRow(4).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD700' }
  };
  sheet1.getRow(4).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // 创建示例Sheet 2 - 装饰品产品
  const sheet2 = workbook.addWorksheet('装饰品-FP002');
  
  sheet2.columns = [
    { width: 15 },
    { width: 15 },
    { width: 25 },
    { width: 40 },
  ];
  
  sheet2.addRow(['封面图片', 'SKU', '产品名称', '产品描述']);
  sheet2.addRow(['', 'FP002', '节日装饰品', '适合各种节日场合的装饰品']);
  
  sheet2.getRow(1).font = { bold: true, size: 11 };
  sheet2.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet2.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  sheet2.addRow([]);
  
  sheet2.addRow(['原材料SKU', '需要数量']);
  sheet2.addRow(['RM001', '15']);
  sheet2.addRow(['RM004', '3']);
  
  sheet2.getRow(4).font = { bold: true, size: 11 };
  sheet2.getRow(4).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD700' }
  };
  sheet2.getRow(4).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // 创建说明Sheet
  const instructionSheet = workbook.addWorksheet('导入说明');
  
  instructionSheet.columns = [
    { width: 80 },
  ];
  
  instructionSheet.addRow(['组合产品导入模板使用说明']);
  instructionSheet.addRow([]);
  instructionSheet.addRow(['1. 模板结构']);
  instructionSheet.addRow(['   - 每个Sheet对应一个组合产品']);
  instructionSheet.addRow(['   - Sheet名称可以自定义，建议使用"产品名称-SKU"格式']);
  instructionSheet.addRow([]);
  instructionSheet.addRow(['2. 产品信息区域（第1-2行）']);
  instructionSheet.addRow(['   - 第1行：表头（封面图片、SKU、产品名称、产品描述）']);
  instructionSheet.addRow(['   - 第2行：产品数据']);
  instructionSheet.addRow(['   - 封面图片：可以在第一列插入图片（可选）']);
  instructionSheet.addRow(['   - SKU：产品唯一标识符（必填）']);
  instructionSheet.addRow(['   - 产品名称：产品的名称（必填）']);
  instructionSheet.addRow(['   - 产品描述：产品的详细描述（可选）']);
  instructionSheet.addRow([]);
  instructionSheet.addRow(['3. BOM结构区域（第4行开始）']);
  instructionSheet.addRow(['   - 第4行：BOM表头（原材料SKU、需要数量）']);
  instructionSheet.addRow(['   - 第5行开始：BOM数据']);
  instructionSheet.addRow(['   - 原材料SKU：必须是系统中已存在的原材料产品的SKU']);
  instructionSheet.addRow(['   - 需要数量：生产1个成品所需的该原材料数量（必须为正数）']);
  instructionSheet.addRow(['   - 至少需要添加一个原材料']);
  instructionSheet.addRow([]);
  instructionSheet.addRow(['4. 注意事项']);
  instructionSheet.addRow(['   - SKU不能重复，如果系统中已存在相同SKU，该产品将被跳过']);
  instructionSheet.addRow(['   - 原材料SKU必须在系统中存在且类型为"原材料"']);
  instructionSheet.addRow(['   - 系统会根据BOM中原材料的参考采购价自动计算组合产品的指导单价']);
  instructionSheet.addRow(['   - 可以添加多个Sheet来批量导入多个组合产品']);
  instructionSheet.addRow([]);
  instructionSheet.addRow(['5. 示例']);
  instructionSheet.addRow(['   请参考"花环-FP001"和"装饰品-FP002"两个示例Sheet']);
  
  // 样式设置 - 说明标题
  instructionSheet.getRow(1).font = { bold: true, size: 14 };
  instructionSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  instructionSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  // 保存文件
  const outputPath = path.join(__dirname, '..', 'public', 'templates', '组合产品导入模板.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log('组合产品导入模板创建成功！');
  console.log('文件路径:', outputPath);
}

createTemplate().catch(console.error);
