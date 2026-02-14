/* ==========================================
   FYI - Premium News PWA
   Maroon accent (#670D17), DM Serif + Satoshi fonts
   Light/Dark mode support
   ========================================== */

/* CSS Custom Properties - Dark Mode (Default) */
:root {
    /* Colors - Dark Mode */
    --bg-primary: #0A0A0A;
    --bg-secondary: #111111;
    --bg-card: #1A1A1A;
    --bg-card-hover: #222222;
    --bg-elevated: #252525;
    --bg-input: #1E1E1E;

    --text-primary: #FFFFFF;
    --text-secondary: #999999;
    --text-tertiary: #666666;

    --border-color: #2A2A2A;
    --border-light: rgba(255, 255, 255, 0.12);

    /* Claude Orange Accent */
    --accent: #DA7756;
    --accent-light: #E8956E;
    --accent-glow: rgba(218, 119, 86, 0.3);

    --success: #4ADE80;
    --warning: #FBBF24;
    --danger: #EF4444;

    /* Card shadow for dark mode */
    --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.2);
    --shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);

    /* Fonts */
    --font-headline: 'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-body: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

    /* ==========================================
       FLUID TYPOGRAPHY - scales with viewport
       Small phones (360px) → Large phones (428px)
       ========================================== */
    --font-size-xs: clamp(0.6875rem, 0.625rem + 0.25vw, 0.8125rem);    /* 11px → 13px */
    --font-size-sm: clamp(0.8125rem, 0.75rem + 0.3125vw, 0.9375rem);   /* 13px → 15px */
    --font-size-md: clamp(0.9375rem, 0.875rem + 0.3125vw, 1.0625rem);  /* 15px → 17px */
    --font-size-lg: clamp(1.0625rem, 1rem + 0.3125vw, 1.1875rem);      /* 17px → 19px */
    --font-size-xl: clamp(1.375rem, 1.25rem + 0.625vw, 1.5625rem);     /* 22px → 25px */
    --font-size-2xl: clamp(1.5625rem, 1.4375rem + 0.625vw, 1.75rem);   /* 25px → 28px */
    --font-size-3xl: clamp(1.75rem, 1.625rem + 0.625vw, 2rem);         /* 28px → 32px */

    /* Line heights */
    --line-height-tight: 1.2;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.7;

    /* ==========================================
       FLUID SPACING - scales with viewport
       ========================================== */
    --spacing-xs: clamp(0.375rem, 0.3125rem + 0.3125vw, 0.5rem);       /* 6px → 8px */
    --spacing-sm: clamp(0.625rem, 0.5625rem + 0.3125vw, 0.75rem);      /* 10px → 12px */
    --spacing-md: clamp(0.875rem, 0.8125rem + 0.3125vw, 1rem);         /* 14px → 16px */
    --spacing-lg: clamp(1.25rem, 1.125rem + 0.625vw, 1.5rem);          /* 20px → 24px */
    --spacing-xl: clamp(1.625rem, 1.5rem + 0.625vw, 2rem);             /* 26px → 32px */
    --spacing-2xl: clamp(2.5rem, 2.25rem + 1.25vw, 3rem);              /* 40px → 48px */

    /* Borders - keep fixed for consistency */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-full: 9999px;

    /* Transitions */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);

    /* Z-index layers */
    --z-cards: 10;
    --z-header: 100;
    --z-hint: 50;
    --z-modal-backdrop: 200;
    --z-modal: 300;
    --z-toast: 400;
    --z-loading: 500;

    /* Safe area insets */
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --safe-left: env(safe-area-inset-left, 0px);
    --safe-right: env(safe-area-inset-right, 0px);

    /* Card Layer System - Fixed dimensions for bug-free positioning */
    --header-height: 60px;
    --progress-area-height: 80px;
    --card-margin-horizontal: 16px;
    --card-margin-bottom: 24px;
    --card-border-radius: var(--radius-xl);

    /* Card layer z-indices */
    --z-flip-card: 10;
    --z-qa-card: 20;
    --z-answer-card: 30;
}

/* Light Mode Variables */
:root.light-mode {
    --bg-primary: #F8F8F8;
    --bg-secondary: #FFFFFF;
    --bg-card: #FFFFFF;
    --bg-card-hover: #F0F0F0;
    --bg-elevated: #FFFFFF;
    --bg-input: #F5F5F5;

    --text-primary: #1A1A1A;
    --text-secondary: #666666;
    --text-tertiary: #999999;

    --border-color: #E0E0E0;
    --border-light: rgba(0, 0, 0, 0.08);

    --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
    --shadow-elevated: 0 4px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ==========================================
   Reset & Base Styles
   ========================================== */

*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* ==========================================
   RESPONSIVE BASE STYLES
   Works WITH browser accessibility, not against it
   ========================================== */

html {
    /* Use percentage for accessibility - allows user font scaling */
    font-size: 100%;

    /* Prevent tap highlight */
    -webkit-tap-highlight-color: transparent;

    /* Smooth font rendering */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
}

body {
    font-family: var(--font-body);
    font-weight: 400;
    font-size: var(--font-size-md);
    line-height: var(--line-height-normal);

    background: var(--bg-primary);
    color: var(--text-primary);

    /* Use dvh for accurate mobile viewport */
    min-height: 100vh;
    min-height: 100dvh;

    /* Prevent body scroll */
    overflow: hidden;

    /* Prevent overscroll bounce */
    overscroll-behavior: none;

    /* Full width */
    width: 100%;

    transition: background var(--transition-normal), color var(--transition-normal);
}

/* Headlines use Cabinet Grotesk Variable */
h1, h2, h3, .card-headline, .modal-headline, .completion-title, .empty-title, .section-title, .info-modal-title {
    font-family: var(--font-headline);
    font-weight: 700;
    font-variation-settings: 'wght' 700;
    letter-spacing: -0.02em;
    text-rendering: optimizeLegibility;
}

/* Inherit font sizes properly */
p, span, div {
    font-size: inherit;
    line-height: inherit;
}

/* Form elements - 16px minimum prevents iOS zoom on focus */
input, textarea, select, button {
    font-size: max(16px, var(--font-size-md));
}

button {
    font-family: var(--font-body);
    border: none;
    background: none;
    cursor: pointer;
    color: inherit;
}

/* ==========================================
   App Container
   ========================================== */

#app {
    position: relative;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* ==========================================
   Header
   ========================================== */

.header {
    position: relative;
    z-index: var(--z-header);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(var(--safe-top) + var(--spacing-sm)) var(--spacing-lg) var(--spacing-sm);
    background: var(--bg-primary);
    flex-shrink: 0;
    transition: background var(--transition-normal);
}

.header-action {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.header-action:hover {
    background: var(--bg-card);
    color: var(--text-primary);
}

.header-action:active {
    transform: scale(0.92);
}

.header-action.refreshing svg {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Theme toggle icons */
.icon-sun, .icon-moon {
    transition: opacity var(--transition-fast), transform var(--transition-fast);
}

:root:not(.light-mode) .icon-sun {
    display: block;
}

:root:not(.light-mode) .icon-moon {
    display: none;
}

:root.light-mode .icon-sun {
    display: none;
}

:root.light-mode .icon-moon {
    display: block;
}

/* Logo */
.header-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform var(--transition-fast);
    flex: 1;
    max-width: calc(100% - 120px); /* Leave space for hamburger and theme toggle */
}

.header-logo:active {
    transform: scale(0.95);
}

.logo {
    height: 52px;
    width: auto;
}

.logo-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-text {
    font-family: var(--font-headline);
    font-weight: 700;
    line-height: 1;
}

/* Theme-aware logo text colors - keeping for backwards compatibility */
.logo-text .fyi-dot {
    color: var(--accent);
}

:root.light-mode .logo-text .fyi-dot {
    color: var(--accent);
}

/* Hamburger Menu */
.hamburger-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    font-size: 24px;
    transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.hamburger-btn:hover {
    background: var(--bg-card);
    color: var(--text-primary);
}

.hamburger-btn:active {
    transform: scale(0.92);
}

/* Dropdown Menu */
.dropdown-menu {
    position: absolute;
    top: 100%;
    left: var(--spacing-lg);
    min-width: 200px;
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-elevated);
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: opacity var(--transition-normal), visibility var(--transition-normal), transform var(--transition-normal);
    z-index: calc(var(--z-header) + 1);
}

.dropdown-menu.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown-item {
    display: block;
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    text-align: left;
    font-size: var(--font-size-md);
    color: var(--text-primary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast);
}

.dropdown-item:hover {
    background: var(--bg-card-hover);
}

.dropdown-item:active {
    background: var(--bg-elevated);
}

/* ==========================================
   Progress Bar
   ========================================== */

.progress-bar-container {
    padding: 0 var(--spacing-lg) var(--spacing-xs);
    flex-shrink: 0;
}

.progress-bar {
    height: 3px;
    background: var(--border-color);
    border-radius: var(--radius-full);
    overflow: hidden;
    transition: background var(--transition-normal);
}

.progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: var(--radius-full);
    width: 0%;
    transition: width var(--transition-slow);
}

