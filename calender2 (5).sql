-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- ホスト: 127.0.0.1
-- 生成日時: 2025-04-14 03:17:54
-- サーバのバージョン： 10.4.32-MariaDB
-- PHP のバージョン: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- データベース: `calender2`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `admin_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(128) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `alembic_version`
--

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL COMMENT 'マイグレーションバージョン番号'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `alembic_version`
--

INSERT INTO `alembic_version` (`version_num`) VALUES
('b422400b1dd0');

-- --------------------------------------------------------

--
-- テーブルの構造 `announcements`
--

CREATE TABLE `announcements` (
  `announcement_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_important` tinyint(1) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `api_settings`
--

CREATE TABLE `api_settings` (
  `id` int(11) NOT NULL COMMENT 'API設定の一意識別子',
  `name` varchar(100) NOT NULL COMMENT 'API名称（例：Google Calendar、Notion）',
  `api_type` varchar(50) NOT NULL COMMENT 'APIタイプ（google, notion, outlook）',
  `api_url` varchar(255) NOT NULL COMMENT 'API接続先URL',
  `description` text DEFAULT NULL COMMENT 'API機能の説明文',
  `required_scopes` text DEFAULT NULL COMMENT '必要な権限スコープ（カンマ区切り）',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `api_settings`
--

INSERT INTO `api_settings` (`id`, `name`, `api_type`, `api_url`, `description`, `required_scopes`, `created_at`, `updated_at`) VALUES
(1, 'Google Calendar', 'google', 'https://www.googleapis.com/calendar/v3', 'Googleカレンダーとの連携', 'https://www.googleapis.com/auth/calendar.readonly', '2025-03-02 04:48:11', '2025-03-02 04:48:11'),
(2, 'Notion', 'notion', 'https://api.notion.com/v1', 'Notionとの連携', 'read,write', '2025-03-02 04:48:11', '2025-03-02 04:48:11'),
(3, 'Outlook Calendar', 'outlook', 'https://graph.microsoft.com/v1.0/me/calendar', 'Outlookカレンダーとの連携', 'Calendars.Read', '2025-03-02 04:48:11', '2025-03-02 04:48:11');

-- --------------------------------------------------------

--
-- テーブルの構造 `bulletin_board`
--

CREATE TABLE `bulletin_board` (
  `bulletin_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `created_by` varchar(5) NOT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `bulletin_reactions`
--

