CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    github_username VARCHAR(50),
    wallet_address VARCHAR(42),
    unique(wallet_address)
);