/* Date Display */
/* Story Navigation Bar - centered layout */
.story-nav-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-xs) var(--spacing-lg);
    gap: var(--spacing-xs);
    position: relative;
}

/* Dots and date are ALWAYS centered - independent of Prev button */
.story-nav-row {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    position: relative;
}

/* Prev button is absolutely positioned to NOT affect centering */
/* Font size matches date display (font-size-sm) */
.prev-story-btn {
    position: absolute;
    left: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--accent);
    padding: 4px 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: background var(--transition-fast), opacity var(--transition-fast);
}

.prev-story-btn:hover {
    background: var(--bg-card);
}

.prev-story-btn:active {
    opacity: 0.7;
}

.prev-story-btn.hidden {
    visibility: hidden;
    pointer-events: none;
}

/* Spacer no longer needed - remove from layout */
.nav-spacer {
    display: none;
}

.date-display {
    text-align: center;
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    /* Explicit line-height for cross-platform consistency */
    line-height: 1.5;
    font-weight: 500;
    color: var(--text-secondary);
}

/* Progress Dots */
.progress-dots {
    display: flex;
    justify-content: center;
    gap: var(--spacing-xs);
}

.progress-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: transparent;
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.progress-dot.active {
    background: var(--accent);
    transform: scale(1.1);
}

.progress-dot.viewed {
    background: var(--accent);
    opacity: 0.5;
}

/* ==========================================
   Loading State
   ========================================== */

.loading-state {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary);
    z-index: var(--z-loading);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--transition-normal), visibility var(--transition-normal);
}

.loading-state.visible {
    opacity: 1;
    visibility: visible;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--spacing-md);
}

.loading-text {
    font-size: var(--font-size-md);
    color: var(--text-secondary);
}

/* ==========================================
   Pull to Refresh
   ========================================== */

.pull-indicator {
    position: absolute;
    top: calc(var(--safe-top) + 70px);
    left: 50%;
    transform: translateX(-50%) translateY(-60px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    opacity: 0;
    transition: transform var(--transition-normal), opacity var(--transition-normal);
    z-index: var(--z-hint);
    pointer-events: none;
}

.pull-indicator.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.pull-indicator.refreshing .pull-spinner {
    animation: spin 1s linear infinite;
}

.pull-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent);
    border-radius: 50%;
}

.pull-text {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
}

/* ==========================================
   Main Content
   ========================================== */

.main-content {
    flex: 1;
    position: relative;
    overflow: hidden;
    width: 100%;
}

/* Sections */
.section {
    position: absolute;
    inset: 0;
    opacity: 0;
    visibility: hidden;
    transform: translateX(20px);
    transition: opacity var(--transition-normal), visibility var(--transition-normal), transform var(--transition-normal);
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

.section.active {
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
}

.section-today {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.section-header {
    padding: var(--spacing-md) var(--spacing-lg);
}

.section-title {
    font-size: var(--font-size-xl);
    margin-top: var(--spacing-sm);
}

/* Back button */
.back-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-md);
    font-weight: 500;
    color: var(--accent);
    padding: var(--spacing-xs) 0;
}

.back-button:active {
    opacity: 0.7;
}

/* ==========================================
   Card Container
   ========================================== */

.card-container {
    position: relative;
    flex: 1;
    display: flex;
    /* Align cards to top, not center - prevents vertical centering issues */
    align-items: flex-start;
    justify-content: center;
    /* Fluid padding that scales with viewport */
    padding-top: var(--spacing-xl);
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
    /* Space for footer */
    padding-bottom: calc(var(--spacing-xl) + 40px);
    perspective: 1000px;
    width: 100%;
}

/* ==========================================
   Story Cards
   ========================================== */

.story-card {
    position: absolute;
    /* Fluid width - uses calc with vw for consistent sizing across devices */
    width: calc(100% - var(--spacing-lg) * 2);
    max-width: min(400px, 90vw);
    /* FIXED HEIGHT - set by JS, fallback to 70vh */
    height: var(--card-height, 70vh);
    background: transparent;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    cursor: grab;
    touch-action: pan-y;
    user-select: none;
    transform-origin: center center;
    transition: box-shadow var(--transition-normal);
    will-change: transform;
    /* Hide overflow to prevent content from extending beyond card */
    overflow: hidden;
}

.story-card:active {
    cursor: grabbing;
}

.story-card.dragging {
    transition: none;
    box-shadow: var(--shadow-elevated);
}

.story-card.swiping-right {
    box-shadow: var(--shadow-elevated), 0 0 60px var(--accent-glow);
}

.story-card.exiting {
    transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
}

.story-card.behind {
    pointer-events: none;
}

/* Off-screen card positioning for progressive swipe animation */
.story-card[data-card-type="prev"] {
    transform: translateX(-110%);
    z-index: 1;
    opacity: 0.7;
    pointer-events: none;
}

