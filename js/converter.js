/**
 * Converter Module
 * 处理 PDF 和图片转换功能
 */

const Converter = (function() {
    // 配置
    const config = {
        pdfOptions: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        imageOptions: {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false
        }
    };

    /**
     * 显示加载遮罩
     * @param {string} text 
     */
    function showLoading(text = '正在转换中...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = overlay?.querySelector('.loading-text');
        
        if (overlay) {
            if (loadingText) loadingText.textContent = text;
            overlay.classList.remove('hidden');
        }
    }

    /**
     * 隐藏加载遮罩
     */
    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * 创建用于导出的临时容器
     * @param {string} html - HTML 内容
     * @returns {HTMLElement}
     */
    function createExportContainer(html) {
        // 移除已存在的容器
        const existing = document.querySelector('.export-container');
        if (existing) existing.remove();

        // 创建新容器
        const container = document.createElement('div');
        container.className = 'export-container';
        container.innerHTML = `<div class="markdown-body">${html}</div>`;
        document.body.appendChild(container);

        // 确保 KaTeX 字体加载完成
        const katexElements = container.querySelectorAll('.katex');
        katexElements.forEach(el => {
            // 强制重新计算样式，确保字体正确加载
            const style = window.getComputedStyle(el);
            // 触发重排以确保字体渲染
            void el.offsetHeight;
        });

        // 重新应用代码高亮（highlight.js）
        const codeBlocks = container.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            // 如果还没有高亮，则应用高亮
            if (!block.classList.contains('hljs')) {
                // 获取语言类型
                const classes = Array.from(block.classList);
                const lang = classes.find(cls => cls.startsWith('language-'))?.replace('language-', '') || 
                            classes.find(cls => cls !== 'hljs');
                
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        hljs.highlightElement(block);
                    } catch (e) {
                        // 如果指定语言失败，尝试自动检测
                        try {
                            hljs.highlightAuto(block);
                        } catch (e2) {
                            console.warn('Code highlighting error:', e2);
                        }
                    }
                } else {
                    // 自动检测语言
                    try {
                        hljs.highlightElement(block);
                    } catch (e) {
                        console.warn('Code highlighting error:', e);
                    }
                }
            }
        });

        return container;
    }

    /**
     * 移除导出容器
     */
    function removeExportContainer() {
        const container = document.querySelector('.export-container');
        if (container) container.remove();
    }

    /**
     * 生成文件名
     * @param {string} extension 
     * @returns {string}
     */
    function generateFilename(extension) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
        return `markdown-export-${dateStr}-${timeStr}.${extension}`;
    }

    /**
     * 导出为 PDF
     * @param {string} html - 渲染后的 HTML 内容
     */
    async function exportToPDF(html) {
        if (!html || !html.trim()) {
            Editor.showToast('请先输入 Markdown 内容', 'error');
            return;
        }

        showLoading('正在生成 PDF...');

        try {
            // 创建临时容器
            const container = createExportContainer(html);
            
            // 等待样式和公式完全渲染
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 等待所有图片和公式加载完成
            const images = container.querySelectorAll('img');
            const mathElements = container.querySelectorAll('.katex');
            
            await Promise.all([
                ...Array.from(images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = resolve; // 即使失败也继续
                        setTimeout(resolve, 2000); // 超时保护
                    });
                }),
                // 等待 KaTeX 公式渲染完成
                new Promise(resolve => {
                    // 检查所有公式是否已渲染
                    const checkMath = () => {
                        const allRendered = Array.from(mathElements).every(el => {
                            return el.querySelector('.katex-html') !== null;
                        });
                        if (allRendered || mathElements.length === 0) {
                            resolve();
                        } else {
                            setTimeout(checkMath, 100);
                        }
                    };
                    checkMath();
                })
            ]);

            // 使用 html2canvas 将内容转换为 canvas
            const canvas = await html2canvas(container, {
                ...config.imageOptions,
                scale: 2,
                windowWidth: 800,
                logging: false,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                removeContainer: false,
                onclone: (clonedDoc) => {
                    // 确保克隆文档中的公式样式正确
                    const clonedContainer = clonedDoc.querySelector('.export-container');
                    if (clonedContainer) {
                        // 强制重新计算样式
                        clonedContainer.style.visibility = 'visible';
                        clonedContainer.style.position = 'relative';
                        clonedContainer.style.left = '0';
                    }
                }
            });

            // 创建 PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF(config.pdfOptions);

            // 计算尺寸
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10; // 10mm 边距
            const contentWidth = pageWidth - (margin * 2);

            // 计算图片在 PDF 中的高度
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = contentWidth / imgWidth;
            const scaledHeight = imgHeight * ratio;

            // 分页处理
            const pageContentHeight = pageHeight - (margin * 2);
            let position = 0;
            let remainingHeight = scaledHeight;
            let pageNum = 0;

            while (remainingHeight > 0) {
                if (pageNum > 0) {
                    pdf.addPage();
                }

                // 计算当前页需要截取的 canvas 部分
                const sourceY = (position / ratio);
                const sourceHeight = Math.min(pageContentHeight / ratio, imgHeight - sourceY);
                
                // 创建临时 canvas 用于截取
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgWidth;
                tempCanvas.height = sourceHeight;
                
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(
                    canvas,
                    0, sourceY, imgWidth, sourceHeight,
                    0, 0, imgWidth, sourceHeight
                );

                const imgData = tempCanvas.toDataURL('image/jpeg', 0.95);
                const drawHeight = Math.min(pageContentHeight, remainingHeight);
                
                pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, drawHeight);

                position += pageContentHeight;
                remainingHeight -= pageContentHeight;
                pageNum++;
            }

            // 下载 PDF
            pdf.save(generateFilename('pdf'));

            // 清理
            removeExportContainer();
            hideLoading();
            Editor.showToast('PDF 导出成功！', 'success');

        } catch (error) {
            console.error('PDF 导出失败:', error);
            removeExportContainer();
            hideLoading();
            Editor.showToast('PDF 导出失败，请重试', 'error');
        }
    }

    /**
     * 导出为图片
     * @param {string} html - 渲染后的 HTML 内容
     * @param {number} scale - 图片质量倍数
     */
    async function exportToImage(html, scale = 2) {
        if (!html || !html.trim()) {
            Editor.showToast('请先输入 Markdown 内容', 'error');
            return;
        }

        showLoading('正在生成图片...');

        try {
            // 创建临时容器
            const container = createExportContainer(html);
            
            // 等待样式和公式完全渲染
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 等待所有图片和公式加载完成
            const images = container.querySelectorAll('img');
            const mathElements = container.querySelectorAll('.katex');
            
            await Promise.all([
                ...Array.from(images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = resolve; // 即使失败也继续
                        setTimeout(resolve, 2000); // 超时保护
                    });
                }),
                // 等待 KaTeX 公式渲染完成
                new Promise(resolve => {
                    // 检查所有公式是否已渲染
                    const checkMath = () => {
                        const allRendered = Array.from(mathElements).every(el => {
                            return el.querySelector('.katex-html') !== null;
                        });
                        if (allRendered || mathElements.length === 0) {
                            resolve();
                        } else {
                            setTimeout(checkMath, 100);
                        }
                    };
                    checkMath();
                })
            ]);

            // 使用 html2canvas 转换
            const canvas = await html2canvas(container, {
                ...config.imageOptions,
                scale: scale,
                logging: false,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                removeContainer: false,
                onclone: (clonedDoc) => {
                    // 确保克隆文档中的公式样式正确
                    const clonedContainer = clonedDoc.querySelector('.export-container');
                    if (clonedContainer) {
                        // 强制重新计算样式
                        clonedContainer.style.visibility = 'visible';
                        clonedContainer.style.position = 'relative';
                        clonedContainer.style.left = '0';
                    }
                }
            });

            // 转换为 blob 并下载
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = generateFilename('png');
                link.href = url;
                link.click();
                
                // 清理
                URL.revokeObjectURL(url);
                removeExportContainer();
                hideLoading();
                Editor.showToast('图片导出成功！', 'success');
            }, 'image/png');

        } catch (error) {
            console.error('图片导出失败:', error);
            removeExportContainer();
            hideLoading();
            Editor.showToast('图片导出失败，请重试', 'error');
        }
    }

    /**
     * 获取当前选择的图片质量
     * @returns {number}
     */
    function getImageQuality() {
        const select = document.getElementById('imageQuality');
        return select ? parseInt(select.value, 10) : 2;
    }

    // 公开接口
    return {
        exportToPDF,
        exportToImage,
        getImageQuality,
        showLoading,
        hideLoading
    };
})();

// 导出到全局
window.Converter = Converter;

