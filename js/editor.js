/**
 * Editor Module
 * 处理 Markdown 编辑器相关功能
 * - 文件上传和拖拽
 * - 文件读取
 * - 本地存储
 */

const Editor = (function() {
    // DOM 元素
    let elements = {
        input: null,
        fileInput: null,
        clearBtn: null,
        dropZone: null,
        dropHint: null,
        lineNumbers: null
    };

    // 配置
    const config = {
        storageKey: 'markdown_content',
        supportedTypes: ['.md', '.markdown', '.txt'],
        maxFileSize: 5 * 1024 * 1024 // 5MB
    };

    // 回调函数
    let onContentChange = null;

    /**
     * 初始化编辑器
     * @param {Function} changeCallback - 内容变化时的回调函数
     */
    function init(changeCallback) {
        onContentChange = changeCallback;
        
        // 获取 DOM 元素
        elements.input = document.getElementById('markdownInput');
        elements.fileInput = document.getElementById('fileInput');
        elements.clearBtn = document.getElementById('clearBtn');
        elements.dropZone = document.getElementById('dropZone');
        elements.dropHint = document.getElementById('dropHint');
        elements.lineNumbers = document.getElementById('lineNumbers');

        if (!elements.input) {
            console.error('Editor: 找不到编辑器元素');
            return;
        }

        // 绑定事件
        bindEvents();

        // 恢复保存的内容
        restoreContent();

        // 触发初始渲染
        triggerChange();

        // 初始化行号
        if (elements.lineNumbers) {
            updateLineNumbers();
        }

        console.log('Editor: 初始化完成');
    }

    /**
     * 绑定事件监听器
     */
    function bindEvents() {
        // 输入事件 - 使用防抖
        elements.input.addEventListener('input', debounce(handleInput, 150));

        // 行号同步
        if (elements.lineNumbers) {
            elements.input.addEventListener('input', updateLineNumbers);
            elements.input.addEventListener('scroll', syncLineNumbersScroll);
            updateLineNumbers();
        }

        // 文件上传
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', handleFileSelect);
        }

        // 清空按钮
        if (elements.clearBtn) {
            elements.clearBtn.addEventListener('click', handleClear);
        }

        // 拖拽事件
        if (elements.dropZone) {
            elements.dropZone.addEventListener('dragenter', handleDragEnter);
            elements.dropZone.addEventListener('dragover', handleDragOver);
            elements.dropZone.addEventListener('dragleave', handleDragLeave);
            elements.dropZone.addEventListener('drop', handleDrop);
        }

        // 键盘快捷键
        document.addEventListener('keydown', handleKeyboard);

        // 页面关闭前保存
        window.addEventListener('beforeunload', saveContent);
    }

    /**
     * 处理输入事件
     */
    function handleInput() {
        saveContent();
        triggerChange();
    }


    /**
     * 处理文件选择
     * @param {Event} event 
     */
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            readFile(file);
        }
        // 重置 input 以允许重复选择同一文件
        event.target.value = '';
    }

    /**
     * 处理清空按钮
     */
    function handleClear() {
        if (elements.input.value.trim() && !confirm('确定要清空所有内容吗？')) {
            return;
        }
        elements.input.value = '';
        saveContent();
        triggerChange();
        updateLineNumbers();
        showToast('内容已清空', 'info');
    }

    /**
     * 拖拽进入
     * @param {DragEvent} event 
     */
    function handleDragEnter(event) {
        event.preventDefault();
        event.stopPropagation();
        showDropHint();
    }

    /**
     * 拖拽悬停
     * @param {DragEvent} event 
     */
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * 拖拽离开
     * @param {DragEvent} event 
     */
    function handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // 检查是否真的离开了 dropZone
        const rect = elements.dropZone.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            hideDropHint();
        }
    }

    /**
     * 处理文件放置
     * @param {DragEvent} event 
     */
    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        hideDropHint();

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            readFile(files[0]);
        }
    }

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} event 
     */
    function handleKeyboard(event) {
        // Ctrl/Cmd + S: 保存
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            saveContent();
            showToast('内容已保存', 'success');
        }
    }

    /**
     * 读取文件内容
     * @param {File} file 
     */
    function readFile(file) {
        // 验证文件类型
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!config.supportedTypes.includes(ext)) {
            showToast(`不支持的文件类型: ${ext}`, 'error');
            return;
        }

        // 验证文件大小
        if (file.size > config.maxFileSize) {
            showToast('文件过大，最大支持 5MB', 'error');
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            elements.input.value = e.target.result;
            saveContent();
            triggerChange();
            showToast(`已加载文件: ${file.name}`, 'success');
        };

        reader.onerror = function() {
            showToast('文件读取失败', 'error');
        };

        reader.readAsText(file);
    }

    /**
     * 显示拖拽提示
     */
    function showDropHint() {
        if (elements.dropHint) {
            elements.dropHint.classList.remove('hidden');
        }
    }

    /**
     * 隐藏拖拽提示
     */
    function hideDropHint() {
        if (elements.dropHint) {
            elements.dropHint.classList.add('hidden');
        }
    }

    /**
     * 保存内容到本地存储
     */
    function saveContent() {
        try {
            localStorage.setItem(config.storageKey, elements.input.value);
        } catch (e) {
            console.warn('Editor: 本地存储保存失败', e);
        }
    }

    /**
     * 从本地存储恢复内容
     */
    function restoreContent() {
        try {
            const saved = localStorage.getItem(config.storageKey);
            // 如果本地存储有内容，则恢复；否则使用 textarea 中的默认内容
            if (saved && saved.trim()) {
                elements.input.value = saved;
            }
            // 如果没有保存的内容，使用 textarea 中的默认内容（首次访问）
        } catch (e) {
            console.warn('Editor: 本地存储读取失败', e);
        }
    }

    /**
     * 触发内容变化回调
     */
    function triggerChange() {
        if (typeof onContentChange === 'function') {
            onContentChange(elements.input.value);
        }
    }

    /**
     * 获取当前内容
     * @returns {string}
     */
    function getContent() {
        return elements.input ? elements.input.value : '';
    }

    /**
     * 设置内容
     * @param {string} content 
     */
    function setContent(content) {
        if (elements.input) {
            elements.input.value = content;
            saveContent();
            triggerChange();
            updateLineNumbers();
        }
    }

    /**
     * 更新行号列内容
     */
    function updateLineNumbers() {
        if (!elements.lineNumbers || !elements.input) return;
        const lineCount = elements.input.value.split('\n').length;
        const current = elements.lineNumbers.children.length;
        if (lineCount === current) return;

        if (lineCount > current) {
            const fragment = document.createDocumentFragment();
            for (let i = current + 1; i <= lineCount; i++) {
                const span = document.createElement('span');
                span.textContent = i;
                fragment.appendChild(span);
            }
            elements.lineNumbers.appendChild(fragment);
        } else {
            while (elements.lineNumbers.children.length > lineCount) {
                elements.lineNumbers.removeChild(elements.lineNumbers.lastChild);
            }
        }

        syncLineNumbersScroll();
    }

    /**
     * 同步行号列的滚动偏移
     */
    function syncLineNumbersScroll() {
        if (!elements.lineNumbers || !elements.input) return;
        elements.lineNumbers.scrollTop = elements.input.scrollTop;
    }

    /**
     * 防抖函数
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 显示 Toast 提示
     * @param {string} message 
     * @param {string} type - success | error | info
     */
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        // 移除 hidden 并显示
        toast.classList.remove('hidden');
        
        // 强制重绘
        void toast.offsetWidth;
        
        toast.classList.add('show');

        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }

    // 公开接口
    return {
        init,
        getContent,
        setContent,
        showToast
    };
})();

// 导出到全局
window.Editor = Editor;

