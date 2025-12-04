-- Schema-per-tenant strategy
CREATE SCHEMA tenant_1;
CREATE SCHEMA tenant_2;

-- Example table for tenant_1
CREATE TABLE tenant_1.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE
);

-- Example table for tenant_2
CREATE TABLE tenant_2.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE
);

-- Row-level security strategy
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Enable row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Define policies for tenant isolation
CREATE POLICY tenant_isolation_policy ON users
    USING (tenant_id = current_setting('app.tenant_id')::INT);