.story-card[data-card-type="current"] {
    transform: translateX(0);
    z-index: 3;
}

.story-card[data-card-type="next"] {
    transform: translateX(110%);
    z-index: 1;
    opacity: 0.7;
    pointer-events: none;
}

/* Card Banner Image - 25% of card height */
.card-banner {
    width: 100%;
    aspect-ratio: 3 / 1;
    background: linear-gradient(135deg, var(--accent) 0%, #B85A3C 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.card-banner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-bottom: 3px solid var(--accent);
}

.card-banner-placeholder {
    font-size: 48px;
    opacity: 0.5;
}

/* Card Content */
.card-body {
    position: relative;
    padding: var(--spacing-lg);
    /* Extra bottom padding for nav indicators */
    padding-bottom: calc(var(--spacing-xl) + var(--spacing-xl));
}

/* Emoji removed from cards - keeping selector for backwards compatibility */
.card-emoji {
    display: none;
}

.card-headline {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-sm);
    color: var(--text-primary);
    /* Ensure long words wrap properly */
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
}

.card-teaser {
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xl);
    /* Allow 5 lines of text */
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-hint {
    position: absolute;
    bottom: var(--spacing-lg);
    right: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    color: var(--accent);
    font-weight: 500;
    opacity: 0.9;
}

.card-hint-arrow {
    display: inline-block;
    font-size: var(--font-size-md);
}

/* Card Stack Effect */
.story-card[data-position="0"] {
    z-index: 3;
    transform: translateY(0) scale(1);
}

/* Hide all cards except the current one - no prev/next card visibility */
.story-card[data-position="-1"],
.story-card[data-position="1"],
.story-card[data-position="2"] {
    display: none;
    visibility: hidden;
    opacity: 0;
}

/* Premium Swipe Visual Feedback - subtle gradient overlays */
.card-swipe-overlay {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-xl);
    opacity: 0;
    transition: opacity 200ms ease-out;
    pointer-events: none;
    z-index: 5;
}

.card-swipe-overlay.left {
    background: linear-gradient(90deg, rgba(0,0,0,0.15) 0%, transparent 50%);
}

.card-swipe-overlay.right {
    background: linear-gradient(-90deg, rgba(218, 119, 86, 0.2) 0%, transparent 50%);
}

.story-card.swiping-left .card-swipe-overlay.left {
    opacity: 1;
}

.story-card.swiping-right .card-swipe-overlay.right {
    opacity: 1;
}

/* ==========================================
   Card Flip Styles
   ========================================== */

.story-card {
    perspective: 1000px;
}

.card-flipper {
    position: relative;
    width: 100%;
    /* Fixed height - inherits from parent story-card */
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 450ms cubic-bezier(0.4, 0, 0.2, 1);
}

.story-card.flipped .card-flipper {
    transform: rotateY(180deg);
}

.card-face {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    /* Fixed height - fills parent flipper */
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: var(--radius-xl);
    overflow: hidden;
    background: var(--bg-card);
    box-shadow: var(--shadow-card);
}

/* Front face */
.card-front {
    z-index: 2;
}

/* Back face (summary) - content starts at top, not centered */
.card-back {
    transform: rotateY(180deg);
    z-index: 1;
    display: flex;
    flex-direction: column;
    /* Content aligned to top, not centered */
    justify-content: flex-start;
}

/* Summary tile content - aligned to top, content-based height */
.card-back-content {
    /* Padding inside tile - headline starts near top */
    padding: var(--spacing-md) var(--spacing-lg);
    /* Space for nav indicators at bottom */
    padding-bottom: calc(var(--spacing-xl) + 56px);
    /* No flex:1 - height is content-based */
}

.card-back-header {
    font-family: var(--font-headline);
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    font-weight: 700;
    color: var(--accent);
    margin-bottom: var(--spacing-md);
    margin-top: 0;
    text-align: center;
}

.card-summary-text {
    font-size: var(--font-size-md);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    /* Truncate long text with ellipsis */
    display: -webkit-box;
    -webkit-line-clamp: 8;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ==========================================
   Navigation Hints - CSS Grid Layout
   Left: "← Prev" | Center: "Read ahead ↑" | Right: "Next →"
   Grid ensures center is always centered even when prev is hidden
   ========================================== */

.card-nav-hints {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    min-height: 48px;
    background: linear-gradient(transparent, var(--bg-card) 50%);
    z-index: 10;
    /* pointer-events enabled for clickable hints */
}

.nav-hint {
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    font-weight: 500;
    transition: opacity var(--transition-fast), transform var(--transition-fast);
    cursor: pointer;
}

.nav-hint-prev {
    justify-self: start;
    color: var(--text-tertiary);
}

.nav-hint-center {
    justify-self: center;
    color: var(--accent);
    font-weight: 600;
}

.nav-hint-next {
    justify-self: end;
    color: var(--text-tertiary);
}

/* DEPRECATED: Use .disabled instead for grid alignment preservation */
.nav-hint.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

/* Disabled state - keeps element in grid but invisible + non-interactive */
.nav-hint.disabled {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
}

/* Hover/active states for nav hints */
.nav-hint:not(.hidden):hover {
    opacity: 0.8;
}

.nav-hint:not(.hidden):active {
    transform: scale(0.95);
}

/* Summary card: subtle up-arrow hint only */
.card-nav-hints-summary {
    justify-content: center;
}

.nav-hint-center-subtle {
    color: var(--text-tertiary);
    font-size: var(--font-size-lg);
    opacity: 0.5;
}

/* Swipe visual feedback classes */
.story-card.swiping-left .card-swipe-overlay.left {
    opacity: 0.3;
}

.story-card.swiping-right .card-swipe-overlay.right {
    opacity: 0.3;
}

.story-card.swiping-up {
    /* Add subtle visual feedback for swipe up */
}

.story-card.swiping-down {
    /* Add subtle visual feedback for swipe down */
}

/* LEGACY - keeping for backwards compatibility */
/* Bottom Navigation Indicators - OLD SYSTEM */
.card-nav-indicators {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    /* Explicit height for cross-platform consistency */
    min-height: 56px;
    background: linear-gradient(transparent, var(--bg-card) 40%);
    z-index: 10;
}

/* Nav indicator buttons - clickable (LEGACY) */
.nav-indicator {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    font-weight: 500;
    background: none;
    border: none;
    padding: var(--spacing-xs) var(--spacing-sm);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: background var(--transition-fast), opacity var(--transition-fast);
}

.nav-indicator:hover {
    background: rgba(255, 255, 255, 0.1);
}

.nav-indicator:active {
    opacity: 0.7;
}

.nav-skip {
    color: var(--text-tertiary);
}

/* Flip button text - subdued */
.nav-flip,
.nav-flip-back {
    color: var(--text-tertiary);
}

.nav-curious {
    color: var(--accent);
}

.nav-arrow {
    flex-shrink: 0;
}

.nav-indicator.hidden {
    visibility: hidden;
}

/* ==========================================
   Empty States
   ========================================== */

.empty-state {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    text-align: center;
    height: 100%;
}

.empty-state.visible {
    display: flex;
}

.empty-icon {
    font-size: 64px;
    margin-bottom: var(--spacing-lg);
    opacity: 0.6;
}

.empty-title {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-xs);
}

