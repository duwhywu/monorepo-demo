/**
 * App A - 入口文件
 * 演示如何使用 shared 公共库
 */

// 引入 shared 公共库
const { formatDate, formatTime, generateId, deepClone } = require('shared')

// 获取 DOM 元素
const dateInfo = document.getElementById('date-info')
const idInfo = document.getElementById('id-info')
const cloneBtn = document.getElementById('clone-btn')
const cloneResult = document.getElementById('clone-result')
const currentTime = document.getElementById('current-time')

// 初始化显示
function init() {
  // 使用 formatDate 显示日期
  dateInfo.textContent = `当前日期: ${formatDate(new Date())}`
  
  // 使用 generateId 生成 ID
  idInfo.textContent = `生成的 ID: ${generateId()}`
  
  // 更新时间
  updateTime()
  setInterval(updateTime, 1000)
}

// 更新时间显示
function updateTime() {
  currentTime.textContent = formatTime(new Date())
}

// 测试深拷贝
cloneBtn.addEventListener('click', () => {
  const original = {
    name: '测试对象',
    data: [1, 2, 3],
    nested: { key: 'value' },
  }
  
  const cloned = deepClone(original)
  cloned.name = '修改后的对象'
  cloned.data.push(4)
  
  cloneResult.textContent = `原始: ${original.name}, 拷贝: ${cloned.name}`
  console.log('原始对象:', original)
  console.log('拷贝对象:', cloned)
})

// 启动应用
init()

console.log('App A 已启动')
console.log('使用了 shared 库的 formatDate, formatTime, generateId, deepClone 函数')
