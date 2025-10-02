-- 1. Creating the crocodile_observations table
CREATE TABLE crocodile_observations (
    observation_id INT,
    common_name VARCHAR(100),
    scientific_name VARCHAR(100),
    family VARCHAR(50),
    genus VARCHAR(50),
    observed_length_m DECIMAL(5,2),
    observed_weight_kg DECIMAL(6,1),
    age_class VARCHAR(20),
    sex VARCHAR(10),
    date_of_observation DATE,
    country_region VARCHAR(100),
    habitat_type VARCHAR(50),
    conservation_status VARCHAR(30),
    observer_name VARCHAR(100),
    notes TEXT
);

-- Inserting sample data from the crocodile dataset
INSERT INTO crocodile_observations (observation_id, common_name, scientific_name, family, genus, observed_length_m, observed_weight_kg, age_class, sex, date_of_observation, country_region, habitat_type, conservation_status, observer_name, notes) VALUES
(1, 'Morelet''s Crocodile', 'Crocodylus moreletii', 'Crocodylidae', 'Crocodylus', 1.9, 62.0, 'Adult', 'Male', '2018-03-31', 'Belize', 'Swamps', 'Least Concern', 'Allison Hill', 'Cause bill scientist nation opportunity.'),
(2, 'American Crocodile', 'Crocodylus acutus', 'Crocodylidae', 'Crocodylus', 4.09, 334.5, 'Adult', 'Male', '2015-01-28', 'Venezuela', 'Mangroves', 'Vulnerable', 'Brandon Hall', 'Ago current practice nation determine operation speak according.'),
(3, 'Orinoco Crocodile', 'Crocodylus intermedius', 'Crocodylidae', 'Crocodylus', 1.08, 118.2, 'Juvenile', 'Unknown', '2010-12-07', 'Venezuela', 'Flooded Savannas', 'Critically Endangered', 'Melissa Peterson', 'Democratic shake bill here grow gas enough analysis least by two.'),
(4, 'Morelet''s Crocodile', 'Crocodylus moreletii', 'Crocodylidae', 'Crocodylus', 2.42, 90.4, 'Adult', 'Male', '2019-11-01', 'Mexico', 'Rivers', 'Least Concern', 'Edward Fuller', 'Officer relate animal direction eye bag do.'),
(5, 'Mugger Crocodile (Marsh Crocodile)', 'Crocodylus palustris', 'Crocodylidae', 'Crocodylus', 3.75, 269.4, 'Adult', 'Unknown', '2019-07-15', 'India', 'Rivers', 'Vulnerable', 'Donald Reid', 'Class great prove reduce raise author play move each left establish understand read detail.'),
(6, 'Mugger Crocodile (Marsh Crocodile)', 'Crocodylus palustris', 'Crocodylidae', 'Crocodylus', 2.64, 137.4, 'Adult', 'Male', '2023-06-08', 'India', 'Reservoirs', 'Vulnerable', 'Randy Brown', 'Source husband at tree note responsibility defense.'),
(7, 'Siamese Crocodile', 'Crocodylus siamensis', 'Crocodylidae', 'Crocodylus', 2.85, 157.7, 'Subadult', 'Male', '2010-12-10', 'Thailand', 'Slow Rivers', 'Critically Endangered', 'Dr. Marvin Thomas Jr.', 'Much section investment on gun young catch management sense technology check civil quite others his other life edge.'),
(8, 'Congo Dwarf Crocodile', 'Osteolaemus osborni', 'Crocodylidae', 'Osteolaemus', 0.35, 4.7, 'Juvenile', 'Unknown', '2008-08-03', 'Central African Republic', 'Forest Swamps', 'Data Deficient', 'Terri Frazier', 'Race Mr environment political born itself law west.'),
(9, 'West African Crocodile', 'Crocodylus suchus', 'Crocodylidae', 'Crocodylus', 3.05, 201.2, 'Adult', 'Male', '2020-04-16', 'Sudan', 'Lakes', 'Least Concern', 'Deborah Mason', 'Medical blood personal success medical current hear claim well.'),
(10, 'Morelet''s Crocodile', 'Crocodylus moreletii', 'Crocodylidae', 'Crocodylus', 3.39, 197.2, 'Adult', 'Male', '2016-05-21', 'Mexico', 'Lagoons', 'Least Concern', 'Tamara George', 'Affect upon these story film around there water beat magazine attorney set.');

-- 2. Query using aggregate function with OVER clause
-- Calculate the average goals per match for each player and compare with overall average
SELECT 
    player,
    team,
    season,
    goals,
    matches,
    ROUND(goals::DECIMAL / matches, 2) AS goals_per_match,
    ROUND(AVG(goals::DECIMAL / matches) OVER(), 2) AS overall_avg_goals_per_match,
    ROUND((goals::DECIMAL / matches) - AVG(goals::DECIMAL / matches) OVER(), 2) AS difference_from_avg
FROM stats
WHERE matches > 0
ORDER BY goals_per_match DESC
LIMIT 20;

-- 3. Query using PARTITION BY
-- Calculate average season rating for each team and compare individual player ratings
SELECT 
    team,
    player,
    season,
    season_rating,
    ROUND(AVG(season_rating) OVER (PARTITION BY team), 2) AS team_avg_rating,
    ROUND(season_rating - AVG(season_rating) OVER (PARTITION BY team), 2) AS rating_vs_team_avg
FROM stats
ORDER BY team, season_rating DESC;

-- 4. Query using OVER with ORDER BY
-- Calculate running total of goals for each player across seasons
SELECT 
    player,
    team,
    season,
    goals,
    SUM(goals) OVER (PARTITION BY player ORDER BY season) AS running_total_goals,
    ROW_NUMBER() OVER (PARTITION BY player ORDER BY season) AS season_number
FROM stats
WHERE player IN ('Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappe', 'Mohamed Salah')
ORDER BY player, season;

-- 5. Query using ranking functions
-- Rank players by season rating within each team using different ranking functions
SELECT 
    team,
    player,
    season,
    season_rating,
    RANK() OVER (PARTITION BY team ORDER BY season_rating DESC) AS rank_by_rating,
    DENSE_RANK() OVER (PARTITION BY team ORDER BY season_rating DESC) AS dense_rank_by_rating,
    ROW_NUMBER() OVER (PARTITION BY team ORDER BY season_rating DESC) AS row_number_by_rating,
    NTILE(4) OVER (PARTITION BY team ORDER BY season_rating DESC) AS quartile_by_rating
FROM stats
WHERE team IN ('Barcelona', 'Real Madrid', 'PSG', 'Liverpool', 'Man City')
ORDER BY team, season_rating DESC;
