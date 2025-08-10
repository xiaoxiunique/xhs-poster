-- 添加新字段到xhs_accounts表
ALTER TABLE xhs_accounts ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE xhs_accounts ADD COLUMN IF NOT EXISTS nickname VARCHAR(255);
ALTER TABLE xhs_accounts ADD COLUMN IF NOT EXISTS avatar TEXT;
