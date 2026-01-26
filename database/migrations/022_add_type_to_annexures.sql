ALTER TABLE annexures ADD COLUMN type ENUM('client_scope', 'contractor_scope', 'payment_terms', 'general_terms') NOT NULL DEFAULT 'general_terms';
