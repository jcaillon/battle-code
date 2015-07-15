-- phpMyAdmin SQL Dump
-- version 4.1.9
-- http://www.phpmyadmin.net
--
-- Client :  noyacfrvludbuser.mysql.db
-- Généré le :  Dim 17 Mai 2015 à 14:53
-- Version du serveur :  5.5.43-0+deb7u1-log
-- Version de PHP :  5.3.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Base de données :  `noyacfrvludbuser`
--

-- --------------------------------------------------------

--
-- Structure de la table `action`
--

CREATE TABLE IF NOT EXISTS `action` (
  `gameId` bigint(20) unsigned DEFAULT NULL,
  `round` int(11) NOT NULL,
  `sourceTeamId` varchar(20) NOT NULL,
  `targetTeamId` varchar(20) NOT NULL,
  `nbPA` int(11) DEFAULT NULL,
  `statusStr` varchar(20) DEFAULT NULL,
  `actionId` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`actionId`),
  UNIQUE KEY `actionId` (`actionId`),
  UNIQUE KEY `unique_actionId` (`actionId`),
  KEY `sourceTeamId_gameId_round_index` (`sourceTeamId`,`gameId`,`round`),
  KEY `gameId` (`gameId`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=231 ;

-- --------------------------------------------------------

--
-- Structure de la table `game`
--

CREATE TABLE IF NOT EXISTS `game` (
  `gameId` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `gameToken` varchar(50) NOT NULL,
  `creationTime` datetime NOT NULL,
  `statusStr` varchar(10) DEFAULT NULL,
  `round` int(11) NOT NULL,
  `lastRoundTime` datetime NOT NULL,
  `roundtime` int(11) NOT NULL DEFAULT '5',
  `nbTeam` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`gameId`),
  UNIQUE KEY `gameId` (`gameId`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

-- --------------------------------------------------------

--
-- Structure de la table `team`
--

CREATE TABLE IF NOT EXISTS `team` (
  `teamId` varchar(20) NOT NULL,
  `teamToken` varchar(50) NOT NULL,
  PRIMARY KEY (`teamId`),
  KEY `teamId_index` (`teamId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `teamingame`
--

CREATE TABLE IF NOT EXISTS `teamingame` (
  `teamId` varchar(20) NOT NULL,
  `gameId` bigint(20) unsigned NOT NULL DEFAULT '0',
  `profileStr` varchar(10) DEFAULT NULL,
  `lifePoint` int(11) NOT NULL DEFAULT '100',
  `roundDead` int(11) DEFAULT '0',
  PRIMARY KEY (`teamId`,`gameId`),
  KEY `teamId_gameId_index` (`teamId`,`gameId`),
  KEY `gameId` (`gameId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `action`
--
ALTER TABLE `action`
ADD CONSTRAINT `action_ibfk_1` FOREIGN KEY (`gameId`) REFERENCES `game` (`gameId`);

--
-- Contraintes pour la table `teamingame`
--
ALTER TABLE `teamingame`
ADD CONSTRAINT `teamingame_ibfk_1` FOREIGN KEY (`gameId`) REFERENCES `game` (`gameId`) ON DELETE CASCADE ON UPDATE CASCADE;
