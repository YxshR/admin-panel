# Requirements Document

## Introduction

This project involves building a full-stack web application for an AI reels platform called "logoipsum". The application consists of a public-facing website showcasing AI reels with filtering capabilities and a secure admin panel for content management. The platform allows visitors to browse and order AI reels while providing administrators with complete CRUD operations for managing reels and slider content.

## Requirements

### Requirement 1

**User Story:** As a visitor, I want to view a public website with AI reels, so that I can browse available content and place orders.

#### Acceptance Criteria

1. WHEN a visitor accesses the homepage THEN the system SHALL display a hero banner with branding
2. WHEN a visitor views the homepage THEN the system SHALL show a WhatsApp call-to-action button
3. WHEN a visitor accesses the reels section THEN the system SHALL display category filters (All, Clothing, Branding, Fashion)
4. WHEN a visitor selects a category filter THEN the system SHALL show only reels matching that category
5. WHEN a visitor views reels THEN the system SHALL display them in a responsive grid layout with thumbnails
6. WHEN a visitor views a reel THEN the system SHALL show an "Order Now" button for each reel
7. WHEN a visitor scrolls to the bottom THEN the system SHALL display an image slider section

### Requirement 2

**User Story:** As a visitor, I want to interact with reels and contact options, so that I can place orders and get in touch.

#### Acceptance Criteria

1. WHEN a visitor clicks "Order Now" on a reel THEN the system SHALL initiate a contact or ordering process
2. WHEN a visitor clicks the WhatsApp button THEN the system SHALL open WhatsApp with a pre-filled message
3. WHEN a visitor views the image slider THEN the system SHALL display a heading, subheading, and rotating images
4. WHEN a visitor accesses the site on mobile THEN the system SHALL display a fully responsive layout
5. WHEN a visitor accesses the site on desktop THEN the system SHALL match the Figma designs pixel-perfectly

### Requirement 3

**User Story:** As an administrator, I want to securely log into an admin panel, so that I can manage the platform content.

#### Acceptance Criteria

1. WHEN an admin accesses the admin login page THEN the system SHALL display email and password fields
2. WHEN an admin enters valid credentials THEN the system SHALL authenticate and redirect to the dashboard
3. WHEN an admin enters invalid credentials THEN the system SHALL display an error message
4. WHEN an admin is not logged in THEN the system SHALL prevent access to admin routes
5. WHEN an admin session expires THEN the system SHALL redirect to the login page
6. IF an admin checks "Remember Me" THEN the system SHALL maintain the session for an extended period

### Requirement 4

**User Story:** As an administrator, I want to manage AI reels, so that I can add, edit, and remove content from the platform.

#### Acceptance Criteria

1. WHEN an admin accesses the reels management section THEN the system SHALL display all existing reels
2. WHEN an admin clicks "Add Reel" THEN the system SHALL show a form with fields for reel link, category selection, and thumbnail upload
3. WHEN an admin uploads a thumbnail THEN the system SHALL store the image and display a preview
4. WHEN an admin selects categories THEN the system SHALL allow multiple selections from Clothing, Branding, and Fashion
5. WHEN an admin saves a new reel THEN the system SHALL add it to the database and display it in the list
6. WHEN an admin clicks edit on a reel THEN the system SHALL populate the form with existing data
7. WHEN an admin clicks delete on a reel THEN the system SHALL remove it from the database after confirmation
8. WHEN an admin views added reels THEN the system SHALL display them with thumbnail, title, category, and action buttons

### Requirement 5

**User Story:** As an administrator, I want to manage the image slider content, so that I can update the promotional section of the website.

#### Acceptance Criteria

1. WHEN an admin accesses slider management THEN the system SHALL display current slider settings
2. WHEN an admin edits the slider heading THEN the system SHALL update the text displayed on the public site
3. WHEN an admin edits the slider subheading THEN the system SHALL update the subtext displayed on the public site
4. WHEN an admin uploads slider images THEN the system SHALL store them and display them in the slider
5. WHEN an admin removes a slider image THEN the system SHALL delete it from storage and the slider
6. WHEN an admin reorders slider images THEN the system SHALL update the display sequence

### Requirement 6

**User Story:** As a developer, I want the application to use modern technologies and be deployable, so that it meets current web standards and can be hosted reliably.

#### Acceptance Criteria

1. WHEN the application is built THEN the system SHALL use Next.js 14 with App Router
2. WHEN the application is developed THEN the system SHALL use TypeScript for type safety
3. WHEN the application is styled THEN the system SHALL use Tailwind CSS for responsive design
4. WHEN the application stores data THEN the system SHALL use Prisma ORM with PostgreSQL database
5. WHEN the application handles images THEN the system SHALL store and serve them efficiently
6. WHEN the application is deployed THEN the system SHALL be hosted on Vercel with a live URL
7. WHEN the code is shared THEN the system SHALL include a public GitHub repository with clear README and seed credentials

### Requirement 7

**User Story:** As a developer, I want all testing files organized in a dedicated folder structure, so that tests are easily maintainable and discoverable.

#### Acceptance Criteria

1. WHEN tests are created THEN the system SHALL organize all test files in a dedicated `__tests__` or `tests` folder
2. WHEN unit tests are written THEN the system SHALL place them in the centralized testing directory
3. WHEN integration tests are created THEN the system SHALL organize them within the same testing folder structure
4. WHEN component tests are developed THEN the system SHALL maintain consistent naming conventions within the testing directory
5. WHEN test utilities are needed THEN the system SHALL place helper functions and mocks in the testing folder