-- Insert sample creators
INSERT INTO creators (name, handle, email, phone, bio, follower_count, engagement_rate, rate, platforms, niche, location, status) VALUES
('Jane Fashion', '@fashionista_jane', 'jane@example.com', '+1-555-0101', 'Fashion influencer based in NYC with a passion for sustainable fashion', 45000, 3.2, 1500.00, '["instagram", "tiktok"]', '["fashion", "lifestyle"]', 'New York, NY', 'active'),
('Tech Mike', '@tech_reviewer', 'mike@example.com', '+1-555-0102', 'Tech enthusiast reviewing the latest gadgets and software', 78000, 4.5, 2200.00, '["youtube", "instagram"]', '["technology", "reviews"]', 'San Francisco, CA', 'active'),
('Beauty Guru', '@beauty_influencer', 'beauty@example.com', '+1-555-0103', 'Beauty content creator specializing in Korean skincare', 120000, 5.8, 3000.00, '["instagram", "youtube", "tiktok"]', '["beauty", "skincare"]', 'Los Angeles, CA', 'active'),
('Fitness Frank', '@fit_frank', 'frank@example.com', '+1-555-0104', 'Personal trainer and fitness motivation coach', 32000, 4.1, 1200.00, '["instagram", "youtube"]', '["fitness", "health"]', 'Miami, FL', 'active'),
('Travel Tina', '@wanderlust_tina', 'tina@example.com', '+1-555-0105', 'Travel blogger exploring hidden gems around the world', 95000, 3.9, 2800.00, '["instagram", "youtube", "blog"]', '["travel", "lifestyle"]', 'Austin, TX', 'active');

-- Insert sample campaigns
INSERT INTO campaigns (name, brand, description, budget, start_date, end_date, status, goals, target_audience, content_requirements) VALUES
('Summer Sale 2024', 'FashionForward', 'Promote summer collection with influencer partnerships', 50000.00, '2024-06-01', '2024-08-31', 'active', '["brand_awareness", "sales"]', 'Women 18-35 interested in fashion', 'Instagram posts and stories featuring summer outfits'),
('Tech Product Launch', 'GadgetCorp', 'Launch new smartphone with tech reviewers', 75000.00, '2024-07-15', '2024-09-15', 'active', '["product_awareness", "reviews"]', 'Tech enthusiasts 20-45', 'Unboxing videos and detailed reviews'),
('Skincare Routine Campaign', 'GlowBeauty', 'Showcase 10-step skincare routine', 30000.00, '2024-08-01', '2024-10-01', 'active', '["education", "brand_awareness"]', 'Women 16-40 interested in skincare', 'Tutorial videos and before/after photos'),
('Fitness Challenge', 'HealthyLife', '30-day fitness transformation challenge', 25000.00, '2024-09-01', '2024-10-31', 'draft', '["engagement", "community_building"]', 'Adults interested in fitness', 'Daily workout videos and progress updates'),
('Holiday Travel Guide', 'WanderlustTravel', 'Promote holiday destinations and travel packages', 40000.00, '2024-11-01', '2024-12-31', 'draft', '["bookings", "brand_awareness"]', 'Adults 25-55 planning vacations', 'Destination guides and travel vlogs');

-- Insert sample bookings
INSERT INTO bookings (creator_id, campaign_id, status, rate, content_type, deliverables_due, post_date, notes) VALUES
((SELECT id FROM creators WHERE handle = '@fashionista_jane'), (SELECT id FROM campaigns WHERE name = 'Summer Sale 2024'), 'posted', 1500.00, '["post", "story"]', '2024-07-15', '2024-07-20', 'Great engagement on summer collection posts'),
((SELECT id FROM creators WHERE handle = '@tech_reviewer'), (SELECT id FROM campaigns WHERE name = 'Tech Product Launch'), 'approved', 2200.00, '["video", "post"]', '2024-08-01', '2024-08-05', 'Detailed review video completed'),
((SELECT id FROM creators WHERE handle = '@beauty_influencer'), (SELECT id FROM campaigns WHERE name = 'Skincare Routine Campaign'), 'content_due', 3000.00, '["video", "story"]', '2024-08-20', '2024-08-25', 'Tutorial video in progress'),
((SELECT id FROM creators WHERE handle = '@fit_frank'), (SELECT id FROM campaigns WHERE name = 'Fitness Challenge'), 'confirmed', 1200.00, '["post", "reel"]', '2024-09-15', '2024-09-20', 'Ready to start fitness content'),
((SELECT id FROM creators WHERE handle = '@travel_tina'), (SELECT id FROM campaigns WHERE name = 'Holiday Travel Guide'), 'pending', 2800.00, '["video", "post"]', '2024-11-15', '2024-11-20', 'Waiting for confirmation');

-- Insert sample deliverables
INSERT INTO deliverables (booking_id, title, description, type, status, link, due_date, submitted_at, approved_at, posted_at) VALUES
((SELECT id FROM bookings WHERE rate = 1500.00 LIMIT 1), 'Summer Outfit Post', 'Instagram post featuring summer collection', 'post', 'posted', 'https://instagram.com/p/summer-fashion', '2024-07-15', '2024-07-14 10:00:00', '2024-07-15 09:00:00', '2024-07-20 12:00:00'),
((SELECT id FROM bookings WHERE rate = 1500.00 LIMIT 1), 'Summer Style Story', 'Instagram story showcasing outfit styling', 'story', 'posted', 'https://instagram.com/stories/highlights', '2024-07-15', '2024-07-14 14:00:00', '2024-07-15 11:00:00', '2024-07-20 15:00:00'),
((SELECT id FROM bookings WHERE rate = 2200.00 LIMIT 1), 'Phone Review Video', 'Comprehensive smartphone review video', 'video', 'approved', 'https://youtube.com/watch?v=review123', '2024-08-01', '2024-07-30 16:00:00', '2024-08-01 10:00:00', NULL),
((SELECT id FROM bookings WHERE rate = 3000.00 LIMIT 1), 'Skincare Tutorial', '10-step skincare routine tutorial', 'video', 'in_progress', NULL, '2024-08-20', NULL, NULL, NULL);

-- Insert sample payments
INSERT INTO payments (booking_id, amount, currency, status, payment_method, due_date, paid_at) VALUES
((SELECT id FROM bookings WHERE rate = 1500.00 LIMIT 1), 1500.00, 'USD', 'paid', 'bank_transfer', '2024-07-25', '2024-07-22 14:30:00'),
((SELECT id FROM bookings WHERE rate = 2200.00 LIMIT 1), 2200.00, 'USD', 'paid', 'paypal', '2024-08-10', '2024-08-08 11:15:00'),
((SELECT id FROM bookings WHERE rate = 3000.00 LIMIT 1), 3000.00, 'USD', 'pending', 'bank_transfer', '2024-08-30', NULL),
((SELECT id FROM bookings WHERE rate = 1200.00 LIMIT 1), 1200.00, 'USD', 'pending', 'paypal', '2024-09-25', NULL);
