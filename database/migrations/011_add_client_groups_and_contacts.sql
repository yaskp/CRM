-- Add client_group_id to clients table and create client_groups and client_contacts tables

-- Create client_groups table
CREATE TABLE IF NOT EXISTS client_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add client_group_id to clients table
ALTER TABLE clients
ADD COLUMN client_group_id INT NULL AFTER client_code,
ADD CONSTRAINT fk_clients_group FOREIGN KEY (client_group_id) REFERENCES client_groups(id) ON DELETE SET NULL;

-- Create client_contacts table for multiple contact persons
CREATE TABLE IF NOT EXISTS client_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_clients_group_id ON clients(client_group_id);

-- Insert some default client groups
INSERT INTO client_groups (group_name, description) VALUES
('Corporate', 'Large corporate clients'),
('SME', 'Small and Medium Enterprises'),
('Government', 'Government organizations'),
('Individual', 'Individual clients'),
('Retail', 'Retail customers');