.empty-text {
    font-size: var(--font-size-md);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
}

.refresh-button {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--accent);
    color: white;
    border-radius: var(--radius-full);
    font-weight: 500;
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.refresh-button:hover {
    background: var(--accent-light);
}

.refresh-button:active {
    transform: scale(0.96);
}

/* ==========================================
   Swipe Hint
   ========================================== */

.swipe-hint {
    position: absolute;
    bottom: var(--spacing-xl);
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: var(--z-hint);
    pointer-events: none;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity var(--transition-slow), transform var(--transition-slow);
}

.swipe-hint.visible {
    opacity: 1;
    transform: translateY(0);
}

.swipe-hint-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--bg-elevated);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    box-shadow: var(--shadow-card);
}

.swipe-arrow {
    color: var(--text-tertiary);
    font-size: var(--font-size-lg);
}

/* ==========================================
   Completion Screen
   ========================================== */

.completion-screen {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--transition-slow), visibility var(--transition-slow);
    z-index: var(--z-cards);
}

.completion-screen.visible {
    opacity: 1;
    visibility: visible;
}

.completion-content {
    text-align: center;
    transform: scale(0.95);
    transition: transform var(--transition-slow);
}

.completion-screen.visible .completion-content {
    transform: scale(1);
}

/* Completion image - width matches title text */
.completion-image {
    max-width: 100%;
    width: auto;
    height: auto;
    max-height: 150px;
    margin-bottom: var(--spacing-lg);
    border-radius: var(--radius-lg);
    object-fit: contain;
}

.completion-title {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    margin-bottom: var(--spacing-sm);
}

.completion-subtitle {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-normal);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xl);
}

/* Story Thumbnails - removed, simplified completion screen */

.completion-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    width: 100%;
    max-width: 280px;
    margin-top: var(--spacing-lg);
    margin-left: auto;
    margin-right: auto;
}

.completion-buttons .secondary-button {
    width: 100%;
}

.secondary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-xl);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    font-size: var(--font-size-md);
    font-weight: 500;
    color: var(--text-primary);
    transition: background var(--transition-fast), transform var(--transition-fast);
    flex: 1;
}

.secondary-button:hover {
    background: var(--bg-card-hover);
}

.secondary-button:active {
    transform: scale(0.96);
}

/* ==========================================
   Recap This Week View
   ========================================== */

.recap-week-view {
    position: absolute;
    inset: 0;
    background: var(--bg-primary);
    z-index: var(--z-cards);
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px);
    transition: opacity var(--transition-normal), visibility var(--transition-normal), transform var(--transition-normal);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.recap-week-view.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.recap-header {
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}

.recap-title {
    font-family: var(--font-headline);
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text-primary);
    margin-top: var(--spacing-sm);
}

.recap-stories-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md) var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.recap-date-group {
    margin-bottom: var(--spacing-md);
}

.recap-date-header {
    font-family: var(--font-headline);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: var(--spacing-sm) 0;
    margin-bottom: var(--spacing-xs);
}

.recap-story-card {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    cursor: pointer;
    transition: transform var(--transition-fast), background var(--transition-fast);
    margin-bottom: var(--spacing-sm);
}

.recap-story-card:hover {
    background: var(--bg-card-hover);
}

.recap-story-card:active {
    transform: scale(0.98);
}

.recap-story-emoji {
    font-size: 28px;
    flex-shrink: 0;
}

.recap-story-info {
    flex: 1;
    min-width: 0;
}

.recap-story-headline {
    font-family: var(--font-headline);
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--text-primary);
    line-height: var(--line-height-tight);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.recap-arrow {
    flex-shrink: 0;
    color: var(--text-tertiary);
    opacity: 0.5;
}

.recap-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    gap: var(--spacing-md);
    color: var(--text-secondary);
}

.recap-loading p {
    font-size: var(--font-size-sm);
    margin: 0;
}

.recap-empty {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: var(--spacing-2xl);
    text-align: center;
}

/* ==========================================
   History Section
   ========================================== */

.history-list {
    padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.history-item {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-sm);
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.history-item:active {
    background: var(--bg-card-hover);
    transform: scale(0.98);
}

.history-emoji {
    font-size: 24px;
    flex-shrink: 0;
}

.history-content {
    flex: 1;
    min-width: 0;
}

.history-headline {
    font-family: var(--font-headline);
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--text-primary);
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.history-question {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.history-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
}

.history-rating {
    font-size: var(--font-size-xs);
    color: var(--warning);
}

.history-time {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
}

/* History Toggle Button */
.history-toggle {
    position: fixed;
    bottom: calc(var(--safe-bottom) + var(--spacing-lg));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-secondary);
    box-shadow: var(--shadow-card);
    z-index: var(--z-hint);
    transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.history-toggle:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

.history-toggle:active {
    transform: translateX(-50%) scale(0.96);
}

.history-toggle.hidden {
    display: none;
}

/* ==========================================
   Q&A Card System - REBUILT FROM SCRATCH
   Q&A card is positioned INSIDE the story-card as a third face
   Slides up from bottom when card is flipped to summary

   STATE 1: Hidden (translateY 100% - below card)
   STATE 2: Peeking (only prompt visible at bottom)
   STATE 3: Active (fully visible, user can tap questions)
   ========================================== */

/* Q&A Card - positioned INSIDE story card, overlays the back face */
.qa-card {
    position: absolute;
    /* Fill entire container */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* Card styling */
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    /* Flexbox for content layout */
    display: flex;
    flex-direction: column;
    /* Padding */
    padding: var(--spacing-lg);
    /* Default: Hidden below card */
    transform: translateY(100%);
    /* Layer above card faces and flipper */
    z-index: var(--z-qa-card);
    /* Hidden by default */
    pointer-events: none;
    opacity: 0;
    /* Smooth slide transition */
    transition: transform 400ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease;
    /* No scroll bars - content will be truncated */
    overflow: hidden;
}

/* STATE 2: Peeking - shows prompt at bottom of card with visual gap */
.qa-card.peeking {
    /* Slide up so only top ~50px is visible + 16px gap from summary */
    transform: translateY(calc(100% - 50px));
    pointer-events: auto;
    opacity: 1;
    /* Visual separator - shadow at top edge */
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.3), var(--shadow-card);
}

/* STATE 3: Active - fully visible */
.qa-card.active {
    transform: translateY(0);
    pointer-events: auto;
    opacity: 1;
}

/* Q&A Prompt - "Are you curious about:" text */
.qa-prompt {
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
    text-align: center;
    padding: var(--spacing-sm) 0;
    margin-bottom: var(--spacing-md);
    flex-shrink: 0;
}

