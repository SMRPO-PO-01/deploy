require("dotenv").config();

module.exports = {
  apps: [
    {
      name: "smrpo-api",
      script: "dist/main.js",
      cwd: process.env.API_PATH
    }
  ]
};
