-- Migration 0002: Add tip_mxn column to tabs table
ALTER TABLE tabs ADD COLUMN tip_mxn REAL NOT NULL DEFAULT 0;
