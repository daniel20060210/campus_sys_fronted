<!-- 运维文件，开发时请不要删除 -->

# Docker Compose 部署指南

## 开发环境

用于开发者在个人电脑上快速拉起测试环境。

### 前置准备

- 有效的环境变量 `.env` 文件
  - `CB_MANAGE_LOCAL_PORT` 为映射到本机供测试的端口
  - `VITE_BACKEND_PREFIX` 为 API、图片和下载资源共用的后端前缀，如 `https://api.staging.biteofcampus.com` 或 `/backend`。该变量在前端构建时写入产物。
    > 完整地址最终由用户浏览器访问，不能填写仅容器内部可解析的 `host.docker.internal`。生产环境推荐使用浏览器可访问的 HTTPS 地址，或由网关转发的同源路径前缀。

### 执行命令

> 如果你需要使用代理，请先配置代理。例如，如果你使用 Windows，代理运行在 `127.0.0.1:10808`，你需要在 PowerShell 内执行：
>
> ```powershell
> $env:HTTP_PROXY = "127.0.0.1:10808"
> $env:HTTPS_PROXY = "127.0.0.1:10808"
> ```
>
> 代理设置在退出 PowerShell 后立即失效，因此下次构建 Docker 前需要重新执行上述命令。
>
> 关于如何确定代理的 URL (包括端口号)，请自行在代理软件的设置中查找。

完成前置准备后，你需要执行以下命令来拉起 Docker 容器：

```shell
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```

## 生产环境

CI/CD 流程中 production 步骤需执行的命令。

组合以下配置：
- `compose.yaml`
- `compose.prod.yaml`
- `compose.efk.yaml` (暂未实装，无需组合)
