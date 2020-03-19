const chalk = require("chalk");
const path = require("path");
const shell = require("shell-exec");

require("dotenv").config();

const opts = { cwd: path.resolve(process.env.API_PATH), stdio: "pipe" };

async function call(command, message) {
  if (!message) message = `"${command}"`;

  process.stdout.write((message + "...").padEnd(30));

  let { stdout, stderr, cmd, code, error } = await shell(command, opts).catch(
    console.error
  );

  if (error || code) {
    if (error) {
      console.log(chalk.red(error));
    } else {
      console.log(chalk.red("process exited with code :" + code));
    }

    console.log(stdout);
    console.log(stderr);
    throw new Error();
  }

  console.log(chalk.green("done."));
}

async function deployAPI() {
  await call("git fetch", "fetching new commits");

  const canSkipInstall =
    (
      await shell(
        `git diff origin/${process.env.BRANCH} --quiet -- package.json`,
        opts
      )
    ).code == 0;

  await call(
    `git reset --hard origin/${process.env.BRANCH}`,
    "git reset to latest commit"
  );

  const { stdout } = await shell(
    `git show --format="last commit: %an, %ar - %s" -n 1 HEAD --quiet`,
    opts
  );
  process.stdout.write(chalk.yellow(stdout));

  if (canSkipInstall) {
    console.log(
      chalk.yellow('no changes to package.json, skipping "npm install"')
    );
  } else {
    await call(`npm install`);
  }

  await call(`npm run build`, "compiling typescript");

  let ecosystemFile = path.resolve("./ecosystem.config.js");
  await call(
    `pm2 startOrGracefulReload --update-env --only smrpo-api ${ecosystemFile}`,
    "reloading api"
  );
}

// if this file was started directly
if (require.main === module) deployAPI().catch(() => null);
else module.exports = deployAPI;
