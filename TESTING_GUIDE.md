# Provider 模式测试指南

## 🚀 快速开始

### 1. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动（如果 3000 被占用，会自动使用 3001）。

---

## ✅ 功能测试清单

### 测试 1: 基本配置和 Provider 初始化

**步骤：**
1. 打开应用 `http://localhost:3001`
2. 点击右上角的 ⚙️ 设置按钮
3. 在"火山引擎视频生成配置"部分输入你的 API Key
4. 点击"保存配置"按钮

**预期结果：**
- ✅ 配置保存成功提示出现
- ✅ "Provider 管理"部分显示新添加的 Provider
- ✅ 该 Provider 被标记为"默认"

**验证代码：**
```typescript
// 在浏览器控制台运行
localStorage.getItem('provider_configs')
// 应该返回包含你的配置的 JSON 数组
```

---

### 测试 2: 多 Provider 管理

**步骤：**
1. 在设置中配置第一个 Volcengine API Key
2. 保存配置
3. 修改 API Key 为不同的值
4. 再次保存配置

**预期结果：**
- ✅ "Provider 管理"部分显示两个 Provider
- ✅ 第二个 Provider 有"设为默认"按钮
- ✅ 第一个 Provider 显示"默认"标签

**验证代码：**
```typescript
// 在浏览器控制台运行
const configs = JSON.parse(localStorage.getItem('provider_configs') || '[]');
console.log(`已配置 ${configs.length} 个 Provider`);
configs.forEach(c => console.log(`- ${c.name} (${c.type}): ${c.isDefault ? '默认' : '备用'}`));
```

---

### 测试 3: 切换默认 Provider

**步骤：**
1. 在设置中有多个 Provider 的情况下
2. 点击非默认 Provider 的"设为默认"按钮
3. 观察 UI 变化

**预期结果：**
- ✅ 该 Provider 现在显示"默认"标签
- ✅ 之前的默认 Provider 显示"设为默认"按钮
- ✅ 成功提示出现

---

### 测试 4: 删除 Provider

**步骤：**
1. 在设置中有多个 Provider 的情况下
2. 点击某个 Provider 的"删除"按钮
3. 在确认对话框中点击"确定"

**预期结果：**
- ✅ 该 Provider 从列表中移除
- ✅ 成功提示出现
- ✅ localStorage 中的配置也被删除

**验证代码：**
```typescript
// 在浏览器控制台运行
const configs = JSON.parse(localStorage.getItem('provider_configs') || '[]');
console.log(`剩余 ${configs.length} 个 Provider`);
```

---

### 测试 5: 视频生成流程

**步骤：**
1. 确保已配置有效的 Volcengine API Key
2. 关闭设置面板
3. 在聊天框中输入视频生成提示词，例如：
   ```
   生成一个日落视频
   ```
4. 点击发送按钮

**预期结果：**
- ✅ 消息发送成功
- ✅ AI 消息显示"视频生成中..."
- ✅ 显示任务 ID
- ✅ 状态更新为"正在处理视频，请稍候..."
- ✅ 最终显示成功或失败信息

**浏览器控制台日志：**
```
🔌 使用 Provider: volcengine
🎨 图生视频模式: false
🎨 首尾帧模式: false
```

---

### 测试 6: 图生视频功能

**步骤：**
1. 在聊天框中输入包含图片的提示词
2. 上传首帧图片
3. 点击发送

**预期结果：**
- ✅ 消息发送成功
- ✅ 浏览器控制台显示 `🎨 图生视频模式: true`
- ✅ 视频生成流程正常进行

---

### 测试 7: 错误处理

**步骤：**
1. 输入无效的 API Key
2. 尝试生成视频

**预期结果：**
- ✅ 显示错误信息
- ✅ 错误信息包含有用的调试信息
- ✅ 应用不会崩溃

