-- Migration: Add startDate and endDate fields to Task table
-- Run this migration when the database is available

ALTER TABLE `Task`
ADD COLUMN `startDate` DATETIME(3) NULL AFTER `parentId`,
ADD COLUMN `endDate` DATETIME(3) NULL AFTER `startDate`;