CREATE TABLE `bulletin_reactions` (
  `reaction_id` int(11) NOT NULL COMMENT 'リアクションID',
  `post_id` int(11) NOT NULL COMMENT '投稿ID（bulletin_board参照）',
  `student_id` varchar(5) NOT NULL COMMENT '学生ID',
  `reaction_type` varchar(20) NOT NULL COMMENT 'リアクションタイプ',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時',
  `bulletin_id` int(11) NOT NULL COMMENT '掲示板ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `bulletin_reactions`
--

INSERT INTO `bulletin_reactions` (`reaction_id`, `post_id`, `student_id`, `reaction_type`, `created_at`, `updated_at`, `bulletin_id`) VALUES
(16, 6, '20024', 'like', '2025-02-27 01:36:22', '2025-02-27 01:36:22', 0),
(19, 9, '20024', 'helpful', '2025-02-27 04:41:05', '2025-02-27 04:41:05', 0),
(21, 11, '20024', 'interesting', '2025-02-27 06:56:25', '2025-02-27 06:56:25', 0),
(24, 14, '20024', 'funny', '2025-03-02 17:20:18', '2025-03-02 17:20:18', 0),
(27, 15, '20033', 'agree', '2025-03-03 09:07:48', '2025-03-03 09:07:48', 0),
(28, 1, '20024', 'funny', '2025-03-03 15:40:43', '2025-03-03 15:40:43', 0),
(29, 15, '20024', 'agree', '2025-03-04 01:28:10', '2025-03-04 01:28:10', 0),
(32, 26, '20024', 'funny', '2025-03-04 04:46:04', '2025-03-04 04:46:04', 0),
(33, 27, '20024', 'helpful', '2025-03-05 11:01:29', '2025-03-05 11:01:29', 0),
(34, 27, '20024', 'funny', '2025-03-11 02:16:04', '2025-03-11 02:16:04', 0);

-- --------------------------------------------------------

--
-- テーブルの構造 `classrooms`
--

CREATE TABLE `classrooms` (
  `classroom_id` varchar(50) NOT NULL COMMENT '教室ID（ユニーク）',
  `floor` int(11) NOT NULL COMMENT '階数',
  `seating_capacity` int(11) NOT NULL COMMENT '収容人数',
  `room_type` varchar(255) NOT NULL DEFAULT 'normal' COMMENT '教室タイプ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `classrooms`
--

INSERT INTO `classrooms` (`classroom_id`, `floor`, `seating_capacity`, `room_type`, `created_at`, `updated_at`) VALUES
('101', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('102', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('103', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('104', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('105', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('106', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('107', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('108', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('109', 10, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('111', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('112', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('113', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('114', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('115', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('116', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('117', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('118', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('119', 11, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('121', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('122', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('123', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('124', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('125', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('126', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('127', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('128', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('129', 12, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('131', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('132', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('133', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('134', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('135', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('136', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('137', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('138', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('139', 13, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('141', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('142', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('143', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('144', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('145', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('146', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('147', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('148', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('149', 14, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('161', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('162', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('163', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('164', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('165', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('166', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('167', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('168', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('169', 16, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('171', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('172', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('173', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('174', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('175', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('176', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('177', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('178', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('179', 17, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('181', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('182', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('183', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('184', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('185', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('186', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('187', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('188', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('189', 18, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('191', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('192', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('193', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('194', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('195', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('196', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('197', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('198', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('199', 19, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('201', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('202', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('203', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('204', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('205', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('206', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('207', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('208', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('209', 20, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('211', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('212', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('213', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('214', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('215', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('216', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('217', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('218', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('219', 21, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('221', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('222', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('223', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('224', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('225', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('226', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('227', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('228', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('229', 22, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('231', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('232', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('233', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('234', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('235', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('236', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('237', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('238', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('239', 23, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('241', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('242', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('243', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('244', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('245', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('246', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('247', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('248', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('249', 24, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('261', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('262', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('263', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('264', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('265', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('266', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('267', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('268', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('269', 26, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('271', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('272', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('273', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('274', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('275', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('276', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('277', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('278', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('279', 27, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('281', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('282', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('283', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('284', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('285', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('286', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('287', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('288', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('289', 28, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('291', 29, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('292', 29, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('293', 29, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('294', 29, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('295', 29, 57, 'lecture', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('296', 29, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('297', 29, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('298', 29, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('299', 29, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('311', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('312', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('313', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('314', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('315', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('316', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('317', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('318', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('319', 31, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('321', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('322', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('323', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('324', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('325', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('326', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('327', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('328', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('329', 32, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('331', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('332', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('333', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('334', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('335', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('336', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('337', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('338', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('339', 33, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('341', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('342', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('343', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('344', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('345', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('346', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('347', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('348', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('349', 34, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('361', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('362', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('363', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('364', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('365', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('366', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('367', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('368', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('369', 36, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('371', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('372', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('373', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('374', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('375', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('376', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('377', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('378', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('379', 37, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('381', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('382', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('383', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('384', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('385', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('386', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('387', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('388', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('389', 38, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('391', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('392', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('393', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('394', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('395', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('396', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('397', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('398', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('399', 39, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('71', 7, 57, 'lecture', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('72', 7, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('73', 7, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('74', 7, 57, 'lecture', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('75', 7, 57, 'motion_capture', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('76', 7, 57, '3d_printer', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('77', 7, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('78', 7, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('79', 7, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('81', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('82', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('83', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('84', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('85', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('86', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('87', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('88', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('89', 8, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('91', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('92', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('93', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('94', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('95', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('96', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('97', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('98', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
('99', 9, 57, '', '2025-02-19 04:05:19', '2025-02-19 04:05:19');

-- --------------------------------------------------------

--
-- テーブルの構造 `course_master`
--

CREATE TABLE `course_master` (
  `course_id` int(11) NOT NULL COMMENT 'コースID（内部参照用）',
  `course_code` varchar(2) NOT NULL COMMENT 'コースコード（ユニーク）',
  `course_name` varchar(100) NOT NULL COMMENT 'コース名',
  `course_type` varchar(10) DEFAULT NULL COMMENT 'コースタイプ（例：4year, 2year）',
  `part_time_type` varchar(10) DEFAULT NULL COMMENT 'パートタイムタイプ（例：day, night）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `course_master`
--

INSERT INTO `course_master` (`course_id`, `course_code`, `course_name`, `course_type`, `part_time_type`) VALUES
(1, 'AT', 'ゲーム学科', '4year', 'day'),
(2, 'AD', 'ゲームデザイン学科', '4year', 'day'),
(3, 'CT', 'CGデザイン・アニメ学科', '4year', 'day'),
(4, 'VD', 'カーデザイン学科', '4year', 'day'),
(5, 'IH', '高度情報学科', '4year', 'day'),
(6, 'SE', 'ミュージック学科', '4year', 'day'),
(7, 'GP', 'ゲーム学科', '2year', 'day'),
(8, 'DG', 'CG学科', '2year', 'day'),
(9, 'PW', 'WEB学科', '2year', 'day'),
(10, 'PI', '情報処理学科', '2year', 'day'),
(11, 'MC', 'ミュージック学科', '2year', 'day'),
(12, 'NG', 'ゲーム学科', '2year', 'night'),
(13, 'NV', 'CG映像学科', '2year', 'night'),
(14, 'ND', 'グラフィックデザイン学科', '2year', 'night'),
(15, 'NW', 'WEBデザイン学科', '2year', 'night'),
(16, 'NN', 'ネットワーク学科', '2year', 'night'),
(17, 'NI', '情報処理学科', '2year', 'night');

-- --------------------------------------------------------

--
-- テーブルの構造 `diaries`
--

CREATE TABLE `diaries` (
  `diary_id` int(11) NOT NULL COMMENT '日記ID（ユニーク）',
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（students参照）',
  `title` varchar(100) NOT NULL COMMENT '日記タイトル',
  `content` text NOT NULL COMMENT '日記内容',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `diary_hashtags`
--

CREATE TABLE `diary_hashtags` (
  `diary_id` int(11) NOT NULL COMMENT '日記ID（diaries参照）',
  `hashtag_id` int(11) NOT NULL COMMENT 'ハッシュタグID（hashtags参照）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `diary_images`
--

CREATE TABLE `diary_images` (
  `image_id` int(11) NOT NULL COMMENT '画像ID（ユニーク）',
  `diary_id` int(11) NOT NULL COMMENT '日記ID（diaries参照）',
  `image_data` longblob NOT NULL COMMENT '画像データ（バイナリ）',
  `image_name` varchar(255) NOT NULL COMMENT '画像名',
  `mime_type` varchar(100) NOT NULL COMMENT 'MIMEタイプ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `empty_classrooms`
--

CREATE TABLE `empty_classrooms` (
  `empty_classroom_id` int(11) NOT NULL COMMENT '空き教室ID（ユニーク）',
  `classroom_id` varchar(50) NOT NULL COMMENT '教室番号（例: 201, 202など）',
  `date_info` date NOT NULL COMMENT '利用可能日（YYYY-MM-DD形式）',
  `period` enum('1','2','3','4','5','6','夜間') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `hashtags`
--

CREATE TABLE `hashtags` (
  `hashtag_id` int(11) NOT NULL COMMENT 'ハッシュタグID（ユニーク）',
  `tag_name` varchar(255) NOT NULL COMMENT 'タグ名',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `oauth_states`
--

CREATE TABLE `oauth_states` (
  `id` int(11) NOT NULL,
  `state` varchar(100) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `service` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `oauth_states`
--

INSERT INTO `oauth_states` (`id`, `state`, `user_id`, `service`, `created_at`, `expires_at`) VALUES
(1, 'uH0DtxCkmhaXMH1e9LNHxdWFWZbFd4', '20024', 'google', '2025-03-02 14:09:51', '2025-03-02 14:19:51'),
(2, '92v3sOx3lZJnzy2x4ISWGbsYuWJSEn', '20024', 'google', '2025-03-02 14:22:28', '2025-03-02 14:32:28'),
(11, 'tZUNppeNfK9myLCPOdSDqA75KorR7t', '20024', 'google', '2025-03-02 14:33:33', '2025-03-02 14:43:33');

-- --------------------------------------------------------

--
-- テーブルの構造 `public_users`
--

CREATE TABLE `public_users` (
  `user_id` int(11) NOT NULL COMMENT 'ユーザーID（ユニーク）',
  `username` varchar(50) NOT NULL COMMENT 'ユーザー名',
  `email` varchar(255) NOT NULL COMMENT 'メールアドレス',
  `password` varchar(255) NOT NULL COMMENT 'パスワード',
  `profile_image_path` varchar(255) DEFAULT NULL COMMENT 'プロフィール画像パス',
  `status` enum('active','suspended','deleted') NOT NULL DEFAULT 'active' COMMENT 'アカウント状態',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `reports`
--

CREATE TABLE `reports` (
  `report_id` int(11) NOT NULL COMMENT 'レポートID',
  `student_id` varchar(5) NOT NULL COMMENT '学生ID',
  `content` text NOT NULL COMMENT '内容',
  `image_paths` varchar(255) DEFAULT NULL COMMENT '画像パス',
  `video_paths` varchar(255) DEFAULT NULL COMMENT '動画パス',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `report_board`
--

CREATE TABLE `report_board` (
  `report_id` int(11) NOT NULL COMMENT '報告ID（ユニーク）',
  `student_id` varchar(5) DEFAULT NULL COMMENT '生徒ID（匿名の場合はNULL）',
  `content` text NOT NULL COMMENT '内容',
  `image_paths` varchar(255) DEFAULT NULL COMMENT '画像の相対パス（例：report_board/[report_id]/image1.jpg）',
  `video_paths` varchar(255) DEFAULT NULL COMMENT '動画の相対パス（例：report_board/[report_id]/video1.mp4）',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `specialization_master`
--

CREATE TABLE `specialization_master` (
  `specialization_id` int(3) UNSIGNED ZEROFILL NOT NULL COMMENT '専攻ID（ユニーク、ゼロフィル）',
  `course_id` int(11) NOT NULL COMMENT 'コースID（course_master参照）',
  `specialization_code` varchar(2) NOT NULL COMMENT '専攻コード',
  `specialization_name` varchar(100) NOT NULL COMMENT '専攻名',
  `grade` int(11) NOT NULL COMMENT '学年',
  `previous_specialization_id` int(3) UNSIGNED ZEROFILL DEFAULT NULL COMMENT '前の専攻ID（self-referencing）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `specialization_master`
--

INSERT INTO `specialization_master` (`specialization_id`, `course_id`, `specialization_code`, `specialization_name`, `grade`, `previous_specialization_id`) VALUES
(101, 1, 'AT', 'ゲーム', 1, NULL),
(102, 1, 'AT', 'ゲーム', 2, 101),
(103, 1, 'AT', 'ゲーム制作', 3, 102),
(104, 1, 'AP', 'ゲーム企画', 3, 102),
(105, 1, 'AT', 'VR・3Dゲームプログラマー', 4, 103),
(106, 1, 'AO', 'オンラインゲームプログラマー', 4, 103),
(107, 1, 'AM', 'スマートフォンゲームプログラマー', 4, 103),
(108, 1, 'AP', 'ゲームプランナー', 4, 104),
(109, 1, 'AS', 'ゲームシナリオライター', 4, 104),
(110, 1, 'AR', 'ゲームディレクター', 4, 104),
(111, 2, 'AD', 'ゲームデザイン', 1, NULL),
(112, 2, 'AD', 'ゲームデザイン', 2, 111),
(113, 2, 'AD', 'ゲームデザイン', 3, 112),
(114, 2, 'AD', 'ゲームデザイナー', 4, 113),
(115, 2, 'AC', '3Dキャラクターデザイナー', 4, 113),
(116, 2, 'AF', 'スマートフォンゲームデザイナー', 4, 113),
(117, 3, 'CG', 'CG', 1, NULL),
(118, 3, 'CG', 'CG', 2, 117),
(119, 3, 'CA', 'アニメーション', 2, 117),
(120, 3, 'CT', 'CG映像', 3, 118),
(121, 3, 'CG', 'グラフィックデザイン', 3, 118),
(122, 3, 'CI', 'イラスト', 3, 118),
(123, 3, 'CA', 'アニメーション', 3, 119),
(124, 3, 'CT', '3DCGクリエイター', 4, 120),
(125, 3, 'CV', 'VFXアーティスト', 4, 120),
(126, 3, 'CG', 'CGデザイナー', 4, 121),
(127, 3, 'CI', 'イラストレーター', 4, 122),
(128, 3, 'CA', 'アニメーター', 4, 123),
(129, 3, 'CD', 'デジタル作画', 4, 123),
(130, 4, 'VD', 'カーデザイン', 1, NULL),
(131, 4, 'VD', 'カーデザイン', 2, 130),
(132, 4, 'VM', 'カーモデラー', 2, 130),
(133, 4, 'VD', 'カーデザイン', 3, 131),
(134, 4, 'VM', 'カーモデラー', 3, 132),
(135, 4, 'VD', 'カーデザイナー', 4, 133),
(136, 4, 'VN', '次世代モビリティ開発', 4, 133),
(137, 4, 'VM', 'カーモデラー', 4, 134),
(138, 5, 'IT', 'IT', 1, NULL),
(139, 5, 'IH', '高度情報処理', 2, 138),
(140, 5, 'IA', 'AIシステム開発', 2, 138),
(141, 5, 'IH', '高度情報処理コース', 3, 139),
(142, 5, 'IW', 'WEB開発', 3, 139),
(143, 5, 'IA', 'AIシステム開発', 3, 140),
(144, 5, 'IH', '高度システムエンジニア', 4, 141),
(145, 5, 'IN', 'IoTネットワーク', 4, 141),
(146, 5, 'IS', 'サイバーセキュリティ', 4, 141),
(147, 5, 'IW', 'WEB開発エンジニア', 4, 142),
(148, 5, 'IM', 'スマートフォンアプリ開発', 4, 142),
(149, 5, 'ID', 'WEBデザイナー', 4, 142),
(150, 5, 'IA', 'AIエンジニア', 4, 143),
(151, 5, 'IR', '次世代ロボティクス', 4, 143),
(152, 5, 'IV', 'データサイエンス', 4, 143),
(153, 6, 'SE', 'ミュージック', 1, NULL),
(154, 6, 'SE', 'ミュージック', 2, 153),
(155, 6, 'SE', 'サウンドエンジニア', 3, 154),
(156, 6, 'SC', 'サウンドクリエイター', 3, 154),
(157, 6, 'SE', 'サウンドエンジニア', 4, 155),
(158, 6, 'SC', 'サウンドクリエイター', 4, 156),
(159, 6, 'SG', 'ゲームミュージック', 4, 156),
(160, 7, 'GP', 'ゲーム', 1, NULL),
(161, 7, 'GP', 'ゲームプログラム', 2, 160),
(162, 7, 'GC', 'キャラクターデザイン', 2, 160),
(163, 8, 'DG', 'CG', 1, NULL),
(164, 8, 'DA', 'CGアニメーション', 2, 163),
(165, 8, 'DG', 'CGデザイン', 2, 163),
(166, 9, 'PW', 'WEB', 1, NULL),
(167, 9, 'PW', 'WEBプログラム', 2, 166),
(168, 9, 'PD', 'WEBデザイン', 2, 166),
(169, 10, 'PI', '情報処理', 1, NULL),
(170, 10, 'PI', '情報処理プログラム', 2, 169),
(171, 10, 'PS', 'ネットワークセキュリティ', 2, 169),
(172, 11, 'MC', 'ミュージック', 1, NULL),
(173, 11, 'MC', 'コンピュータミュージック', 2, 172),
(174, 11, 'MR', 'PA.レコーディング', 2, 172),
(175, 12, 'NG', 'ゲーム', 1, NULL),
(176, 12, 'NG', 'ゲーム', 2, 175),
(177, 13, 'NV', 'CG映像', 1, NULL),
(178, 13, 'NV', 'CG映像', 2, 177),
(179, 14, 'ND', 'グラフィックデザイン', 1, NULL),
(180, 14, 'ND', 'グラフィックデザイン', 2, 179),
(181, 15, 'NW', 'WEBデザイン', 1, NULL),
(182, 15, 'NW', 'WEBデザイン', 2, 181),
(183, 16, 'NN', 'ネットワーク', 1, NULL),
(184, 16, 'NN', 'ネットワーク', 2, 183),
(185, 17, 'NI', '情報処理', 1, NULL),
(186, 17, 'NI', '情報処理', 2, 185);

-- --------------------------------------------------------

--
-- テーブルの構造 `students`
--

CREATE TABLE `students` (
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（ユニーク、学生が自分で入力）',
  `name` varchar(255) NOT NULL COMMENT '生徒名',
  `password` varchar(255) NOT NULL COMMENT 'パスワード',
  `email` varchar(255) NOT NULL COMMENT 'メールアドレス',
  `profile_image_path` varchar(255) DEFAULT NULL COMMENT '画像の相対パス（例：profiles/students/[student_id].jpg）',
  `enrollment_year` int(11) NOT NULL COMMENT '入学年',
  `enrollment_term` varchar(1) NOT NULL COMMENT '入学学期',
  `course_id` int(11) NOT NULL COMMENT 'コースID（course_master参照）',
  `current_grade` varchar(1) NOT NULL COMMENT '現在の学年',
  `specialization_id` int(3) UNSIGNED ZEROFILL DEFAULT NULL COMMENT '専攻ID（specialization_master参照）',
  `status` enum('active','leave','graduated','withdrawn') DEFAULT 'active' COMMENT 'ステータス',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `students`
--

INSERT INTO `students` (`student_id`, `name`, `password`, `email`, `profile_image_path`, `enrollment_year`, `enrollment_term`, `course_id`, `current_grade`, `specialization_id`, `status`, `created_at`, `updated_at`) VALUES
('20024', '小林 和真', 'scrypt:32768:8:1$xFBXrH6PWibcLzOQ$df188309ba20fd95384b8c4c350c9eedb090ebb61f7deea33ddb6bc2d4a9563b99ff8ff75b795809e7bb4105b82b56d350fd71a2fbb54f39835245b83a0a2bc2', 'arkeuce69@gmail.com', 'profiles\\students\\20250224_173219_20024___2.jpg', 2020, '1', 5, '3', 141, 'active', '2025-02-24 08:32:20', '2025-02-24 08:32:20');
-- --------------------------------------------------------

--
-- テーブルの構造 `student_api_connections`
--

CREATE TABLE `student_api_connections` (
  `id` int(11) NOT NULL COMMENT '接続設定の一意識別子',
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（studentsテーブル参照）',
  `api_setting_id` int(11) NOT NULL COMMENT 'API設定ID（api_settingsテーブル参照）',
  `access_token` text DEFAULT NULL COMMENT 'OAuth認証用アクセストークン',
  `refresh_token` text DEFAULT NULL COMMENT 'トークン更新用リフレッシュトークン',
  `token_expires_at` datetime DEFAULT NULL COMMENT 'アクセストークンの有効期限',
  `api_key` varchar(255) DEFAULT NULL COMMENT 'APIキー（Notion等で使用）',
  `account_email` varchar(255) DEFAULT NULL COMMENT '連携したアカウントのメールアドレス',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '接続の有効/無効状態',
  `last_sync_datetime` datetime DEFAULT NULL COMMENT '最後に同期した日時',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `student_auth`
--

CREATE TABLE `student_auth` (
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（students参照）',
  `password_hash` varchar(255) NOT NULL COMMENT 'パスワードハッシュ',
  `last_login` datetime DEFAULT NULL COMMENT '最終ログイン日時',
  `login_attempts` int(11) DEFAULT NULL COMMENT 'ログイン試行回数',
  `is_locked` tinyint(1) DEFAULT NULL COMMENT 'アカウントロックフラグ',
  `reset_token` varchar(100) DEFAULT NULL COMMENT 'パスワードリセットトークン',
  `reset_token_expires` datetime DEFAULT NULL COMMENT 'トークン有効期限',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `student_contacts`
--

CREATE TABLE `student_contacts` (
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（students参照）',
  `phone` varchar(20) DEFAULT NULL COMMENT '電話番号',
  `emergency_contact` varchar(255) DEFAULT NULL COMMENT '緊急連絡先',
  `emergency_phone` varchar(20) DEFAULT NULL COMMENT '緊急連絡先電話番号',
  `address` varchar(255) DEFAULT NULL COMMENT '住所',
  `postal_code` varchar(8) DEFAULT NULL COMMENT '郵便番号',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `student_personal_schedules`
--

CREATE TABLE `student_personal_schedules` (
  `schedule_id` int(11) NOT NULL COMMENT 'スケジュールID（ユニーク）',
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（students参照）',
  `title` varchar(255) NOT NULL COMMENT 'タイトル',
  `description` text DEFAULT NULL COMMENT '説明',
  `start_time` datetime NOT NULL COMMENT '開始時間',
  `end_time` datetime NOT NULL COMMENT '終了時間',
  `is_private` tinyint(1) DEFAULT 1 COMMENT 'プライベートフラグ（1: 非公開、0: 公開）',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時',
  `location` varchar(255) DEFAULT NULL COMMENT '場所'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `student_profiles`
--

CREATE TABLE `student_profiles` (
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（students参照）',
  `profile_image_path` varchar(255) DEFAULT NULL COMMENT 'プロフィール画像パス',
  `bio` text DEFAULT NULL COMMENT '自己紹介',
  `interests` text DEFAULT NULL COMMENT '興味・関心',
  `skills` text DEFAULT NULL COMMENT 'スキル',
  `github_url` varchar(255) DEFAULT NULL COMMENT 'GitHubのURL',
  `portfolio_url` varchar(255) DEFAULT NULL COMMENT 'ポートフォリオのURL',
  `is_public` tinyint(1) DEFAULT NULL COMMENT '公開フラグ',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `student_reviews`
--

CREATE TABLE `student_reviews` (
  `id` int(11) NOT NULL,
  `student_id` varchar(5) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `student_schedules`
--

CREATE TABLE `student_schedules` (
  `schedule_id` int(11) NOT NULL COMMENT 'スケジュールID（ユニーク）',
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（students参照）',
  `subject_name` varchar(255) NOT NULL COMMENT '科目名',
  `teacher_id` int(11) NOT NULL COMMENT '担当教員ID（teachers参照）',
  `classroom_id` varchar(50) DEFAULT NULL COMMENT '教室ID（classrooms参照）',
  `day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL COMMENT '曜日',
  `period` enum('1限','2限','3限','4限','5限','6限') NOT NULL COMMENT '時間帯',
  `schedule_file_url` varchar(255) DEFAULT NULL COMMENT 'スケジュールファイルパス',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時',
  `content` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `student_security_questions`
--

CREATE TABLE `student_security_questions` (
  `id` int(11) NOT NULL,
  `student_id` varchar(20) NOT NULL,
  `question` varchar(255) NOT NULL,
  `answer_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `student_security_questions`
--

INSERT INTO `student_security_questions` (`id`, `student_id`, `question`, `answer_hash`, `created_at`, `updated_at`) VALUES
(1, '20024', '好きなジュースは？', 'scrypt:32768:8:1$R3YXO3IwkUBSdYoD$719ebd47134d3183c3d8c28827ff71f5c25c88e100ebc4229ecb696d50acc20a827ae8a12267e1968764e33278074aa56498b24828ce5f3c6e510ee2dbba4aa0', '2025-02-28 10:55:17', '2025-02-28 10:55:17');

-- --------------------------------------------------------

--
-- テーブルの構造 `system_config`
--

CREATE TABLE `system_config` (
  `config_id` int(11) NOT NULL COMMENT '設定ID（ユニーク）',
  `key` varchar(255) NOT NULL COMMENT '設定キー',
  `value` text NOT NULL COMMENT '設定値',
  `description` text DEFAULT NULL COMMENT '説明',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `tasks`
--

CREATE TABLE `tasks` (
  `task_id` int(11) NOT NULL COMMENT 'タスクID（ユニーク）',
  `student_id` varchar(5) NOT NULL COMMENT '生徒ID（students参照）',
  `content` text NOT NULL COMMENT 'タスク内容',
  `is_completed` tinyint(1) DEFAULT 0 COMMENT '完了フラグ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `teachers`
--

CREATE TABLE `teachers` (
  `teacher_id` int(11) NOT NULL COMMENT '教師ID（ユニーク）',
  `name` varchar(255) NOT NULL COMMENT '教師名',
  `password` varchar(255) NOT NULL COMMENT 'パスワード',
  `email` varchar(255) NOT NULL COMMENT 'メールアドレス',
  `profile_image_path` varchar(255) DEFAULT NULL COMMENT '画像の相対パス（例：profiles/teachers/[teacher_id].jpg）',
  `comment` varchar(255) DEFAULT NULL COMMENT 'コメント',
  `is_admin` tinyint(1) NOT NULL DEFAULT 0 COMMENT '管理者フラグ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '作成日時',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新日時'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `teachers`
--

INSERT INTO `teachers` (`teacher_id`, `name`, `password`, `email`, `profile_image_path`, `comment`, `is_admin`, `created_at`, `updated_at`) VALUES
(83, '山尻善次', 'password11', 'yoshiji.yamajiri@hal.ac.jp', 'https://example.com/yoshiji.yamajiri.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(84, '山口愛理', 'password84', 'airi.yamaguchi@hal.ac.jp', 'https://example.com/airi.yamaguchi.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(85, '中村誠', 'password85', 'makoto.nakamura@hal.ac.jp', 'https://example.com/makoto.nakamura.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(86, '木谷迅市', 'password86', 'jinji.kitani@hal.ac.jp', 'https://example.com/jinji.kitani.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(87, '木口有明', 'password87', 'ariake.kiguchi@hal.ac.jp', 'https://example.com/ariake.kiguchi.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(88, '松山江理子', 'password88', 'eriko.matsuyama@hal.ac.jp', 'https://example.com/eriko.matsuyama.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(89, '加原和広', 'password89', 'kazuhiro.kahara@hal.ac.jp', 'https://example.com/kazuhiro.kahara.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(90, '青岩直人', 'password90', 'naoto.aoiwa@hal.ac.jp', 'https://example.com/naoto.aoiwa.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(91, '西海林宏', 'password91', 'hiroshi.nishikailin@hal.ac.jp', 'https://example.com/hiroshi.nishikailin.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(92, '上屋敷海都', 'password92', 'kaito.kamiyashiki@hal.ac.jp', 'https://example.com/kaito.kamiyashiki.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(93, '森水一明', 'password93', 'kazuaki.morimizu@hal.ac.jp', 'https://example.com/kazuaki.morimizu.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(94, '加藤洋平', 'password94', 'yohei.kato@hal.ac.jp', 'https://example.com/yohei.kato.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(95, '加藤聖子', 'password95', 'seiko.kato@hal.ac.jp', 'https://example.com/seiko.kato.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(96, '加藤一誠', 'password96', 'issei.kato@hal.ac.jp', 'https://example.com/issei.kato.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(97, '北坂貴紀', 'password97', 'takanori.kitasaka@hal.ac.jp', 'https://example.com/takanori.kitasaka.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(98, '伊藤吾郎', 'password98', 'goro.ito@hal.ac.jp', 'https://example.com/goro.ito.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(99, '伊藤淳生', 'password99', 'atsuo.ito@hal.ac.jp', 'https://example.com/atsuo.ito.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(100, '小林啓三', 'password100', 'keizo.kobayashi@hal.ac.jp', 'https://example.com/keizo.kobayashi.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(101, '小林明彦', 'password101', 'akihiko.kobayashi@hal.ac.jp', 'https://example.com/akihiko.kobayashi.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(102, '森池義明', 'password102', 'yoshiaki.moriike@hal.ac.jp', 'https://example.com/yoshiaki.moriike.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(103, '金平光男', 'password103', 'mitsuo.kanehira@hal.ac.jp', 'https://example.com/mitsuo.kanehira.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(104, '大山登志', 'password104', 'toshi.oyama@hal.ac.jp', 'https://example.com/toshi.oyama.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(105, '森畑幸一', 'password105', 'kouichi.morihata@hal.ac.jp', 'https://example.com/kouichi.morihata.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(106, '松木良介', 'password106', 'ryosuke.matsuki@hal.ac.jp', 'https://example.com/ryosuke.matsuki.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(107, '中野建二', 'password107', 'kenji.nakano@hal.ac.jp', 'https://example.com/kenji.nakano.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(108, '木永鉄平', 'password108', 'teppei.kinaga@hal.ac.jp', 'https://example.com/teppei.kinaga.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(109, '松山司郎', 'password109', 'shiro.matsuyama@hal.ac.jp', 'https://example.com/shiro.matsuyama.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(110, '森田広信', 'password110', 'hironobu.morita@hal.ac.jp', 'https://example.com/hironobu.morita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(111, '学務部', 'password111', 'gakumu@hal.ac.jp', 'https://example.com/gakumu.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(112, '佐辺優太', 'password112', 'yuta.sabe@hal.ac.jp', 'https://example.com/yuta.sabe.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(113, '山岡元子', 'password113', 'motoko.yamaoka@hal.ac.jp', 'https://example.com/motoko.yamaoka.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(114, '森田大輝', 'password114', 'daiki.morita@hal.ac.jp', 'https://example.com/daiki.morita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(115, '山井聖司', 'password115', 'seiji.yamai@hal.ac.jp', 'https://example.com/seiji.yamai.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(116, '佐瀬克磨', 'password116', 'katsuma.sase@hal.ac.jp', 'https://example.com/katsuma.sase.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(117, '中島容子', 'password117', 'yoko.nakajima@hal.ac.jp', 'https://example.com/yoko.nakajima.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(118, '野上論志', 'password118', 'ronji.nogami@hal.ac.jp', 'https://example.com/ronji.nogami.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(119, '野上佐知子', 'password119', 'sachiko.nogami@hal.ac.jp', 'https://example.com/sachiko.nogami.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(120, '森橋優平', 'password120', 'yuhei.morihashi@hal.ac.jp', 'https://example.com/yuhei.morihashi.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(121, '松本祥世', 'password121', 'sachiyo.matsumoto@hal.ac.jp', 'https://example.com/sachiyo.matsumoto.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(122, '田井夏実', 'password122', 'natsumi.tai@hal.ac.jp', 'https://example.com/natsumi.tai.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(123, '森田篤志', 'password123', 'atsushi.morita@hal.ac.jp', 'https://example.com/atsushi.morita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(124, '田井健一郎', 'password124', 'kenichiro.tai@hal.ac.jp', 'https://example.com/kenichiro.tai.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(125, '中沢郁生', 'password125', 'ikuo.nakazawa@hal.ac.jp', 'https://example.com/ikuo.nakazawa.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(126, '山本大貴', 'password126', 'hiroki.yamamoto@hal.ac.jp', 'https://example.com/hiroki.yamamoto.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(127, '中村奈美', 'password127', 'nami.nakamura@hal.ac.jp', 'https://example.com/nami.nakamura.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(128, '川口俊彦', 'password128', 'toshihiko.kawaguchi@hal.ac.jp', 'https://example.com/toshihiko.kawaguchi.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(129, '川口俊介', 'password129', 'shunsuke.kawaguchi@hal.ac.jp', 'https://example.com/shunsuke.kawaguchi.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(130, '伊藤則明', 'password130', 'noriaki.ito@hal.ac.jp', 'https://example.com/noriaki.ito.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(131, '山岡高明', 'password131', 'takaaki.yamaoka@hal.ac.jp', 'https://example.com/takaaki.yamaoka.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(132, '前田和希', 'password132', 'kazuki.maeda@hal.ac.jp', 'https://example.com/kazuki.maeda.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(133, '田居秀顕', 'password133', 'hideaki.tai@hal.ac.jp', 'https://example.com/hideaki.tai.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(134, '田留孝行', 'password134', 'takayuki.tadome@hal.ac.jp', 'https://example.com/takayuki.tadome.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(135, '佐崎勝也', 'password135', 'katsuya.sasaki@hal.ac.jp', 'https://example.com/katsuya.sasaki.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(136, '佐者直也', 'password136', 'naoya.sasha@hal.ac.jp', 'https://example.com/naoya.sasha.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(137, '橋本隆弘', 'password137', 'takahiro.hashimoto@hal.ac.jp', 'https://example.com/takahiro.hashimoto.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(138, '木下里実', 'password138', 'satomi.kinoshita@hal.ac.jp', 'https://example.com/satomi.kinoshita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(139, '山下真一郎', 'password139', 'shinichiro.yamashita@hal.ac.jp', 'https://example.com/shinichiro.yamashita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(140, '佐崎雅俊', 'password140', 'masatoshi.sasaki@hal.ac.jp', 'https://example.com/masatoshi.sasaki.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(141, '木下美香', 'password141', 'mika.kinoshita@hal.ac.jp', 'https://example.com/mika.kinoshita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(142, '森田卓也', 'password142', 'takuya.morita@hal.ac.jp', 'https://example.com/takuya.morita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(143, '伊藤美環', 'password143', 'mika.ito@hal.ac.jp', 'https://example.com/mika.ito.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(144, '伊藤智也', 'password144', 'tomoya.ito@hal.ac.jp', 'https://example.com/tomoya.ito.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(145, '伊藤達哉', 'password145', 'tatsuya.ito@hal.ac.jp', 'https://example.com/tatsuya.ito.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(146, '山下公德', 'password146', 'kiminori.yamashita@hal.ac.jp', 'https://example.com/kiminori.yamashita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(147, '森田高広', 'password147', 'takahiro.morita@hal.ac.jp', 'https://example.com/takahiro.morita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(148, '戸田琢郎', 'password148', 'takuro.toda@hal.ac.jp', 'https://example.com/takuro.toda.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(149, '浦田拓也', 'password149', 'takuya.urata@hal.ac.jp', 'https://example.com/takuya.urata.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(150, '内田祐樹', 'password150', 'yuki.uchida@hal.ac.jp', 'https://example.com/yuki.uchida.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(151, '木下祐美', 'password151', 'yumi.kinoshita@hal.ac.jp', 'https://example.com/yumi.kinoshita.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(152, '荒井順一', 'password152', 'junichi.arai@hal.ac.jp', 'https://example.com/junichi.arai.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19'),
(153, '久保将志', 'password153', 'masashi.kubo@hal.ac.jp', 'https://example.com/masashi.kubo.jpg', 'helloworld!', 1, '2025-02-19 04:05:19', '2025-02-19 04:05:19');

-- --------------------------------------------------------

--
-- テーブルの構造 `verification_questions`
--

CREATE TABLE `verification_questions` (
  `id` int(11) NOT NULL,
  `question_text` varchar(255) NOT NULL,
  `options` text NOT NULL,
  `correct_answer` varchar(255) NOT NULL,
  `difficulty` varchar(20) DEFAULT 'normal',
  `active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- テーブルのデータのダンプ `verification_questions`
--

INSERT INTO `verification_questions` (`id`, `question_text`, `options`, `correct_answer`, `difficulty`, `active`, `created_at`, `updated_at`) VALUES
(5, 'コクーンタワー内でAEDが設置されているフロアは次のうち,どれ', '[\"31F\",\"27F\",\"16F\",\"8F\"]', '1', 'normal', 1, '2025-03-12 12:05:45', '2025-03-12 12:05:45'),
(6, 'コクーンタワー内でどのエレベータでも止まるフロアは次のうちどれ？', '[\"30F\",\"27F\",\"24F\",\"21F\"]', '0', 'easy', 1, '2025-03-12 12:05:45', '2025-03-12 12:05:45'),
(7, 'コクーンタワー内で落とし物が見つかった。適切な行動は次のうちどれ？', '[\"ネコババする。\",\"学生カウンターの受付の人に渡す。\",\"中古ショップで売る。\",\"インターネットに上げる。\"]', '1', 'easy', 1, '2025-03-12 12:05:45', '2025-03-12 12:05:45'),
(8, '進級制作展にて学校から指定されているプレゼンボードのサイズは次のうちどれ？(2025年時点）', '[\"A4\",\"A3\",\"B4\",\"B3\"]', '1', 'normal', 1, '2025-03-12 12:05:45', '2025-03-12 12:05:45');

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admin_id` (`admin_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- テーブルのインデックス `alembic_version`
--
ALTER TABLE `alembic_version`
  ADD PRIMARY KEY (`version_num`);

--
-- テーブルのインデックス `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`announcement_id`),
  ADD KEY `fk_announcement_teacher` (`created_by`);

--
-- テーブルのインデックス `api_settings`
--
ALTER TABLE `api_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_api_type` (`api_type`);

--
-- テーブルのインデックス `bulletin_board`
--
ALTER TABLE `bulletin_board`
  ADD PRIMARY KEY (`bulletin_id`),
  ADD KEY `fk_bulletin_student` (`created_by`),
  ADD KEY `fk_bulletin_teacher` (`approved_by`);

--
-- テーブルのインデックス `bulletin_reactions`
--
ALTER TABLE `bulletin_reactions`
  ADD PRIMARY KEY (`reaction_id`),
  ADD UNIQUE KEY `unique_reaction` (`post_id`,`student_id`,`reaction_type`),
  ADD KEY `fk_reaction_student` (`student_id`);

--
-- テーブルのインデックス `classrooms`
--
ALTER TABLE `classrooms`
  ADD PRIMARY KEY (`classroom_id`);

--
-- テーブルのインデックス `course_master`
--
ALTER TABLE `course_master`
  ADD PRIMARY KEY (`course_id`),
  ADD UNIQUE KEY `course_code` (`course_code`);

--
-- テーブルのインデックス `diaries`
--
ALTER TABLE `diaries`
  ADD PRIMARY KEY (`diary_id`),
  ADD KEY `fk_diary_student` (`student_id`);

--
-- テーブルのインデックス `diary_hashtags`
--
ALTER TABLE `diary_hashtags`
  ADD PRIMARY KEY (`diary_id`,`hashtag_id`),
  ADD KEY `fk_diary_hashtag_hashtag` (`hashtag_id`);

--
-- テーブルのインデックス `diary_images`
--
ALTER TABLE `diary_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `fk_diary_image_diary` (`diary_id`);

--
-- テーブルのインデックス `empty_classrooms`
--
ALTER TABLE `empty_classrooms`
  ADD PRIMARY KEY (`empty_classroom_id`),
  ADD UNIQUE KEY `unique_empty_classroom` (`classroom_id`,`date_info`,`period`);

--
-- テーブルのインデックス `hashtags`
--
ALTER TABLE `hashtags`
  ADD PRIMARY KEY (`hashtag_id`),
  ADD UNIQUE KEY `tag_name` (`tag_name`);

--
-- テーブルのインデックス `oauth_states`
--
ALTER TABLE `oauth_states`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `state` (`state`);

--
-- テーブルのインデックス `public_users`
--
ALTER TABLE `public_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- テーブルのインデックス `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `student_id` (`student_id`);

--
-- テーブルのインデックス `report_board`
--
ALTER TABLE `report_board`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `fk_report_student` (`student_id`);

--
-- テーブルのインデックス `specialization_master`
--
ALTER TABLE `specialization_master`
  ADD PRIMARY KEY (`specialization_id`),
  ADD UNIQUE KEY `unique_specialization` (`course_id`,`specialization_code`,`grade`),
  ADD KEY `fk_specialization_previous` (`previous_specialization_id`);

--
-- テーブルのインデックス `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_student_course` (`course_id`),
  ADD KEY `fk_student_specialization` (`specialization_id`);

--
-- テーブルのインデックス `student_api_connections`
--
ALTER TABLE `student_api_connections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_api` (`student_id`,`api_setting_id`);

--
-- テーブルのインデックス `student_auth`
--
ALTER TABLE `student_auth`
  ADD PRIMARY KEY (`student_id`);

--
-- テーブルのインデックス `student_contacts`
--
ALTER TABLE `student_contacts`
  ADD PRIMARY KEY (`student_id`);

--
-- テーブルのインデックス `student_personal_schedules`
--
ALTER TABLE `student_personal_schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `fk_personal_schedule_student` (`student_id`);

--
-- テーブルのインデックス `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD PRIMARY KEY (`student_id`);

--
-- テーブルのインデックス `student_reviews`
--
ALTER TABLE `student_reviews`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `student_schedules`
--
ALTER TABLE `student_schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD UNIQUE KEY `unique_schedule` (`student_id`,`day`,`period`),
  ADD KEY `fk_schedule_teacher` (`teacher_id`),
  ADD KEY `fk_schedule_classroom` (`classroom_id`);

--
-- テーブルのインデックス `student_security_questions`
--
ALTER TABLE `student_security_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- テーブルのインデックス `system_config`
--
ALTER TABLE `system_config`
  ADD PRIMARY KEY (`config_id`),
  ADD UNIQUE KEY `key` (`key`);

--
-- テーブルのインデックス `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`task_id`),
  ADD KEY `fk_task_student` (`student_id`);

--
-- テーブルのインデックス `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`teacher_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- テーブルのインデックス `verification_questions`
--
ALTER TABLE `verification_questions`
  ADD PRIMARY KEY (`id`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `announcements`
--
ALTER TABLE `announcements`
  MODIFY `announcement_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `api_settings`
--
ALTER TABLE `api_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'API設定の一意識別子', AUTO_INCREMENT=5;

--
-- テーブルの AUTO_INCREMENT `bulletin_board`
--
ALTER TABLE `bulletin_board`
  MODIFY `bulletin_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `bulletin_reactions`
--
ALTER TABLE `bulletin_reactions`
  MODIFY `reaction_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'リアクションID', AUTO_INCREMENT=35;

--
-- テーブルの AUTO_INCREMENT `course_master`
--
ALTER TABLE `course_master`
  MODIFY `course_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'コースID（内部参照用）', AUTO_INCREMENT=18;

--
-- テーブルの AUTO_INCREMENT `diaries`
--
ALTER TABLE `diaries`
  MODIFY `diary_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '日記ID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `diary_images`
--
ALTER TABLE `diary_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '画像ID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `empty_classrooms`
--
ALTER TABLE `empty_classrooms`
  MODIFY `empty_classroom_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '空き教室ID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `hashtags`
--
ALTER TABLE `hashtags`
  MODIFY `hashtag_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ハッシュタグID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `oauth_states`
--
ALTER TABLE `oauth_states`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- テーブルの AUTO_INCREMENT `public_users`
--
ALTER TABLE `public_users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ユーザーID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `reports`
--
ALTER TABLE `reports`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'レポートID';

--
-- テーブルの AUTO_INCREMENT `report_board`
--
ALTER TABLE `report_board`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '報告ID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `specialization_master`
--
ALTER TABLE `specialization_master`
  MODIFY `specialization_id` int(3) UNSIGNED ZEROFILL NOT NULL AUTO_INCREMENT COMMENT '専攻ID（ユニーク、ゼロフィル）', AUTO_INCREMENT=187;

--
-- テーブルの AUTO_INCREMENT `student_api_connections`
--
ALTER TABLE `student_api_connections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '接続設定の一意識別子';

--
-- テーブルの AUTO_INCREMENT `student_personal_schedules`
--
ALTER TABLE `student_personal_schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'スケジュールID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `student_reviews`
--
ALTER TABLE `student_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `student_schedules`
--
ALTER TABLE `student_schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'スケジュールID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `student_security_questions`
--
ALTER TABLE `student_security_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- テーブルの AUTO_INCREMENT `system_config`
--
ALTER TABLE `system_config`
  MODIFY `config_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '設定ID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `tasks`
--
ALTER TABLE `tasks`
  MODIFY `task_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'タスクID（ユニーク）';

--
-- テーブルの AUTO_INCREMENT `teachers`
--
ALTER TABLE `teachers`
  MODIFY `teacher_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '教師ID（ユニーク）', AUTO_INCREMENT=155;

--
-- テーブルの AUTO_INCREMENT `verification_questions`
--
ALTER TABLE `verification_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `fk_announcement_teacher` FOREIGN KEY (`created_by`) REFERENCES `teachers` (`teacher_id`);

--
-- テーブルの制約 `bulletin_board`
--
ALTER TABLE `bulletin_board`
  ADD CONSTRAINT `fk_bulletin_student` FOREIGN KEY (`created_by`) REFERENCES `students` (`student_id`),
  ADD CONSTRAINT `fk_bulletin_teacher` FOREIGN KEY (`approved_by`) REFERENCES `teachers` (`teacher_id`);

--
-- テーブルの制約 `bulletin_reactions`
--
ALTER TABLE `bulletin_reactions`
  ADD CONSTRAINT `fk_reaction_post` FOREIGN KEY (`post_id`) REFERENCES `bulletin_board` (`bulletin_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reaction_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `diaries`
--
ALTER TABLE `diaries`
  ADD CONSTRAINT `fk_diary_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `diary_hashtags`
--
ALTER TABLE `diary_hashtags`
  ADD CONSTRAINT `fk_diary_hashtag_diary` FOREIGN KEY (`diary_id`) REFERENCES `diaries` (`diary_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_diary_hashtag_hashtag` FOREIGN KEY (`hashtag_id`) REFERENCES `hashtags` (`hashtag_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `diary_images`
--
ALTER TABLE `diary_images`
  ADD CONSTRAINT `fk_diary_image_diary` FOREIGN KEY (`diary_id`) REFERENCES `diaries` (`diary_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `empty_classrooms`
--
ALTER TABLE `empty_classrooms`
  ADD CONSTRAINT `empty_classrooms_ibfk_1` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- テーブルの制約 `report_board`
--
ALTER TABLE `report_board`
  ADD CONSTRAINT `fk_report_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE SET NULL;

--
-- テーブルの制約 `specialization_master`
--
ALTER TABLE `specialization_master`
  ADD CONSTRAINT `fk_specialization_course` FOREIGN KEY (`course_id`) REFERENCES `course_master` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_specialization_previous` FOREIGN KEY (`previous_specialization_id`) REFERENCES `specialization_master` (`specialization_id`) ON DELETE SET NULL;

--
-- テーブルの制約 `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_student_course` FOREIGN KEY (`course_id`) REFERENCES `course_master` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_student_specialization` FOREIGN KEY (`specialization_id`) REFERENCES `specialization_master` (`specialization_id`) ON DELETE SET NULL;

--
-- テーブルの制約 `student_auth`
--
ALTER TABLE `student_auth`
  ADD CONSTRAINT `student_auth_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `student_contacts`
--
ALTER TABLE `student_contacts`
  ADD CONSTRAINT `student_contacts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `student_personal_schedules`
--
ALTER TABLE `student_personal_schedules`
  ADD CONSTRAINT `fk_personal_schedule_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `student_profiles`
--
ALTER TABLE `student_profiles`
  ADD CONSTRAINT `student_profiles_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `student_schedules`
--
ALTER TABLE `student_schedules`
  ADD CONSTRAINT `fk_schedule_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`classroom_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_schedule_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_schedule_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `student_security_questions`
--
ALTER TABLE `student_security_questions`
  ADD CONSTRAINT `student_security_questions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- テーブルの制約 `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_task_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
