/**
 * Main Application Entry
 * 主应用入口 - 协调各模块工作
 */

(function() {
    'use strict';

    // 应用状态
    const state = {
        renderedHTML: '',
        isPreviewLight: false
    };

    // DOM 元素
    let elements = {
        previewContent: null,
        exportPdfBtn: null,
        exportImageBtn: null,
        themeToggle: null,
        previewPanel: null,
        globalThemeToggle: null
    };

    /**
     * 初始化应用
     */
    function init() {
        console.log('App: 正在初始化...');

        // 获取 DOM 元素
        elements.previewContent = document.getElementById('previewContent');
        elements.exportPdfBtn = document.getElementById('exportPdfBtn');
        elements.exportImageBtn = document.getElementById('exportImageBtn');
        elements.themeToggle = document.getElementById('themeToggle');
        elements.previewPanel = document.querySelector('.preview-panel');
        elements.globalThemeToggle = document.getElementById('globalThemeToggle');

        // 初始化全局主题
        initGlobalTheme();

        // 配置 marked
        configureMarked();

        // 初始化编辑器
        Editor.init(handleContentChange);

        // 绑定导出按钮事件
        bindExportEvents();

        // 绑定主题切换
        bindThemeToggle();

        // 绑定全局主题切换
        bindGlobalThemeToggle();

        // 绑定快捷键
        bindShortcuts();

        // 移动端 Tab 切换
        initMobileTabs();

        console.log('App: 初始化完成');
    }

    /**
     * 配置 Marked.js
     */
    function configureMarked() {
        // 配置 marked
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false,
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (e) {
                        console.warn('Highlight error:', e);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        });

        // 配置数学公式渲染（支持 $...$ 和 $$...$$）
        const renderer = new marked.Renderer();
        
        // 处理行内数学公式 $...$
        const originalParagraph = renderer.paragraph;
        renderer.paragraph = function(text) {
            // 检查是否包含数学公式
            if (text.includes('$') && text.match(/\$[^$]+\$/)) {
                return `<p>${text}</p>`;
            }
            return originalParagraph.call(this, text);
        };

        // 处理块级数学公式 $$...$$
        const originalCodespan = renderer.codespan;
        renderer.codespan = function(code) {
            // 如果代码以 $$ 开头和结尾，则作为数学公式处理
            if (code.startsWith('$$') && code.endsWith('$$') && code.length > 4) {
                return `<span class="math-inline">${code}</span>`;
            }
            return originalCodespan.call(this, code);
        };

        marked.setOptions({ renderer });
    }

    /**
     * 处理内容变化
     * @param {string} markdown 
     */
    function handleContentChange(markdown) {
        if (!elements.previewContent) return;

        try {
            // 预处理数学公式：将 $$...$$ 转换为特殊标记，避免被 marked 解析
            let processedMarkdown = markdown || '';
            
            // 处理块级公式 $$...$$（需要先处理，避免与行内公式冲突）
            const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
            const blockMathPlaceholders = [];
            processedMarkdown = processedMarkdown.replace(blockMathRegex, (match, formula) => {
                const index = blockMathPlaceholders.length;
                // 使用 HTML 注释作为占位符，marked 不会改变它
                const placeholder = `<!-- MATH_BLOCK_${index} -->`;
                blockMathPlaceholders.push(formula.trim());
                return '\n\n' + placeholder + '\n\n';
            });

            // 解析 Markdown
            let html = marked.parse(processedMarkdown);
            
            // 恢复块级公式并渲染（使用 HTML 注释占位符）
            blockMathPlaceholders.forEach((formula, index) => {
                try {
                    const rendered = katex.renderToString(formula, {
                        displayMode: true,
                        throwOnError: false
                    });
                    // HTML 注释在 marked 解析后保持不变，直接替换
                    html = html.replace(`<!-- MATH_BLOCK_${index} -->`, rendered);
                } catch (e) {
                    console.warn('Math rendering error:', e);
                    html = html.replace(`<!-- MATH_BLOCK_${index} -->`, `<div class="math-error">$$${formula}$$</div>`);
                }
            });

            // 处理行内公式 $...$（在块级公式之后处理，避免冲突）
            const inlineMathRegex = /\$([^$\n]+?)\$/g;
            html = html.replace(inlineMathRegex, (match, formula) => {
                // 跳过已经被占位符替换的内容
                if (match.includes('math-placeholder')) {
                    return match;
                }
                try {
                    return katex.renderToString(formula.trim(), {
                        displayMode: false,
                        throwOnError: false
                    });
                } catch (e) {
                    console.warn('Inline math rendering error:', e);
                    return match;
                }
            });
            
            state.renderedHTML = html;
            
            // 更新预览
            elements.previewContent.innerHTML = html;

            // 对新添加的代码块应用高亮
            elements.previewContent.querySelectorAll('pre code').forEach((block) => {
                if (!block.classList.contains('hljs')) {
                    hljs.highlightElement(block);
                }
            });
        } catch (error) {
            console.error('Markdown 解析错误:', error);
            elements.previewContent.innerHTML = '<p style="color: #f56565;">Markdown 解析错误</p>';
        }
    }

    /**
     * 绑定导出按钮事件
     */
    function bindExportEvents() {
        // PDF 导出
        if (elements.exportPdfBtn) {
            elements.exportPdfBtn.addEventListener('click', function() {
                Converter.exportToPDF(state.renderedHTML);
            });
        }

        // 图片导出
        if (elements.exportImageBtn) {
            elements.exportImageBtn.addEventListener('click', function() {
                const quality = Converter.getImageQuality();
                Converter.exportToImage(state.renderedHTML, quality);
            });
        }
    }

    /**
     * 初始化全局主题
     */
    function initGlobalTheme() {
        // 从本地存储读取主题偏好
        const savedTheme = localStorage.getItem('markdown_converter_theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 默认使用夜间模式（当前样式）
        const theme = savedTheme || (prefersDark ? 'dark' : 'dark');
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新 highlight.js 主题
        updateHighlightTheme(theme);
    }

    /**
     * 更新 highlight.js 主题
     */
    function updateHighlightTheme(theme) {
        const darkTheme = document.querySelector('link[href*="github-dark"]');
        const lightTheme = document.getElementById('highlight-light-theme');
        
        if (theme === 'light') {
            if (darkTheme) darkTheme.disabled = true;
            if (lightTheme) {
                lightTheme.disabled = false;
                lightTheme.removeAttribute('media');
            }
        } else {
            if (darkTheme) darkTheme.disabled = false;
            if (lightTheme) {
                lightTheme.disabled = true;
                lightTheme.setAttribute('media', 'print');
            }
        }
    }

    /**
     * 绑定全局主题切换
     */
    function bindGlobalThemeToggle() {
        if (elements.globalThemeToggle) {
            elements.globalThemeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                // 切换主题
                document.documentElement.setAttribute('data-theme', newTheme);
                
                // 保存到本地存储
                localStorage.setItem('markdown_converter_theme', newTheme);
                
                // 更新 highlight.js 主题
                updateHighlightTheme(newTheme);
                
                // 重新应用代码高亮
                if (elements.previewContent) {
                    elements.previewContent.querySelectorAll('pre code').forEach((block) => {
                        if (block.classList.contains('hljs')) {
                            const code = block.textContent;
                            const lang = Array.from(block.classList)
                                .find(cls => cls.startsWith('language-') || (cls !== 'hljs' && !cls.startsWith('hljs-')))
                                ?.replace('language-', '');
                            
                            block.innerHTML = code;
                            if (lang && hljs.getLanguage(lang)) {
                                try {
                                    hljs.highlightElement(block);
                                } catch (e) {
                                    hljs.highlightAuto(block);
                                }
                            } else {
                                hljs.highlightAuto(block);
                            }
                        }
                    });
                }
            });
        }
    }

    /**
     * 绑定预览主题切换
     */
    function bindThemeToggle() {
        if (elements.themeToggle && elements.previewPanel) {
            elements.themeToggle.addEventListener('click', function() {
                state.isPreviewLight = !state.isPreviewLight;
                
                if (state.isPreviewLight) {
                    elements.previewPanel.classList.add('preview-light');
                    elements.previewPanel.querySelector('.preview-wrapper').style.background = '#ffffff';
                } else {
                    elements.previewPanel.classList.remove('preview-light');
                    const globalTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                    elements.previewPanel.querySelector('.preview-wrapper').style.background = '';
                }
            });
        }
    }

    /**
     * 绑定快捷键
     */
    function bindShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + P: 导出 PDF
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                Converter.exportToPDF(state.renderedHTML);
            }

            // Ctrl/Cmd + I: 导出图片
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                const quality = Converter.getImageQuality();
                Converter.exportToImage(state.renderedHTML, quality);
            }
        });
    }

    /**
     * 获取当前渲染的 HTML
     * @returns {string}
     */
    function getRenderedHTML() {
        return state.renderedHTML;
    }

    /**
     * 移动端 Tab 切换
     */
    function initMobileTabs() {
        const TAB_MOBILE_BREAKPOINT = 768;

        const tabBar = document.getElementById('mobileTabBar');
        if (!tabBar) return;

        const panels = {
            editor:  document.getElementById('panel-editor'),
            preview: document.getElementById('panel-preview'),
            export:  document.getElementById('panel-export')
        };

        const tabItems = tabBar.querySelectorAll('.tab-item');

        // 当前激活的 tab
        let activeTab = 'editor';

        function applyTabLayout() {
            if (window.innerWidth > TAB_MOBILE_BREAKPOINT) {
                // 桌面端：移除所有隐藏类，让 CSS grid 正常工作
                Object.values(panels).forEach(function(panel) {
                    if (panel) panel.classList.remove('tab-hidden');
                });
                return;
            }

            // 移动端：只显示激活面板
            Object.entries(panels).forEach(function(entry) {
                var name = entry[0];
                var panel = entry[1];
                if (!panel) return;
                if (name === activeTab) {
                    panel.classList.remove('tab-hidden');
                } else {
                    panel.classList.add('tab-hidden');
                }
            });
        }

        function switchTab(tabName) {
            if (!panels[tabName]) return;
            activeTab = tabName;

            // 更新 tab item 激活状态
            tabItems.forEach(function(item) {
                if (item.getAttribute('data-tab') === tabName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            applyTabLayout();
        }

        // 绑定点击事件
        tabItems.forEach(function(item) {
            item.addEventListener('click', function() {
                switchTab(item.getAttribute('data-tab'));
            });
        });

        // 初始应用
        applyTabLayout();

        // 响应窗口尺寸变化（旋转屏幕等）
        window.addEventListener('resize', applyTabLayout);
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 导出到全局（可选）
    window.App = {
        getRenderedHTML
    };
})();

