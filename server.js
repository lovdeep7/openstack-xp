const router = require("./routes");
const express = require("express");
const cors = require("cors");
const client = require("./database");
require("express-async-errors");

require("dotenv").config();

const main = async () => {
  const app = express();

  const PORT = process.env.PORT || 4000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors());

  app.use("/", router);

  app.get("/", (req, res) => {
    res.send("Hello!!");
  });

  app.use((err, req, res, next) => {
    console.log("== Error:", err.message);
  });

  await client.connect();

  app.listen(PORT, () => {
    console.log("listening");
  });
};

main();
