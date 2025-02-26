/*
  # Create tables for Hive Analytics

  1. New Tables
    - `searches`: Stores search history and results
      - `id` (uuid, primary key)
      - `username` (text): Hive username that was searched
      - `timestamp` (timestamptz): When the search was performed
      - `account_data` (jsonb): Account data from Hive
    - `user_stats`: Stores aggregated user statistics
      - `id` (uuid, primary key)
      - `username` (text): Hive username
      - `post_count` (int): Total number of posts
      - `reward_sum` (numeric): Total rewards earned
      - `last_updated` (timestamptz): Last time stats were updated

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create searches table
CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  account_data jsonb
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  post_count int DEFAULT 0,
  reward_sum numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to searches"
  ON searches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert searches"
  ON searches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read access to user_stats"
  ON user_stats
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to update user_stats"
  ON user_stats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);