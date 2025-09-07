-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analysis Results
CREATE TABLE IF NOT EXISTS analysis (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,               -- path ของรูปที่ user upload
  skin_type VARCHAR(50),                  -- oily, dry, etc.
  acne_severity VARCHAR(50),              -- mild, moderate, severe
  confidence INT,                         -- ความมั่นใจ %
  detected_issues TEXT[],                 -- array เช่น {acne, redness}
  recommendations JSONB,                  -- เก็บผลลัพธ์จาก AI (JSON)
  created_at TIMESTAMP DEFAULT NOW()
);

-- User History
CREATE TABLE IF NOT EXISTS user_history (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  analysis_id INT REFERENCES analysis(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,           -- เช่น "upload", "analysis_created", "report_generated"
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed demo user: username=user, password=pass (bcrypt hash)
INSERT INTO users (username, password)
VALUES ('user', '$2b$10$2vI5xnyM5IDkBMZ9Vg4Jue8mNuiR2lE94o40LZpSY0mXtlB05wKmW')
ON CONFLICT (username) DO NOTHING;
