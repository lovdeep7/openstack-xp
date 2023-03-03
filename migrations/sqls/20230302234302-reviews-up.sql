CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id bigint REFERENCES users(id),
    contribution_id bigint REFERENCES contributions(id),
    score boolean,
    unique(user_id, contribution_id)
);
