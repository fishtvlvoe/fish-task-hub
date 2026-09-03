# JavaScript 標準專案包模板

```text
packageManager: pnpm@<exact>
lockfile: pnpm-lock.yaml only
node: .node-version + engines.node
commands (PROJECT.md): install / dev / test / lint / build / clean
```

既有 npm 專案：先通過 CI／build／test 再遷移，禁止未驗證刪 lockfile。