**预期错误信息：**
```
❌ 视频生成失败

错误信息: [具体错误]

请检查：
1. API Key 是否正确配置
2. 网络连接是否正常
3. 账户余额是否充足
```

---

## 🔍 浏览器控制台调试

### 查看 Provider 管理器状态

```typescript
// 在浏览器控制台运行
import { providerManager } from '@/app/services/provider-manager';

// 列出所有 Provider
console.log('所有 Provider:', providerManager.listProviders());

// 获取默认 Provider
console.log('默认 Provider:', providerManager.getDefaultProvider());

// 获取 Provider 信息
const providers = providerManager.listProviders();
if (providers.length > 0) {
  console.log('第一个 Provider 信息:', providerManager.getProviderInfo(providers[0].id));
}
```

### 查看 localStorage 数据

```typescript
// 查看所有配置
console.log('Provider 配置:', JSON.parse(localStorage.getItem('provider_configs') || '[]'));

// 查看旧的 Volcengine 配置（向后兼容）
console.log('Volcengine 配置:', JSON.parse(localStorage.getItem('ark_config') || '{}'));
```

---

## 🧪 单元测试

### 运行测试

```bash
npm test -- provider-factory.test.ts
```

### 测试覆盖

- ✅ Provider 工厂创建
- ✅ 错误处理
- ✅ 配置验证

---

## 📊 性能检查

### 检查加载时间

```typescript
// 在浏览器控制台运行
console.time('Provider 初始化');
import { providerManager } from '@/app/services/provider-manager';
console.timeEnd('Provider 初始化');
```

### 检查内存使用

```typescript
// 在浏览器控制台运行
if (performance.memory) {
  console.log('内存使用:', {
    usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
  });
}
```

---

## 🐛 常见问题排查

### 问题 1: "没有设置默认 Provider"

**原因：** 没有配置任何 Provider

**解决方案：**
1. 打开设置
2. 输入有效的 API Key
3. 点击保存

### 问题 2: 视频生成失败

**原因：** 可能是 API Key 无效或网络问题

**解决方案：**
1. 检查 API Key 是否正确
2. 检查网络连接
3. 检查账户余额
4. 查看浏览器控制台的错误信息

### 问题 3: Provider 列表为空

**原因：** localStorage 被清空或浏览器隐私模式

**解决方案：**
1. 重新配置 Provider
2. 检查浏览器是否在隐私模式
3. 检查 localStorage 是否被禁用

---

## ✨ 验证清单

在部署前，请确保以下所有项都已验证：

- [ ] 开发服务器启动无错误
- [ ] 设置页面可以正常打开
- [ ] 可以保存 Provider 配置
- [ ] Provider 列表显示正确
- [ ] 可以切换默认 Provider
- [ ] 可以删除 Provider
- [ ] 视频生成流程正常
- [ ] 错误处理正确
- [ ] 浏览器控制台无错误
- [ ] localStorage 数据正确保存

---

## 📝 测试报告模板

```markdown
# Provider 模式测试报告

**测试日期：** YYYY-MM-DD
**测试人员：** [你的名字]
**环境：** Windows/Mac/Linux, Chrome/Firefox/Safari

## 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 基本配置 | ✅/❌ | |
| 多 Provider 管理 | ✅/❌ | |
| 切换默认 Provider | ✅/❌ | |
| 删除 Provider | ✅/❌ | |
| 视频生成流程 | ✅/❌ | |
| 图生视频功能 | ✅/❌ | |
| 错误处理 | ✅/❌ | |

## 发现的问题

- 问题 1: ...
- 问题 2: ...

## 建议

- 建议 1: ...
- 建议 2: ...
```

---

## 🎯 下一步

测试完成后，建议：

1. ✅ 实现 OpenAI Provider
2. ✅ 实现 Runway Provider
3. ✅ 添加更多平台支持
4. ✅ 完善错误处理
5. ✅ 添加日志系统
6. ✅ 性能优化
7. ✅ 安全加固

---

**祝测试顺利！🚀**

