-- Auto-created by setup script
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_history (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed a demo user: username=user, password=pass (bcrypt hash below)
-- password 'pass' hashed with cost 10; you may replace it later.
INSERT INTO users (username, password)
VALUES ('user', '$2b$10$2vI5xnyM5IDkBMZ9Vg4Jue8mNuiR2lE94o40LZpSY0mXtlB05wKmW')
ON CONFLICT (username) DO NOTHING;