/* Q&A Questions List - grows to fill space */
.qa-questions-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    flex: 1;
    overflow: hidden;
}

/* Question buttons */
.qa-question-btn {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    text-align: left;
    transition: background var(--transition-fast), transform var(--transition-fast);
    border: none;
    cursor: pointer;
    font-family: inherit;
}

.qa-question-btn:hover {
    background: var(--bg-card-hover);
}

.qa-question-btn:active {
    transform: scale(0.98);
}

.qa-question-btn.skip {
    background: transparent;
    border: 1px solid var(--border-color);
}

.qa-question-btn.skip:hover {
    border-color: var(--text-tertiary);
    background: var(--bg-card);
}

.qa-question-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 16px;
    color: var(--accent);
    flex-shrink: 0;
}

.qa-question-text {
    font-size: var(--font-size-md);
    line-height: var(--line-height-normal);
    font-weight: 500;
    color: var(--text-primary);
    /* Text truncation - max 2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ==========================================
   ANSWER CARD - Level 3 in card hierarchy
   Slides up when user clicks a question
   ========================================== */

.answer-card {
    position: absolute;
    /* Fill entire container */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    /* Default: Hidden below card */
    transform: translateY(100%);
    /* Layer above Q&A card */
    z-index: 30;
    pointer-events: none;
    opacity: 0;
    transition: transform 300ms ease-out, opacity 200ms ease;
    /* No scroll bars - content will be truncated */
    overflow: hidden;
}

.answer-card.active {
    transform: translateY(0);
    pointer-events: auto;
    opacity: 1;
}

/* Answer Card Header */
.answer-card .answer-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.answer-card .answer-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 18px;
    color: var(--accent);
    flex-shrink: 0;
}

.answer-card .answer-question-text {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-normal);
    font-weight: 600;
    color: var(--text-primary);
    /* Text truncation - max 3 lines */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Answer Card Body - grows to fill available space */
.answer-card .answer-body {
    flex: 1;
    margin-bottom: var(--spacing-lg);
    overflow: hidden;
}

.answer-card .answer-text {
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    color: var(--text-secondary);
    /* Text truncation - flexible based on available space */
    display: -webkit-box;
    -webkit-line-clamp: 12;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Answer Card Rating */
.answer-card .answer-rating {
    text-align: center;
    margin-bottom: var(--spacing-lg);
}

.answer-card .rating-label {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    margin-bottom: var(--spacing-sm);
}

.answer-card .rating-stars {
    display: inline-flex;
    gap: var(--spacing-xs);
}

.answer-card .rating-star {
    font-size: 28px;
    color: var(--text-tertiary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color var(--transition-fast), transform var(--transition-fast);
}

.answer-card .rating-star:hover {
    transform: scale(1.15);
}

.answer-card .rating-star.active {
    color: var(--warning);
}

/* Answer Card Footer - stays at bottom */
.answer-card .answer-footer {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
}

.answer-card .answer-done-btn,
.answer-card .answer-dig-deeper-btn {
    flex: 1;
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-md);
    font-weight: 500;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.answer-card .answer-done-btn {
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
}

.answer-card .answer-done-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

.answer-card .answer-dig-deeper-btn {
    background: var(--accent);
    color: white;
    border: none;
}

.answer-card .answer-dig-deeper-btn:hover {
    background: var(--accent-light);
}

.answer-card .answer-done-btn:active,
.answer-card .answer-dig-deeper-btn:active {
    transform: scale(0.96);
}

/* ==========================================
   DIG DEEPER Q&A CARD - Level 4 in card hierarchy
   Slides up when user clicks Dig Deeper
   ========================================== */

.dig-deeper-qa-card {
    position: absolute;
    /* Fill entire container */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    /* Default: Hidden below card */
    transform: translateY(100%);
    /* Layer above Answer card */
    z-index: 40;
    pointer-events: none;
    opacity: 0;
    transition: transform 300ms ease-out, opacity 200ms ease;
    /* No scroll bars - content will be truncated */
    overflow: hidden;
    overscroll-behavior: contain;
}

.dig-deeper-qa-card.active {
    transform: translateY(0);
    pointer-events: auto;
    opacity: 1;
}

/* Dig Deeper Header - headline and subheading (left-aligned to match answer card) */
.dig-deeper-header {
    text-align: left;
    margin-bottom: var(--spacing-lg);
    flex-shrink: 0;
}

.dig-deeper-headline {
    font-family: var(--font-headline);
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-sm) 0;
}

.dig-deeper-subheading {
    font-size: var(--font-size-md);
    line-height: var(--line-height-normal);
    color: var(--text-tertiary);
    margin: 0;
}

/* Dig Deeper Questions List - grows to fill space */
.dig-deeper-questions-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    flex: 1;
    overflow: hidden;
}

/* Dig Deeper questions - same font as main Q&A, truncate to 2 lines for consistency */
.dig-deeper-questions-list .qa-question-text {
    -webkit-line-clamp: 2;
}

/* Dig Deeper Footer - back to headline link */
.dig-deeper-footer {
    display: flex;
    justify-content: center;
    padding-top: var(--spacing-lg);
    flex-shrink: 0;
}

.back-to-headline-link {
    background: none;
    border: none;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    cursor: pointer;
    padding: var(--spacing-sm) var(--spacing-md);
    transition: color var(--transition-fast);
}

.back-to-headline-link:hover {
    color: var(--text-secondary);
}

/* ==========================================
   DIG DEEPER ANSWER CARD - Level 5 in card hierarchy
   Slides up when user clicks a dig deeper question
   ========================================== */

.dig-deeper-answer-card {
    position: absolute;
    /* Fill entire container */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-card);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    /* Default: Hidden below card */
    transform: translateY(100%);
    /* Layer above Dig Deeper Q&A card */
    z-index: 50;
    pointer-events: none;
    opacity: 0;
    transition: transform 300ms ease-out, opacity 200ms ease;
    /* No scroll bars - content will be truncated */
    overflow: hidden;
    overscroll-behavior: contain;
}

.dig-deeper-answer-card.active {
    transform: translateY(0);
    pointer-events: auto;
    opacity: 1;
}

/* Dig Deeper Answer Card uses same styling as Answer Card */
.dig-deeper-answer-card .answer-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.dig-deeper-answer-card .answer-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 18px;
    color: var(--accent);
    flex-shrink: 0;
}

.dig-deeper-answer-card .answer-question-text {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-normal);
    font-weight: 600;
    color: var(--text-primary);
    /* Text truncation - max 3 lines */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dig-deeper-answer-card .answer-body {
    flex: 1;
    margin-bottom: var(--spacing-lg);
    overflow: hidden;
}

