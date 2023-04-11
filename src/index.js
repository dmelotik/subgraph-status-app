const script = require("./script.js");

const express = require("express");
const app = express();
const port = 3000;

app.get("/status", async (req, res) => {
  // set only prod as the default value, but we only accept true/false
  let onlyProd = true;
  if (req.headers["only-prod"] === "false") {
    onlyProd = false;
  }

  // grab the status of the decentralized network if an api key is provided
  if (
    req.headers["graph-api-key"] !== undefined &&
    req.headers["graph-api-key"].trim() !== ""
  ) {
    const json = await script.getStatusJson(
      onlyProd,
      req.headers["graph-api-key"]
    );
    if (json.error !== undefined) {
      res.status(401).send(json);
    } else {
      res.json(json);
    }
  } else {
    const json = await script.getStatusJson(onlyProd);
    if (json.error !== undefined) {
      res.status(400).send(json);
    } else {
      res.json(json);
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
