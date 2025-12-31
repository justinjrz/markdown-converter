# Markdown 转换器

一个功能强大的 Markdown 转换工具，支持将 Markdown 文档实时预览并导出为 PDF 和长图片。

![Markdown Converter](https://img.shields.io/badge/Markdown-Converter-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 功能特性

### 核心功能

- 📝 **实时预览** - 编辑 Markdown 时实时查看渲染效果
- 📄 **PDF 导出** - 生成可打印的 PDF 文档，支持自动分页
- 🖼️ **图片导出** - 生成高清长图片，支持 1x/2x/3x 质量选择
- 🎨 **主题切换** - 支持深色/浅色预览主题
- 💾 **自动保存** - 内容自动保存到浏览器本地存储

### Markdown 支持

- ✅ **文本格式** - 粗体、斜体、删除线、行内代码
- ✅ **标题层级** - 支持 6 级标题
- ✅ **列表** - 有序列表和无序列表
- ✅ **引用** - 块引用支持
- ✅ **代码块** - 语法高亮，支持多种编程语言
- ✅ **数学公式** - 支持 LaTeX 语法（行内和块级公式）
- ✅ **表格** - 完整的表格支持
- ✅ **链接和图片** - 标准 Markdown 链接和图片语法
- ✅ **分隔线** - 水平分隔线

### 用户体验

- 🎯 **文件上传** - 支持点击上传或拖拽文件
- ⌨️ **快捷键** - 丰富的键盘快捷键支持
- 📱 **响应式设计** - 适配桌面和移动设备
- 🎨 **现代 UI** - 简洁美观的界面设计

## 🚀 快速开始

### 在线使用

1. 打开 `index.html` 文件（或部署到 Web 服务器）
2. 在编辑器中输入或粘贴 Markdown 内容
3. 实时查看预览效果
4. 点击导出按钮生成 PDF 或图片

### 本地部署

```bash
# 克隆或下载项目
git clone <repository-url>
cd markdown转换器

# 使用 Python 启动本地服务器
python3 -m http.server 8080

# 或使用 Node.js
npx http-server -p 8080

# 在浏览器中访问
# http://localhost:8080
```

## 📖 使用指南

### 基本操作

1. **编辑内容**
   - 在左侧编辑器输入 Markdown 文本
   - 右侧预览区实时显示渲染结果

2. **上传文件**
   - 点击"上传文件"按钮选择 `.md` 文件
   - 或直接拖拽文件到编辑器区域

3. **导出文档**
   - **PDF 导出**：点击"导出 PDF"按钮，自动下载 PDF 文件
   - **图片导出**：选择图片质量后点击"导出图片"按钮

4. **主题切换**
   - 点击预览区的主题切换按钮
   - 在深色和浅色主题间切换

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + S` | 保存内容到本地存储 |
| `Ctrl + P` | 导出 PDF |
| `Ctrl + I` | 导出图片 |

### Markdown 语法示例

#### 文本格式

```markdown
**粗体文本** *斜体文本* ~~删除线~~ `行内代码`
```

#### 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
```

#### 列表

```markdown
- 无序列表项
- 另一个项目

1. 有序列表项
2. 另一个项目
```

#### 代码块

````markdown
```javascript
function hello() {
    console.log('Hello, World!');
}
```
````

#### 数学公式

```markdown
行内公式：$E = mc^2$

块级公式：
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

#### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
```

#### 引用

```markdown
> 这是一段引用文字
```

## 🛠️ 技术栈

### 核心库

- **[marked.js](https://marked.js.org/)** - Markdown 解析和渲染
- **[highlight.js](https://highlightjs.org/)** - 代码语法高亮
- **[KaTeX](https://katex.org/)** - 数学公式渲染
- **[html2canvas](https://html2canvas.hertzen.com/)** - HTML 转 Canvas
- **[jsPDF](https://github.com/parallax/jsPDF)** - PDF 生成

### 技术特点

- 纯前端实现，无需后端服务器
- 使用原生 JavaScript，无框架依赖
- 响应式设计，支持移动端
- 现代 CSS 变量和 Flexbox/Grid 布局

## 📁 项目结构

```
markdown转换器/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── main.js         # 主逻辑（Markdown 解析、预览）
│   ├── editor.js       # 编辑器模块（文件上传、本地存储）
│   └── converter.js    # 转换模块（PDF/图片导出）
└── README.md           # 项目文档
```

## 🔧 开发说明

### 文件说明

- **index.html** - 主页面结构，包含编辑器、预览区和操作面板
- **css/style.css** - 完整的样式定义，包括深色/浅色主题
- **js/main.js** - 应用主逻辑，处理 Markdown 解析和预览
- **js/editor.js** - 编辑器功能，处理文件上传和本地存储
- **js/converter.js** - 转换功能，处理 PDF 和图片导出

### 自定义配置

#### 修改主题色

在 `css/style.css` 中修改 CSS 变量：

```css
:root {
    --accent-color: #ff6b6b;        /* 网站主题色 */
    --md-accent: #3b82f6;            /* Markdown 渲染强调色 */
    --bg-primary: #0a0f14;           /* 背景色 */
    /* ... */
}
```

#### 修改 PDF 格式

在 `js/converter.js` 中修改 PDF 配置：

```javascript
const config = {
    pdfOptions: {
        unit: 'mm',
        format: 'a4',        // 可改为 'letter', 'a3' 等
        orientation: 'portrait'  // 或 'landscape'
    }
};
```

## 🌐 浏览器兼容性

- ✅ Chrome (推荐)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ IE 11 及以下不支持

## 📝 更新日志

### v1.0.0

- ✨ 初始版本发布
- ✅ 支持 Markdown 实时预览
- ✅ 支持 PDF 和图片导出
- ✅ 支持数学公式渲染
- ✅ 支持代码语法高亮
- ✅ 支持文件上传和拖拽
- ✅ 支持本地存储
- ✅ 支持主题切换

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

感谢以下开源项目的支持：

- [marked.js](https://marked.js.org/) - Markdown 解析
- [highlight.js](https://highlightjs.org/) - 代码高亮
- [KaTeX](https://katex.org/) - 数学公式
- [html2canvas](https://html2canvas.hertzen.com/) - HTML 转图片
- [jsPDF](https://github.com/parallax/jsPDF) - PDF 生成

## 📧 联系方式

如有问题或建议，欢迎通过 Issue 反馈。

---

**享受 Markdown 的乐趣！** 🎉

