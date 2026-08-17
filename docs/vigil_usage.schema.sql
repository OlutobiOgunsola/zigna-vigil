-- Vigil AI Usage table
-- Add this migration to BOTH zignalyft-api and zignastay-api
-- Tracks monthly AI usage per business entity

CREATE TABLE IF NOT EXISTS vigil_usage (
  id              INTEGER       PRIMARY KEY AUTO_INCREMENT,
  gym_id          INTEGER       NULL,           -- set for ZignaLyft
  hotel_id        INTEGER       NULL,           -- set for ZignaStay
  user_id         INTEGER       NOT NULL,
  month           STRING(7)     NOT NULL,       -- 'YYYY-MM' format
  tool_name       STRING(255)   NOT NULL,       -- e.g. 'zignalyft.members.list'
  ai_provider     STRING(50)    NOT NULL,       -- e.g. 'opencode'
  ai_model        STRING(100)   NOT NULL,       -- e.g. 'qwen3.7-plus'
  input_tokens    INTEGER       NOT NULL DEFAULT 0,
  output_tokens   INTEGER       NOT NULL DEFAULT 0,
  tool_executed   BOOLEAN       NOT NULL DEFAULT false,
  duration_ms     INTEGER       NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX vigil_usage_gym_month     ON vigil_usage (gym_id, month);
CREATE INDEX vigil_usage_hotel_month   ON vigil_usage (hotel_id, month);
CREATE INDEX vigil_usage_user_month    ON vigil_usage (user_id, month);
CREATE INDEX vigil_usage_tool          ON vigil_usage (tool_name);
CREATE INDEX vigil_usage_created       ON vigil_usage (created_at);
