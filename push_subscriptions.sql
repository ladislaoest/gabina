CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    subscription JSONB NOT NULL,
    user_id TEXT, -- Optional: to associate subscriptions with users
    created_at TIMESTAMPTZ DEFAULT NOW()
);