.dig-deeper-answer-card .answer-text {
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    color: var(--text-secondary);
    /* Text truncation - flexible based on available space */
    display: -webkit-box;
    -webkit-line-clamp: 12;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dig-deeper-answer-card .answer-rating {
    text-align: center;
    margin-bottom: var(--spacing-lg);
}

.dig-deeper-answer-card .rating-label {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    margin-bottom: var(--spacing-sm);
}

.dig-deeper-answer-card .rating-stars {
    display: inline-flex;
    gap: var(--spacing-xs);
}

.dig-deeper-answer-card .rating-star {
    font-size: 28px;
    color: var(--text-tertiary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color var(--transition-fast), transform var(--transition-fast);
}

.dig-deeper-answer-card .rating-star:hover {
    transform: scale(1.15);
}

.dig-deeper-answer-card .rating-star.active {
    color: var(--warning);
}

.dig-deeper-answer-card .answer-footer {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
}

.dig-deeper-answer-card .answer-done-btn {
    flex: 1;
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-md);
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    background: var(--accent);
    color: white;
    border: none;
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.dig-deeper-answer-card .answer-done-btn:hover {
    background: var(--accent-light);
}

.dig-deeper-answer-card .answer-done-btn:active {
    transform: scale(0.96);
}

/* ==========================================
   LEGACY: Old Modal System (keeping for Answer/Dig Deeper views)
   The modal-backdrop is still used for answer and dig deeper flows
   ========================================== */

/* Q&A backdrop container - positioned within card area */
/* NOTE: This is a LEGACY modal system - may be vestigial */
.modal-backdrop {
    position: fixed;
    /* Position in card area, below header/progress */
    top: calc(var(--safe-top) + var(--header-height) + var(--progress-area-height));
    left: var(--card-margin-horizontal);
    right: var(--card-margin-horizontal);
    bottom: var(--card-margin-bottom);
    background: transparent;
    z-index: var(--z-qa-card);
    pointer-events: none;
    overflow: hidden;
    /* Hidden by default - prevents vestigial elements showing on large viewports */
    visibility: hidden;
}

/* Q&A Card - matches story card EXACTLY */
.modal {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: min(400px, 100%);
    margin: 0 auto;
    background: var(--bg-card);
    border-radius: var(--card-border-radius);
    box-shadow: var(--shadow-card);
    padding: var(--spacing-lg);
    padding-bottom: calc(var(--safe-bottom) + 80px);
    z-index: var(--z-qa-card);
    overflow-y: auto;
    overscroll-behavior: contain;
    display: flex;
    flex-direction: column;
    /* STATE 1: Hidden (default) - below viewport */
    transform: translateY(100%);
    transition: transform 400ms cubic-bezier(0.32, 0.72, 0, 1);
    pointer-events: none;
}

/* STATE 2: Peeking - shows hint at bottom when Summary is visible */
.modal-backdrop.peeking {
    visibility: visible;
}

.modal-backdrop.peeking .modal {
    transform: translateY(calc(100% - 80px));
    pointer-events: auto;
}

/* STATE 3: Active - fully visible, replaces Summary */
.modal-backdrop.visible {
    visibility: visible;
}

.modal-backdrop.visible .modal {
    transform: translateY(0);
    pointer-events: auto;
}

/* Push transition for swipe-up animation */
.modal-backdrop.push-transition .modal {
    transition: transform 400ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Q&A Card navigation hint - matches story card nav hints */
.modal-drag-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-md) 0;
    margin-top: auto;
}

.drag-bar {
    width: 40px;
    height: 4px;
    background: var(--border-color);
    border-radius: var(--radius-full);
}

.drag-text {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    font-weight: 500;
}

/* Q&A Card nav hint removed - using simple slide transitions */

/* Modal close button - matches modal prev button size (32px) */
.modal-close {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    transition: background var(--transition-fast), color var(--transition-fast);
    z-index: 10;
}

.modal-close svg {
    width: 16px;
    height: 16px;
}

.modal-close:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

.modal-close:active {
    transform: scale(0.92);
}

/* Modal Prev Button - 20% smaller */
.modal-prev {
    position: absolute;
    top: var(--spacing-md);
    left: var(--spacing-md);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    /* Only transition colors, not position - prevents glitching */
    transition: background var(--transition-fast), color var(--transition-fast);
    z-index: 10;
}

.modal-prev svg {
    width: 16px;
    height: 16px;
}

.modal-prev:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

.modal-prev:active {
    opacity: 0.7;
}

/* Modal Views - Card-internal slide transitions */
.modal-view {
    position: relative;
    padding: 0;
    overflow-y: auto;
    background: transparent;
    transition: transform 350ms cubic-bezier(0.32, 0.72, 0, 1), opacity 350ms ease;
}

/* Hidden views */
.modal-view.hidden {
    display: none;
    visibility: hidden;
    opacity: 0;
}

/* Active view */
.modal-view:not(.hidden) {
    display: block;
    visibility: visible;
    opacity: 1;
}

/* Slide out to the left animation */
.modal-view.slide-out-left {
    transform: translateX(-100%);
    opacity: 0;
}

/* Slide in from right animation (default for views becoming visible) */
.modal-view.slide-in-right {
    animation: slideInRight 350ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

/* Legacy fade classes for backwards compatibility */
.modal-view.fade-out {
    opacity: 0;
    transform: translateX(-20px);
}

.modal-view.fade-in {
    animation: fadeIn var(--transition-normal) forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}

/* Q&A View */
.modal-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    padding-right: var(--spacing-2xl);
}

.modal-emoji {
    font-size: 32px;
    flex-shrink: 0;
}

.modal-headline {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
}

.modal-subheading {
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
    margin-bottom: var(--spacing-md);
}

/* Question Buttons */
.questions-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.question-button {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    text-align: left;
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.question-button:hover {
    background: var(--bg-card-hover);
}

.question-button:active {
    transform: scale(0.98);
}

.question-button.skip {
    background: transparent;
    border: 1px solid var(--border-color);
}

.question-button.skip:hover {
    border-color: var(--text-tertiary);
    background: var(--bg-card);
}

.question-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 16px;
    color: var(--text-primary);
    flex-shrink: 0;
    padding-top: 2px;
}

.question-button.skip .question-label {
    color: var(--text-tertiary);
}

.question-text {
    font-size: var(--font-size-md);
    line-height: var(--line-height-normal);
    font-weight: 500;
    color: var(--text-primary);
    padding-top: 2px;
}

/* Answer View */
.answer-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    padding-right: var(--spacing-2xl);
}

.answer-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 18px;
    color: var(--accent);
    flex-shrink: 0;
}

.answer-question {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-normal);
    font-weight: 500;
    color: var(--text-primary);
}

.answer-content {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
    transition: background var(--transition-normal);
}

.answer-text {
    font-size: var(--font-size-md);
    line-height: var(--line-height-relaxed);
    color: var(--text-secondary);
}

/* Star Rating */
.rating-section {
    text-align: center;
    margin-bottom: var(--spacing-xl);
}

.rating-label {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    margin-bottom: var(--spacing-sm);
}

.star-rating {
    display: inline-flex;
    gap: var(--spacing-xs);
}

.star {
    font-size: 32px;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: color var(--transition-fast), transform var(--transition-fast);
}

.star:hover {
    transform: scale(1.15);
}

