-- PostgreSQL Production Migration Script for WorkLink
-- Optimizes storage, index scans, and database joins for 100k+ concurrent users.

-- 1. Users Table
CREATE TABLE users (
    uid VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('worker', 'employer', 'admin')),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    location VARCHAR(255),
    city VARCHAR(100),
    area VARCHAR(100),
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    upi_id VARCHAR(255) NOT NULL,
    upi_verified BOOLEAN DEFAULT FALSE,
    selfie_url TEXT,
    selfie_verified BOOLEAN DEFAULT FALSE,
    profile_photo_url TEXT,
    trust_score INT DEFAULT 20,
    completed_jobs INT DEFAULT 0,
    availability BOOLEAN DEFAULT TRUE,
    business_type VARCHAR(100) DEFAULT 'Individual',
    skills TEXT[], -- Array of skills for helpers
    language VARCHAR(10) DEFAULT 'en',
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for geography-based matching & role listings
CREATE INDEX idx_users_city_area ON users(city, area);
CREATE INDEX idx_users_role_verification ON users(role, verification_status);
CREATE INDEX idx_users_phone ON users(phone);

-- 2. Jobs Table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    employer_id VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,
    payment NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'completed', 'cancelled')),
    workers_needed INT DEFAULT 1,
    workers_selected_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Compound index for main Feed sorting and filtering
CREATE INDEX idx_jobs_search_feed ON jobs(status, city, area, created_at DESC);
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);

-- 3. Applications Table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing to speed up application checks on worker/employer dashboards
CREATE UNIQUE INDEX idx_applications_uniq_job_worker ON applications(job_id, worker_id);
CREATE INDEX idx_applications_worker_lookup ON applications(worker_id, status);
CREATE INDEX idx_applications_job_lookup ON applications(job_id);

-- 4. Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Can be UID or 'admin'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_unread_user ON notifications(user_id, read) WHERE read = FALSE;

-- 5. UPI Change Requests Table
CREATE TABLE upi_change_requests (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(255) REFERENCES users(uid) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    old_upi_id VARCHAR(255),
    new_upi_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_upi_requests_status ON upi_change_requests(status);
