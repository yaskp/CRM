ALTER TABLE quotations MODIFY COLUMN status ENUM('draft', 'sent', 'accepted', 'rejected', 'approved', 'accepted_by_party') DEFAULT 'draft';