.star.active {
    color: var(--warning);
}

.star.filling {
    animation: starFill 200ms ease-out forwards;
}

@keyframes starFill {
    0% { transform: scale(1); color: var(--text-tertiary); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); color: var(--warning); }
}

/* Answer Actions */
.answer-actions {
    display: flex;
    gap: var(--spacing-sm);
}

.action-button {
    flex: 1;
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-md);
    font-weight: 500;
    transition: background var(--transition-fast), transform var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.action-button.secondary {
    background: var(--bg-card);
    color: var(--text-secondary);
}

.action-button.secondary:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

.action-button.primary {
    background: var(--accent);
    color: white;
}

.action-button.primary:hover {
    background: var(--accent-light);
}

.action-button:active {
    transform: scale(0.96);
}

.action-button.full-width {
    flex: none;
    width: 100%;
}

/* ==========================================
   Toast
   ========================================== */

.toast {
    position: fixed;
    bottom: calc(var(--safe-bottom) + 80px);
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--bg-elevated);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-elevated);
    opacity: 0;
    visibility: hidden;
    transition: transform var(--transition-normal), opacity var(--transition-normal), visibility var(--transition-normal);
    z-index: var(--z-toast);
}

.toast.visible {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
}

.toast-icon {
    font-size: var(--font-size-md);
}

.toast-message {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
}

/* ==========================================
   Responsive Adjustments
   Mobile-first: Base styles are for smallest screens
   ========================================== */

/* Small phones (up to 375px) - tighter spacing */
@media (max-width: 374px) {
    :root {
        --spacing-lg: 1rem;
        --spacing-xl: 1.5rem;
    }

    .card-container {
        padding-left: var(--spacing-md);
        padding-right: var(--spacing-md);
    }

    .story-card {
        width: calc(100% - var(--spacing-md) * 2);
    }

    .card-body {
        padding: var(--spacing-md);
        padding-bottom: calc(var(--spacing-lg) + var(--spacing-xl));
    }

    .card-headline {
        font-size: var(--font-size-xl);
    }

    .modal {
        padding-left: var(--spacing-md);
        padding-right: var(--spacing-md);
    }
}

/* Medium phones (375px - 414px) - standard mobile */
@media (min-width: 375px) and (max-width: 413px) {
    .card-headline {
        font-size: var(--font-size-2xl);
    }
}

/* Larger phones and small tablets (414px+) */
@media (min-width: 414px) {
    .card-headline {
        font-size: var(--font-size-2xl);
    }
}

/* Tablets and larger (480px+) */
@media (min-width: 480px) {
    .card-body {
        padding: var(--spacing-xl);
    }

    .card-headline {
        font-size: var(--font-size-3xl);
    }

    .modal {
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        max-width: 480px;
        border-radius: var(--radius-xl);
        bottom: var(--spacing-lg);
    }

    .modal-backdrop.visible .modal {
        transform: translateX(-50%) translateY(0);
    }
}

/* ==========================================
   Utility Classes
   ========================================== */

.hidden {
    display: none !important;
}

.no-scroll {
    overflow: hidden;
}

/* ==========================================
   Info Modal (What is FYI, Our Philosophy)
   ========================================== */

.info-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    z-index: var(--z-modal-backdrop);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--transition-normal), visibility var(--transition-normal), background var(--transition-normal);
}

.info-modal-backdrop.visible {
    opacity: 1;
    visibility: visible;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.info-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.95);
    width: calc(100% - var(--spacing-xl) * 2);
    max-width: 400px;
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    padding: var(--spacing-xl);
    z-index: var(--z-modal);
    opacity: 0;
    transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.info-modal-backdrop.visible .info-modal {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.info-modal-close {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    transition: background var(--transition-fast), color var(--transition-fast);
}

.info-modal-close:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

.info-modal-title {
    font-family: var(--font-headline);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-md);
    padding-right: var(--spacing-xl);
}

.info-modal-content {
    font-size: var(--font-size-md);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
}

/* ==========================================
   Summary Modal (Tap to view)
   ========================================== */

.summary-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    z-index: var(--z-modal-backdrop);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--transition-normal), visibility var(--transition-normal), background var(--transition-normal);
}

.summary-modal-backdrop.visible {
    opacity: 1;
    visibility: visible;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.summary-modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 60vh;
    max-height: 60dvh;
    background: var(--bg-secondary);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding: var(--spacing-lg) var(--spacing-lg) calc(var(--safe-bottom) + var(--spacing-xl));
    z-index: var(--z-modal);
    transform: translateY(100%);
    transition: transform var(--transition-normal), background var(--transition-normal);
    overflow-y: auto;
    overscroll-behavior: contain;
}

.summary-modal-backdrop.visible .summary-modal {
    transform: translateY(0);
}

/* X button in TOP-LEFT corner */
.summary-modal-close {
    position: absolute;
    top: var(--spacing-md);
    left: var(--spacing-md);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
    z-index: 1;
}

.summary-modal-close:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

.summary-modal-close:active {
    transform: scale(0.92);
}

.summary-modal-content {
    padding-top: var(--spacing-xl);
}

.summary-modal-headline {
    font-family: var(--font-headline);
    font-size: var(--font-size-xl);
    font-weight: 700;
    font-variation-settings: 'wght' 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
    line-height: var(--line-height-tight);
}

.summary-modal-text {
    font-size: var(--font-size-md);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
}

@media (min-width: 480px) {
    .summary-modal {
        left: 50%;
        transform: translateX(-50%) translateY(100%);
        max-width: 480px;
        border-radius: var(--radius-xl);
        bottom: var(--spacing-lg);
    }

    .summary-modal-backdrop.visible .summary-modal {
        transform: translateX(-50%) translateY(0);
    }
}

/* ==========================================
   Dig Deeper View Styles
   ========================================== */

.dig-deeper-header {
    margin-bottom: var(--spacing-lg);
    padding-right: var(--spacing-2xl);
}

.dig-deeper-title {
    font-family: var(--font-headline);
    font-size: var(--font-size-xl);
    font-weight: 700;
    font-variation-settings: 'wght' 700;
    color: var(--accent);
    margin-bottom: var(--spacing-xs);
}

.dig-deeper-subtitle {
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--text-secondary);
    font-style: normal;
}

.deep-questions-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.deep-question-button {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    text-align: left;
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.deep-question-button:hover {
    background: var(--bg-card-hover);
}

.deep-question-button:active {
    transform: scale(0.98);
}

.deep-question-label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 14px;
    color: var(--accent);
    flex-shrink: 0;
    padding-top: 2px;
}

.deep-question-text {
    /* Explicit sizing for cross-platform consistency */
    font-size: 16px;
    line-height: 1.5;
    font-weight: 500;
    color: var(--text-primary);
    padding-top: 2px;
}

/* Back to questions button in deep answer */
#backToDeepQuestionsBtn {
    background: var(--bg-card);
    color: var(--text-secondary);
}

#backToDeepQuestionsBtn:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

