-- Add 'contacted' status to leads table
ALTER TABLE leads 
MODIFY COLUMN status ENUM('new', 'contacted', 'quoted', 'follow_up', 'converted', 'lost') DEFAULT 'new';
