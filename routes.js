const express = require("express");
const axios = require("axios");
const router = express.Router();

const client = require("./database");

const summonAPIRequest = async (featureKey, walletAddress) => {
  try {
    const res = await axios.post(
      "https://sandbox-api.summon.xyz/v1/xps/job/integration/action",
      {
        featureKey,
        walletAddress,
        tenantKey: process.env.TENANT_KEY
      },
      {
        headers: {
          Authorization: `bearer ${process.env.API_TOKEN}`
        }
      }
    );
    console.log("SUMMON", res.data);
  } catch (err) {
    console.log("Caught Error", err);
  }
};

const contribTask1 = async (wallet_address) => {
  console.log("Rewarding:", wallet_address);
  summonAPIRequest("submit_contribution", wallet_address);
};
const contribTask2 = async (wallet_address) => {
  console.log("Rewarding:", wallet_address);
  summonAPIRequest("win_contribution", wallet_address);
};

const reviewTask1 = async (wallet_address) => {
  console.log("Rewarding:", wallet_address);
  summonAPIRequest("submit_review", wallet_address);
};
const reviewTask2 = async (wallet_address) => {
  console.log("Rewarding:", wallet_address);
  wallet_address.forEach((address) => {
    summonAPIRequest("win_review", address.wallet_address);
  });
};

const findOrCreateUser = async (wallet_address, github_username) => {
  const queryText = `
    INSERT INTO users (github_username, wallet_address)
    VALUES ($1, $2)
    ON CONFLICT (wallet_address) DO UPDATE SET github_username=$1
    RETURNING id
`;
  const result = await client.query(queryText, [
    github_username,
    wallet_address
  ]);
  const user_id = result.rows[0].id;
  return user_id;
};

const getGithubUsername = async (github_access_token) => {
  let github_username;
  try {
    const gh_user = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${github_access_token}`
      }
    });
    console.log("GITHUB USER RESULT", gh_user.data);
    github_username = gh_user.data.login;
  } catch (err) {
    console.log("Caught Error", err);
    return null;
  }
  return github_username;
};

router.post("/github", async (req, res) => {
  const { github_code } = req.body;
  try {
    const github_url = `https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${github_code}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}`;
    const gh_response = await axios.post(
      github_url,
      {},
      {
        headers: {
          Accept: "application/json"
        }
      }
    );
    console.log("Here testing:", gh_response.data);
    const gh_access_token = gh_response.data.access_token;
    if (!gh_access_token) throw new Error();
    return res
      .status(200)
      .json({ success: true, access_token: gh_access_token });
  } catch (err) {
    console.log(err);
    return res.status(401).send({
      msg: "Github authentication failed"
    });
  }
});

router.post("/contribution", async (req, res) => {
  const { github_access_token, wallet_address, contribution } = req.body;
  if (!github_access_token || !wallet_address || !contribution)
    return res.status(400).send({
      msg: "Wallet connection, github authentication, and github contribution are required"
    });
  let github_username;
  try {
    github_username = await getGithubUsername(github_access_token);
    console.log("Testing github username", github_username);
  } catch (err) {
    console.log("Caught Error", err);
    return res.status(500).json({ msg: "Caught error" });
  }
  if (!github_username)
    return res.status(401).send({
      msg: "Github authentication failed"
    });

  // await client.connect();
  let user_id;
  try {
    user_id = await findOrCreateUser(wallet_address, github_username);
    console.log("DATABASE USER ID", user_id);
  } catch (err) {
    console.log("Caught Error", err);
    return res.status(500).json({ msg: "Caught error" });
  }
  const threshold = 3;

  const queryText = `INSERT INTO contributions(user_id, description, threshold, score) VALUES($1, $2, $3, 0)`;
  try {
    await client.query(queryText, [user_id, contribution, threshold]);
    contribTask1(wallet_address);
  } catch (err) {
    console.log("Caught Error", err);
    return res.status(400).json({
      msg: "Submission error: You may have submitted the same contribution before"
    });
  }

  return res.status(200).json({ success: true });
});

router.get("/contribution", async (req, res) => {
  const { wallet_address } = req.query;
  if (!wallet_address)
    return res.status(400).send({
      msg: "Wallet connection is required"
    });
  // await client.connect();

  const queryText = `
    SELECT c.id AS id, c.description AS description
    FROM contributions c
    LEFT JOIN (
      SELECT id
      FROM users
      WHERE wallet_address = $1
    ) u ON c.user_id = u.id
    LEFT JOIN (
      SELECT contribution_id, user_id
      FROM reviews
      INNER JOIN users ON reviews.user_id = users.id
      WHERE wallet_address = $1
    ) r ON c.id = r.contribution_id
    WHERE u.id IS NULL AND r.user_id IS NULL AND c.threshold > 0;`;
  const result = await client.query(queryText, [wallet_address]);

  return res.status(200).json(result.rows);
});

router.post("/review", async (req, res) => {
  const { wallet_address, github_access_token, accept, contribution } =
    req.body;
  if (
    !wallet_address ||
    !github_access_token ||
    !contribution ||
    accept == null
  )
    return res.status(400).send({
      msg: "Wallet connection, github authentication, and a valid contribution review are required"
    });

  let github_username = getGithubUsername(github_access_token);

  if (!github_username)
    return res.status(401).send({
      msg: "Github authentication failed"
    });

  // await client.connect();

  const user_id = await findOrCreateUser(wallet_address, github_username);

  const queryText1 = `
    INSERT INTO reviews (user_id, contribution_id, score)
    VALUES ($1, $2, $3) RETURNING id`;
  const queryText2 = `UPDATE contributions SET score = score ${
    accept ? "+" : "-"
  } 1 WHERE id = $1 RETURNING *`;
  const queryText3 = `
    UPDATE contributions
    SET accepted = CASE
      WHEN score > 0 THEN true
      WHEN score < 0 THEN false
      ELSE accepted
    END, threshold = 0
    FROM users u
    WHERE contributions.user_id=u.id AND contributions.id = $1 AND contributions.id = (
      SELECT contribution_id
      FROM reviews
      WHERE contribution_id = $1
      GROUP BY contribution_id
      HAVING COUNT(*) = contributions.threshold
    )
    RETURNING contributions.*, u.wallet_address`;
  let result3;
  try {
    await client.query("BEGIN");
    const result1 = await client.query(queryText1, [
      user_id,
      contribution,
      accept
    ]);
    const result2 = await client.query(queryText2, [contribution]);
    result3 = await client.query(queryText3, [contribution]);
    await client.query("COMMIT");
    reviewTask1(wallet_address);
    console.log(result1.rows);
    console.log(result2.rows);
    console.log(result3.rows);
    if (
      result3.rowCount === 1 &&
      result3.rows.length >= 1 &&
      result3.rows[0].accepted
    )
      contribTask2(result3.rows[0].wallet_address);
    res.status(200).json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.log(err);
    return res.status(400).json({
      msg: "Review error: the contribution you are reviewing might not exist or you may have reviewed it before"
    });
  }
  if (
    result3.rowCount === 1 &&
    result3.rows.length >= 1 &&
    result3.rows[0].accepted
  )
    try {
      const reviewRewardQuery = `SELECT u.wallet_address FROM reviews r LEFT JOIN users u on u.id = r.user_id WHERE r.contribution_id = $1 AND r.score = $2;`;
      const reviewRewardResult = await client.query(reviewRewardQuery, [
        contribution,
        result3.rows[0].accepted
      ]);
      reviewTask2(reviewRewardResult.rows);
    } catch (err) {
      console.log(err);
    }
});

module.exports = router;
