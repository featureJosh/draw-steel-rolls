# Release Process

This repository releases from GitHub tags. GitLab CI is legacy infrastructure.

## One-time setup

1. Push the repository to GitHub and make sure `origin` points at it.
2. In the GitHub repository settings, enable Actions.
3. Optional: add a repository secret named `FOUNDRY_API_TOKEN` if you want the workflow to publish the version to Foundry's package API. Store the authorization token exactly as Foundry expects it in the `Authorization` header.

## Release steps

1. Update `CHANGELOG.md` with a heading that exactly matches the tag:

    ```md
    ## v14.0.0
    ```

2. Run local checks:

    ```bash
    pnpm type-check
    pnpm lint
    pnpm run ci
    ```

3. Commit the changes.

4. Create and push a tag:

    ```bash
    git tag v14.0.0
    git push origin main
    git push origin v14.0.0
    ```

5. GitHub Actions will build the module, prepare `dist/module.json`, create `draw-steel-rolls-v14.0.0.zip`, upload both files to the GitHub Release, and optionally publish the package version to Foundry.

## URLs

For manual Foundry installation, use:

```text
https://github.com/<owner>/<repo>/releases/latest/download/module.json
```

For a specific Foundry package version, use:

```text
https://github.com/<owner>/<repo>/releases/download/v14.0.0/module.json
```

The release manifest points `download` at the matching zip asset for that tag, while `manifest` points at the latest release manifest so Foundry can discover future updates.
