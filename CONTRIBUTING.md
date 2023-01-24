# Contributing

## Commands

When developing, run the following from the root-level directory:

```shell
yarn
```

**Lint code** - It will only run lint and not fix

```shell
yarn lint
```

**Lint and fix code** - It will run lint and fix code

```shell
yarn lint:fix
```

**Build** - This will build all libraries.

```shell
yarn build
```

**Test** - This will run tests.

```shell
yarn test
```

**Test coverage** - This will run all tests and report test coverage.

```shell
yarn test:cov
```



## Coding style

All the JavaScript code in this project conforms to the [prettier](https://github.com/prettier/prettier) coding style. Code is automatically prettified upon commit using precommit hooks.

## Documentation
Our documentation is using [gitbook](https://www.gitbook.com/). If you have been given access as a contributor to the docs, you will have access to this [link](https://app.gitbook.com/o/FwLb6BYpsupuOqpDvFFr/s/k4jk6sVLepIAbWAKjFG6/)

## Releasing

[Semantic release](https://github.com/semantic-release/semantic-release) is being used for versioning and packaging purposes.

Make sure commit messages follow the [commit git message syntax](https://github.com/trixtateam/trixta-js/blob/master/.gitmessage)

All PR's run a CI check that need to pass and require at least 1 approval. Once approved and merged into master.

[Semantic release](https://github.com/semantic-release/semantic-release) will check the commit history on the approved PR. When the PR is merged into master, it will determine
the version based on commit message syntax.
- A version will be updated for pacakges
- Packages will be published.
