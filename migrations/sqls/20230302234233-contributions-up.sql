CREATE TABLE IF NOT EXISTS contributions (
    id SERIAL PRIMARY KEY,
    user_id bigint REFERENCES users(id),
    description VARCHAR NOT NULL,
    threshold integer,
    score integer default 0,
    accepted boolean default false,
    unique(user_id, description)
);
