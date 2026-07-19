/**
 * App B - 入口文件
 * 演示如何使用 shared 的防抖和节流函数
 */

// 引入 shared 公共库
const { formatDate, formatTime, debounce, throttle } = require('shared')

// 获取 DOM 元素
const debounceInput = document.getElementById('debounce-input')
const debounceOutput = document.getElementById('debounce-output')
const throttleBtn = document.getElementById('throttle-btn')
const throttleCount = document.getElementById('throttle-count')
const currentTime = document.getElementById('current-time')

// 节流计数器
let count = 0

// 初始化显示
function init() {
  updateTime()
  setInterval(updateTime, 1000)
}

// 更新时间显示
function updateTime() {
  currentTime.textContent = formatTime(new Date())
}

// 防抖处理函数（输入停止 500ms 后执行）
const handleDebounce = debounce((value) => {
  debounceOutput.textContent = value || '已清空'
  console.log('防抖触发:', value)
}, 500)

// 节流处理函数（每 1000ms 最多执行一次）
const handleThrottle = throttle(() => {
  count++
  throttleCount.textContent = count
  console.log('节流触发，当前次数:', count)
}, 1000)

// 绑定事件
debounceInput.addEventListener('input', (e) => {
  debounceOutput.textContent = '输入中...'
  handleDebounce(e.target.value)
})

throttleBtn.addEventListener('click', () => {
  handleThrottle()
})

// 启动应用
init()

console.log('App B 已启动')
console.log('使用了 shared 库的 debounce, throttle, formatTime 函数')
console.log('App A 地址: http://localhost:3001')
