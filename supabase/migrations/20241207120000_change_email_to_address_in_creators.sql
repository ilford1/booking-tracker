-- Migration to rename email column to address in creators table
-- This changes the field name to better reflect that it can store physical addresses
-- instead of email addresses

-- Rename email column to address
ALTER TABLE creators 
RENAME COLUMN email TO address;

-- Update the column comment for clarity
COMMENT ON COLUMN creators.address IS 'Physical address or location of the creator';
