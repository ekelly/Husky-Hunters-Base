CREATE DATABASE IF NOT EXISTS HuskyHunterBase CHARACTER SET = utf8;

USE HuskyHunterBase;

CREATE TABLE IF NOT EXISTS `teams` (
  `id` char(8) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `clues` (
  `team` char(8) NOT NULL,
  `clue_number` int unsigned NOT NULL,
  `body` mediumblob NOT NULL,
  PRIMARY KEY (`team`,`clue_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
