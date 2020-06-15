# Update Project Dependencies

Updating the dependencies is a tedious job. This doc is intended to help streamline the process and make it painless.

## Maintain Update Log

There's a sample `Update Log` at the end of this document. Create a new file where you can dump the Version Diff, Test results, Chrome/Node/npm versions. Mention the dependencies that you had to roll back along with the reason. Optionally you can mention the errors/warnings that you encountered while updating dependencies.

## Managing Node Versions

It is recommended that you use [Node Version Manager](https://github.com/creationix/nvm) or [Node Version Control](https://github.com/tj/n) to switch node versions quickly in order to run and test this project on multiple node versions.

## Update Tooling

**Update npm:**

1.  Run `npm install -g npm`
2.  Run `npm -v` and record npm version in `Update Log`.

**Update Chrome**

1.  Download the [latest version](https://www.google.com/chrome/browser/desktop/index.html) or go to [chrome://settings/](chrome://settings/) and update.

2.  Go to `Chrome -> About` and record version number in `Update Log`

## Update Dependencies

[npm-check-updates](https://github.com/tjunnone/npm-check-updates) is a great tool to update your dependencies. It will only update your `package.json`. Run `npm install` if you want to install updated package versions. There are 3 useful commands.

1.  `ncu -u --semverLevel minor`
2.  `ncu -u --semverLevel major`
3.  `ncu -u`

Confirm/adjust eslint-config-airbnb compatible [dependency versions](https://www.npmjs.com/package/eslint-config-airbnb)

`

### Pinned Version Numbers

`phoenix-to-redux` does not use "^", "~", etc., and these should be removed from `package.json`, if present.

At this point, you should copy and paste the version diff from the terminal into your `Update Log`.

## Correct Errors and Rollback Dependencies

Run `npm install` to install updated versions and then start the example app by running `npm start`. Make sure that the project is running smoothly. If not, track down the dependencies that are causing problems and try to roll them back one by one and check if the example application is running.

Note down the rolled back dependencies and state the reason in your `Update Log`.

## Full Regression Testing

Most of the errors/warnings would go away once you roll back the problemetic dependencies. But we need to make sure that the internal commands, tools, scaffolding etc. are functional too.

**Example Middleware:**

- `rm -rf node_modules && rm package-lock.json`
- `npm install && npm start`

- Include the middleware and reducer in your application
  - load your application

Identify problems that occur and try to resolve them by rolling back the respective dependencies. Update the `Update Log`.

# Sample Update Log

## Tooling Versions
- Node 8.11.4
- npm 6.14.4
- Windows 10
- Chrome 83.0.4103.97 (64-bit)

## :package: Version Diff

**[0] PATCH UPDATES**

```
 babel-eslint               10.0.1  →  10.0.3
 eslint-config-airbnb       17.1.0  →  17.1.1
 eslint-plugin-import       2.17.2  →  2.17.3
 eslint-plugin-jsx-a11y      6.2.1  →   6.2.3
 eslint-plugin-react-hooks   1.6.0  →   1.6.1
 prettier                   1.17.0  →  1.17.1
```

**[1] MINOR UPDATES**

```
 babel-eslint               10.0.1  →  10.0.3
 eslint-config-airbnb       17.1.0  →  17.1.1
 eslint-plugin-import       2.17.2  →  2.17.3
 eslint-plugin-jsx-a11y      6.2.1  →   6.2.3
 eslint-plugin-react-hooks   1.6.0  →   1.6.1
 prettier                   1.17.0  →  1.17.1
```

**[3] MAJOR UPDATES**

```
 phoenix                             1.3.4  →    1.5.3
 babel-eslint                       10.0.3  →   10.1.0
 babel-plugin-dynamic-import-node    2.2.0  →    2.3.3
 eslint-config-airbnb-base          13.1.0  →   13.2.0
 eslint-config-prettier              4.1.0  →    4.3.0
 eslint-import-resolver-webpack     0.11.1  →   0.12.1
 eslint-plugin-import               2.17.3  →   2.21.2
 eslint-plugin-prettier              3.0.1  →    3.1.4
 eslint-plugin-react                7.12.4  →   7.20.0
 eslint-plugin-react-hooks           1.6.1  →    1.7.0
 eslint-plugin-redux-saga            1.0.0  →    1.1.3
 prettier                           1.17.1  →   1.19.1
 rollup                            ^2.15.0  →  ^2.16.1
```

**[4] ROLLBACKS**

```
phoenix                        1.5.3  →       1.3.4 <--- rolled back
```

**[5] NEW DEPENDENCIES**

```
```

## Errors Encountered
- phoenix channels and socket throwing errors with helper methods, will need to be tested and updated to support new library methods
 **_image-webpack-loader 1.3.4 → 1.5.3 <--- Rolled back_**
