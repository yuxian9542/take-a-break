# Web CI/CD

- `web-preview.yml` 构建新的 Vite web 客户端：
  - 安装依赖、运行 `pnpm test:web`（Vitest）
  - 执行 `pnpm build:web` 生成静态资源
  - 上传 `apps/web/dist` 作为工件，可用于部署预览

将该文件复制到 `.github/workflows/` 下即可启用 GitHub Actions。
# CI/CD

Pipelines, deployment manifests, and infrastructure-as-code for CI/CD will be introduced here.
