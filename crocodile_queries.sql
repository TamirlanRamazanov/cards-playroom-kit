-- 1. Create table and import crocodile dataset
CREATE TABLE crocodiles (
    observation_id INT,
    common_name VARCHAR(100),
    scientific_name VARCHAR(100),
    family VARCHAR(50),
    genus VARCHAR(50),
    observed_length_m DECIMAL(5,2),
    observed_weight_kg DECIMAL(8,2),
    age_class VARCHAR(20),
    sex VARCHAR(10),
    date_of_observation DATE,
    country_region VARCHAR(100),
    habitat_type VARCHAR(50),
    conservation_status VARCHAR(50),
    observer_name VARCHAR(100),
    notes TEXT
);

-- Import data using COPY command
COPY crocodiles FROM '/Users/TamirlanR/WebstormProjects/playroomworking/my-playroom-test/src/crocodile_dataset.csv' 
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Verify data import
SELECT COUNT(*) as total_records FROM crocodiles;
SELECT * FROM crocodiles LIMIT 5;

-- 2. Query using aggregate function with ROWS parameter
-- Calculate moving average of crocodile length over 3 consecutive observations
SELECT 
    observation_id,
    common_name,
    observed_length_m,
    AVG(observed_length_m) OVER (
        ORDER BY observation_id 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as moving_avg_length_3_rows
FROM crocodiles
ORDER BY observation_id
LIMIT 20;

-- 3. Query using aggregate function with RANGE parameter
-- Calculate average weight for crocodiles with similar length (within 0.5m range)
SELECT 
    observation_id,
    common_name,
    observed_length_m,
    observed_weight_kg,
    AVG(observed_weight_kg) OVER (
        ORDER BY observed_length_m 
        RANGE BETWEEN 0.5 PRECEDING AND 0.5 FOLLOWING
    ) as avg_weight_similar_length
FROM crocodiles
WHERE observed_length_m IS NOT NULL
ORDER BY observed_length_m
LIMIT 20;

-- 4. Query using LAG() function
-- Compare current crocodile length with previous observation
SELECT 
    observation_id,
    common_name,
    observed_length_m,
    LAG(observed_length_m, 1) OVER (ORDER BY observation_id) as previous_length,
    observed_length_m - LAG(observed_length_m, 1) OVER (ORDER BY observation_id) as length_difference
FROM crocodiles
WHERE observed_length_m IS NOT NULL
ORDER BY observation_id
LIMIT 20;

-- 5. Query using FIRST_VALUE() and LAST_VALUE() functions
-- Show first and last crocodile length for each species
SELECT 
    common_name,
    observed_length_m,
    FIRST_VALUE(observed_length_m) OVER (
        PARTITION BY common_name 
        ORDER BY observation_id 
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as first_length_for_species,
    LAST_VALUE(observed_length_m) OVER (
        PARTITION BY common_name 
        ORDER BY observation_id 
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as last_length_for_species
FROM crocodiles
WHERE observed_length_m IS NOT NULL
ORDER BY common_name, observation_id
LIMIT 30;

-- Additional query using NTH_VALUE() function
-- Show the 3rd longest crocodile in each country
SELECT 
    country_region,
    common_name,
    observed_length_m,
    NTH_VALUE(observed_length_m, 3) OVER (
        PARTITION BY country_region 
        ORDER BY observed_length_m DESC 
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as third_longest_in_country
FROM crocodiles
WHERE observed_length_m IS NOT NULL
ORDER BY country_region, observed_length_m DESC
LIMIT 30;
