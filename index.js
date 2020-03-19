require("dotenv").config();

const deployAPI = require("./deploy-api");
const deployWEBAPP = require("./deploy-webapp");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const express = require("express");

const app = express();
app.use(bodyParser.raw({ type: "*/*" }));

function checkSignature(req, res, next) {
  if (process.env.SECRET && !req.headers["x-hub-signature"]) {
    return next("signature missing");
  }

  const signature = crypto
    .createHmac("sha1", process.env.SECRET)
    .update(req.body)
    .digest("hex");

  if ("sha1=" + signature !== req.headers["x-hub-signature"])
    return next("signature invalid");

  next();
}

app.post("/api", checkSignature, async (req, res) => {
  let body = JSON.parse(req.body);
  console.log("web hook received: " + req.headers["x-github-event"]);

  if (req.headers["x-github-event"] === "push") {
    const branch = body.ref.split("/").pop();
    console.log("branch: " + branch);
    if (branch === process.env.BRANCH) {
      deployAPI();
    }
  }

  res.status(200).send();
});

app.post("/webapp", checkSignature, async (req, res) => {
  let body = JSON.parse(req.body);
  console.log("web hook received: " + req.headers["x-github-event"]);

  if (req.headers["x-github-event"] === "push") {
    const branch = body.ref.split("/").pop();
    console.log("branch: " + branch);
    if (branch === process.env.BRANCH) {
      deployWEBAPP();
    }
  }

  res.status(200).send();
});

app.listen(process.env.DEPLOY_PORT, () => {
  console.log("listening at port", process.env.DEPLOY_PORT);
});