/* ==========================================
   Welcome Modal (First Time User)
   ========================================== */

.welcome-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--transition-normal), visibility var(--transition-normal);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
}

.welcome-modal-backdrop.visible {
    opacity: 1;
    visibility: visible;
}

.welcome-modal {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    padding: var(--spacing-2xl) var(--spacing-xl);
    width: 100%;
    max-width: 320px;
    text-align: center;
    transform: scale(0.9);
    opacity: 0;
    transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.welcome-modal-backdrop.visible .welcome-modal {
    transform: scale(1);
    opacity: 1;
}

.welcome-title {
    font-family: var(--font-headline);
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
}

.welcome-subtitle {
    font-size: var(--font-size-md);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xl);
}

.welcome-input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--bg-input);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    font-family: var(--font-body);
    font-size: var(--font-size-lg);
    color: var(--text-primary);
    text-align: center;
    margin-bottom: var(--spacing-lg);
    transition: border-color var(--transition-fast);
    outline: none;
}

.welcome-input:focus {
    border-color: var(--accent);
}

.welcome-input::placeholder {
    color: var(--text-tertiary);
}

.welcome-button {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-xl);
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    font-family: var(--font-body);
    font-size: var(--font-size-md);
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.welcome-button:hover {
    background: var(--accent-light);
}

.welcome-button:active {
    transform: scale(0.96);
}

.welcome-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Welcome Choice Modal - Two Button Style */
.welcome-choice-modal {
    max-width: 340px;
}

.welcome-choice-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.welcome-button.primary {
    background: var(--accent);
    color: white;
}

.welcome-button.secondary {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.welcome-button.secondary:hover {
    background: var(--bg-card-hover);
    border-color: var(--text-tertiary);
}

/* Welcome Back Button */
.welcome-back-btn {
    position: absolute;
    top: var(--spacing-md);
    left: var(--spacing-md);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    border: none;
    cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast);
}

.welcome-back-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

.welcome-modal {
    position: relative; /* For absolute positioning of back button */
}

/* ==========================================
   FAQ Title Styling - Large and Striking
   ========================================== */

.faq-title-display {
    font-family: var(--font-body); /* Satoshi */
    font-size: clamp(1.25rem, 5vw, 1.5rem); /* Responsive, fits on one line */
    font-weight: 600;
    color: var(--accent);
    text-align: center;
    white-space: nowrap; /* Prevent wrapping */
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ==========================================
   No Stories State - Redesigned
   ========================================== */

.no-stories-content {
    text-align: center;
    padding: var(--spacing-xl);
}

.no-stories-image {
    max-width: 100%;
    width: auto;
    height: auto;
    max-height: 150px;
    margin-bottom: var(--spacing-lg);
    border-radius: var(--radius-lg);
    object-fit: contain;
}

.no-stories-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    width: 100%;
    max-width: 280px;
    margin: var(--spacing-lg) auto 0;
}

.no-stories-buttons .secondary-button {
    width: 100%;
}

.secondary-button.primary-action {
    background: var(--accent);
    color: white;
    border: none;
}

.secondary-button.primary-action:hover {
    background: var(--accent-light);
}

/* ==========================================
   Logo with User Name - Inter Font
   ========================================== */

.logo-text {
    display: flex;
    align-items: baseline;
    white-space: nowrap;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 0.03em;
    transition: font-size var(--transition-fast);
}

.fyi-text {
    color: var(--accent);
}

.fyi-comma {
    color: var(--accent);
}

.fyi-space {
    /* Single space - letter-spacing on .logo-text provides visual separation */
    display: inline;
}

.fyi-name {
    color: #FFFFFF;
    transition: color var(--transition-normal);
}

/* Light mode: name text color inverts to dark */
:root.light-mode .fyi-name {
    color: #1A1A1A;
}

/* Hide comma, space, and name when no user name is set */
.fyi-comma.hidden,
.fyi-space.hidden,
.fyi-name.hidden {
    display: none;
}

/* ==========================================
   HTML Text Formatting (from Google Sheets)
   ========================================== */

/* Color 1: Signature Orange */
.text-color1 {
    color: var(--accent);
}

/* Color 2: Complementary Teal/Blue */
.text-color2 {
    color: #4ECDC4;
}

/* Color 3: Plum/Purple */
.text-color3 {
    color: #6B5C8A;
}

/* Mark: Golden yellow highlight background - vibrant and visible in both themes */
.text-mark {
    background: rgba(255, 215, 0, 0.4); /* Golden yellow (#FFD700) with transparency */
    padding: 1px 4px;
    border-radius: 3px;
    color: inherit;
}

/* Lookup: Orange underlined clickable word */
.text-lookup {
    color: var(--accent);
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 2px;
    cursor: pointer;
    transition: text-decoration-style var(--transition-fast);
}

.text-lookup:hover {
    text-decoration-style: solid;
}

/* Lookup Tooltip */
.lookup-tooltip {
    position: fixed;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-elevated);
    z-index: var(--z-toast);
    max-width: 280px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
    transition: opacity var(--transition-fast), transform var(--transition-fast), visibility var(--transition-fast);
}

.lookup-tooltip.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.lookup-tooltip-header {
    font-family: var(--font-headline);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--accent);
    margin-bottom: var(--spacing-xs);
}

.lookup-tooltip-content {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
}

/* Light mode adjustments for text formatting */
:root.light-mode .text-color2 {
    color: #0D9488;
}

:root.light-mode .text-mark {
    background: rgba(255, 193, 7, 0.45); /* Slightly darker gold (#FFC107) for light backgrounds */
}

/* ==========================================
   Orange Question Bullets
   ========================================== */

.question-label {
    color: var(--accent) !important;
}

.answer-label {
    color: var(--accent) !important;
}

.deep-question-label {
    color: var(--accent) !important;
}

/* ==========================================
   Answer Actions - Dig Deeper Primary, Done Secondary
   ========================================== */

#digDeeperBtn {
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

#digDeeperBtn:hover {
    background: var(--accent-light);
}

#doneBtn {
    background: var(--bg-card);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
}

#doneBtn:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
}

/* ==========================================
   Summary Modal Bullet List
   ========================================== */

.summary-modal-bullets {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.summary-bullet-item {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
}

.summary-bullet-icon {
    color: var(--accent);
    font-size: 14px;
    flex-shrink: 0;
    line-height: 1.7;
}

.summary-bullet-text {
    /* Explicit sizing for cross-platform consistency */
    font-size: 16px;
    line-height: 1.7;
    color: var(--text-secondary);
}

/* ==========================================
   Global Footer
   ========================================== */

.global-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    padding: var(--spacing-sm) var(--spacing-md);
    padding-bottom: calc(var(--spacing-sm) + var(--safe-bottom));
    font-family: 'Satoshi', var(--font-body);
    /* Explicit font-size for cross-platform consistency */
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-tertiary);
    background: linear-gradient(transparent, var(--bg-primary) 50%);
    pointer-events: none;
    z-index: 50;
}
