# realtime-front

[![node](https://img.shields.io/badge/node-18.18.0-green.svg)](https://github.com/nodejs/node)
[![npm](https://img.shields.io/badge/npm-9.8.1-brightgreen.svg)](https://github.com/npm/npm)
[![vue](https://img.shields.io/badge/vue-3.5.13-brightgreen.svg)](https://github.com/vuejs/vue)
[![vue-router](https://img.shields.io/badge/vue--router-4.5.0-brightgreen.svg)](https://github.com/vuejs/vue-router)
[![element-plus](https://img.shields.io/badge/element--plus-2.9.5-brightgreen.svg)](https://github.com/element-plus/element-plus)
[![mitt](https://img.shields.io/badge/mitt-3.0.1-brightgreen.svg)](https://github.com/developit/mitt)
[![wavesurfer](https://img.shields.io/badge/wavesurfer-7.9.1-brightgreen.svg)](https://github.com/katspaugh/wavesurfer.js)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)


## 简介
🎉🎉 这是智谱realtime api的使用场景前端样例，希望对第一次接入的小伙伴有参考意义和帮助！🎉🎉。realtime-front 是一个基于 Vue 3 和 Vite 构建的开源前端项目。借助 Vue 3 的先进特性以及 Vite 闪电般的构建速度，项目旨在为智谱realtime api接入使用的开发者提供一个前端调用接口样例，提升开发效率和接入使用用户体验。此项目的主要代码是由 vue 2 项目迁移过来的，采用新版本和新脚手架主要是为了后续迭代的可维护性和可扩展性。项目功能包括：针对realtime接口，进行语音、语音视频、语音屏幕三种交互形态的使用场景。

## 特性
- **Vue 3 驱动**：使用 Vue 3 的基础框架，提升了项目后续可扩展性与可维护性。
- **Vite 构建**：拥有快速的冷启动和热更新能力，显著提高开发效率。
- **组件化设计**：高度组件化的架构，便于代码管理和功能扩展。
- **路由管理**：采用 Vue Router 进行单页面应用的路由控制，支持动态路由和路由守卫。

## 安装与使用

### 环境要求
- Node.js（版本 >= v18.0.0）
- npm 或 pnpm

### 安装依赖
```bash
git clone https://github.com/MetaGLM/realtime-front.git
cd realtime-front
pnpm install
```

### 运行项目
```bash
pnpm run dev
```

### 生产构建
```bash
pnpm run build
```

### 预览生产构建
```bash
pnpm run preview
```

### 项目结构
```bash
realtime-front/
├── public/             # 静态资源目录，直接复制到 dist 目录
├── src/                # 源代码目录
│   ├── assets/         # 应用内的静态资源，如图片、样式文件等
│   ├── components/     # 通用组件目录
│   ├── constants/      # 常量配置目录
│   ├── router/         # 路由配置目录
│   ├── view/           # 页面组件目录
│   ├── utils/          # 工具函数目录
│   ├── App.vue         # 根组件
│   └── main.js         # 入口文件
├── .gitignore          # Git 忽略文件
├── index.html          # 主 HTML 文件
├── LICENSE             # 许可证文件
├── package.json        # 项目依赖和脚本配置文件
├── pnpm-lock.yaml      # pnpm 锁文件
└── README.md           # 文档说明
└── vite.config.js      # Vite 配置文件
```

### 第三方依赖
```bash
"element-plus": "^2.9.5"   # Element Plus 是一个基于 Vue 3 的组件库
"lodash-es": "^4.17.21"    # lodash-es 是 lodash 的 ES 模块版本，提供更高效的函数式编程工具
"mitt": "^3.0.1"           # 事件总线
"vue": "^3.5.13"           # Vue 3 核心库
"vue-router": "^4.5.0"          # 路由管理
"wavesurfer.js": "^7.9.1"   #音频播放器
```
### 第三方库版权声明
#### wavesurfer.js
BSD 3-Clause License

Copyright (c) 2012-2023, katspaugh and contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


## 📄 许可证
本项目采用 [MIT] 许可证，详见 [LICENSE](./LICENSE.md)。