/**
 * FYI - Premium News PWA
 * Fetches stories from public Google Sheets (no API key needed)
 * Filters to show only today's stories
 */

const APP_VERSION = 'v36-lean';

// ==========================================
// CONFIGURATION - Edit this!
// ==========================================

// Paste your Google Sheet ID here (the long string from the URL)
// Example URL: https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit
// Sheet ID would be: 1ABC123xyz...
const SHEET_ID = '1WfcDbDicaZBmTumU4dqG_349UQIRwfP4eMr8NN7TmYs';

// Sheet name (tab name at bottom of spreadsheet)
const SHEET_NAME = 'Sheet1';

// FAQ Sheet name (separate tab for FAQ content)
const FAQ_SHEET_NAME = 'FAQs';

// ==========================================
// PLAUSIBLE ANALYTICS CONFIGURATION
// ==========================================
// Add your Plausible domain here after signing up at plausible.io
// Example: const PLAUSIBLE_DOMAIN = 'fyi.yourdomain.com';
// Leave as empty string to disable analytics
const PLAUSIBLE_DOMAIN = 'https://fyi-news.netlify.app/';

// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://sxddsipzxpipgyalfurn.supabase.co'; // Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'sb_publishable_Lbs7KPXHwE2ZjvR3Q0OW3w_A3jXsTar'; // Replace with your anon key

// Initialize Supabase client (safe - won't crash if library fails to load)
let supabaseClient = null;
try {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('[Supabase] Library not loaded, running in offline mode');
    }
} catch (e) {
    console.warn('[Supabase] Init failed, running in offline mode:', e.message);
}

// ==========================================
// SUPABASE: Anonymous User Flow
// ==========================================

/**
 * Initialize Supabase user - check for existing session or create anonymous user
 * Called on app load BEFORE showing content
 * @returns {object|null} The authenticated user, or null if Supabase unavailable
 */
async function initializeSupabaseUser() {
    if (!supabaseClient) return null;

    try {
        // Check for existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            await updateLastSeen(session.user.id);

            // Update sign-in button text if user is authenticated (not anonymous)
            if (!session.user.is_anonymous) {
                updateSignInButton(true);
            }

            return session.user;
        }

        // No session - create anonymous user
        const { data, error } = await supabaseClient.auth.signInAnonymously();
        if (error) {
            console.error('[Supabase] Anonymous auth error:', error);
            return null;
        }


        // Insert user record
        await supabaseClient.from('users').insert({
            id: data.user.id,
            is_anonymous: true,
            display_name: 'Reader'
        }).single();

        return data.user;
    } catch (e) {
        console.error('[Supabase] User init failed:', e.message);
        return null;
    }
}

/**
 * Update user's last_seen timestamp
 */
async function updateLastSeen(userId) {
    if (!supabaseClient) return;
    try {
        await supabaseClient.from('users').update({
            last_seen: new Date().toISOString()
        }).eq('id', userId);
    } catch (e) {
    }
}

/**
 * Update sign-in button visibility based on auth state
 */
function updateSignInButton(isSignedIn) {
    const signInBtn = document.getElementById('signInBtn');
    if (signInBtn) {
        signInBtn.textContent = isSignedIn ? 'Signed In' : 'Sign In';
        signInBtn.disabled = isSignedIn;
        if (isSignedIn) {
            signInBtn.style.opacity = '0.5';
        }
    }
}

// ==========================================
// SUPABASE: Sign-In Modal
// ==========================================

function showSignInModal() {
    const modal = document.getElementById('signInModal');
    if (modal) {
        modal.classList.add('visible');
        document.body.classList.add('no-scroll');
    }
}

function hideSignInModal() {
    const modal = document.getElementById('signInModal');
    if (modal) {
        modal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    }
}

function setupSignInModal() {
    const closeBtn = document.getElementById('signInCloseBtn');
    const backdrop = document.getElementById('signInModal');
    const googleBtn = document.getElementById('signInGoogle');
    const appleBtn = document.getElementById('signInApple');
    const signInMenuBtn = document.getElementById('signInBtn');

    if (closeBtn) {
        closeBtn.addEventListener('click', hideSignInModal);
    }

    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) hideSignInModal();
        });
    }

    if (signInMenuBtn) {
        signInMenuBtn.addEventListener('click', () => {
            triggerHaptic('light');
            if (elements.dropdownMenu) elements.dropdownMenu.classList.remove('visible');
            showSignInModal();
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            if (!supabaseClient) {
                showToast('', 'Sign-in unavailable offline');
                return;
            }
            try {
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                });
                if (error) {
                    console.error('[Supabase] Google sign-in error:', error);
                    showToast('', 'Google sign-in failed');
                }
            } catch (e) {
                console.error('[Supabase] Google sign-in error:', e.message);
                showToast('', 'Sign-in failed');
            }
        });
    }

    if (appleBtn) {
        appleBtn.addEventListener('click', async () => {
            if (!supabaseClient) {
                showToast('', 'Sign-in unavailable offline');
                return;
            }
            try {
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'apple',
                    options: { redirectTo: window.location.origin }
                });
                if (error) {
                    console.error('[Supabase] Apple sign-in error:', error);
                    showToast('', 'Apple sign-in failed');
                }
            } catch (e) {
                console.error('[Supabase] Apple sign-in error:', e.message);
                showToast('', 'Sign-in failed');
            }
        });
    }
}

// ==========================================
// SUPABASE: Bookmark Functions
// ==========================================

/**
 * Save a bookmark to Supabase
 * @param {object} bookmarkData - { type, storyDate, storyHeadline, questionPath, content }
 * @returns {boolean} success
 */
async function saveBookmark(bookmarkData) {
    if (!supabaseClient) return false;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) { console.error('[Supabase] No session for bookmark'); return false; }

        // Determine category from story data or auto-guess from headline
        const category = bookmarkData.category ||
                         state.currentStory?.category ||
                         guessCategory(bookmarkData.storyHeadline);

        const { error } = await supabaseClient.from('bookmarks').insert({
            user_id: session.user.id,
            bookmark_type: bookmarkData.type,
            story_date: bookmarkData.storyDate,
            story_headline: bookmarkData.storyHeadline,
            question_path: bookmarkData.questionPath || null,
            bookmark_content: bookmarkData.content,
            category: category
        });

        if (error) {
            if (error.code === '23505') {
                // Duplicate - bookmark already exists, treat as success
                return true;
            }
            console.error('[Supabase] Bookmark save error:', error);
            return false;
        }

        await logSupabaseEvent('bookmark_added', {
            bookmark_type: bookmarkData.type,
            story_headline: bookmarkData.storyHeadline
        });
        return true;
    } catch (e) {
        console.error('[Supabase] saveBookmark failed:', e.message);
        return false;
    }
}

/**
 * Remove a bookmark from Supabase
 */
async function removeBookmark(bookmarkData) {
    if (!supabaseClient) return false;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return false;

        const { error } = await supabaseClient.from('bookmarks').delete().match({
            user_id: session.user.id,
            story_date: bookmarkData.storyDate,
            story_headline: bookmarkData.storyHeadline,
            question_path: bookmarkData.questionPath || null
        });

        if (error) { console.error('[Supabase] Bookmark remove error:', error); return false; }

        await logSupabaseEvent('bookmark_removed', {
            bookmark_type: bookmarkData.type,
            story_headline: bookmarkData.storyHeadline
        });
        return true;
    } catch (e) {
        console.error('[Supabase] removeBookmark failed:', e.message);
        return false;
    }
}

/**
 * Check if an item is bookmarked
 */
async function checkIsBookmarked(storyDate, storyHeadline, questionPath = null) {
    if (!supabaseClient) return false;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return false;

        const query = {
            user_id: session.user.id,
            story_date: storyDate,
            story_headline: storyHeadline
        };
        if (questionPath !== null) {
            query.question_path = questionPath;
        }

        const { data } = await supabaseClient.from('bookmarks')
            .select('id')
            .match(query)
            .single();

        return !!data;
    } catch (e) {
        // .single() throws when no match - that's expected
        return false;
    }
}

/**
 * Get all bookmarks for current user
 */
async function getUserBookmarks() {
    if (!supabaseClient) return [];
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return [];

        const { data, error } = await supabaseClient.from('bookmarks')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) { console.error('[Supabase] Fetch bookmarks error:', error); return []; }
        return data || [];
    } catch (e) {
        console.error('[Supabase] getUserBookmarks failed:', e.message);
        return [];
    }
}

/**
 * Handle bookmark button click - toggle with Supabase persistence
 */
async function handleBookmarkClick(button, bookmarkData) {
    const wasBookmarked = button.classList.contains('bookmarked');

    // Set toggling flag to prevent updateBookmarkStates from overriding UI
    state._bookmarkToggling = true;

    // Toggle UI — this ALWAYS succeeds, never reverts
    button.classList.toggle('bookmarked');
    triggerHaptic('light');

    const isNowBookmarked = button.classList.contains('bookmarked');

    // Sync ALL bookmark buttons for this same context on the current card
    // (summary nav-hints, answer bottom-bar, etc. may each have a bookmark button)
    const currentCard = button.closest('.story-card');
    if (currentCard) {
        currentCard.querySelectorAll('.btn-bookmark').forEach(btn => {
            if (btn !== button) {
                btn.classList.toggle('bookmarked', isNowBookmarked);
            }
        });
    }

    // Save to localStorage for persistence across sessions
    const localKey = `fyi_bk_${bookmarkData.storyHeadline}_${bookmarkData.questionPath || 'story'}`;
    if (isNowBookmarked) {
        localStorage.setItem(localKey, '1');
    } else {
        localStorage.removeItem(localKey);
    }

    showToast('', isNowBookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');

    // Clear toggling flag after UI is stable
    setTimeout(() => { state._bookmarkToggling = false; }, 1000);

    // Fire-and-forget Supabase sync — never revert UI on failure
    if (supabaseClient) {
        try {
            if (wasBookmarked) {
                await removeBookmark(bookmarkData);
            } else {
                await saveBookmark(bookmarkData);
            }
        } catch (e) {
        }
    }
}

// ==========================================
// SUPABASE: Analytics Event Logging
// ==========================================

/**
 * Log an analytics event to Supabase
 * @param {string} eventType - Event type name
 * @param {object} eventData - Event payload
 */
async function logSupabaseEvent(eventType, eventData = {}) {
    if (!supabaseClient) return;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const sessionId = sessionStorage.getItem('fyi_session_id') || generateSupabaseSessionId();

        await supabaseClient.from('analytics_events').insert({
            user_id: session.user.id,
            event_type: eventType,
            event_data: eventData,
            session_id: sessionId
        });
    } catch (e) {
    }
}

/**
 * Generate a unique session ID for analytics
 */
function generateSupabaseSessionId() {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('fyi_session_id', id);
    return id;
}

// ==========================================
// SUPABASE: Bookmark State Management
// ==========================================

/**
 * Update bookmark button states for the current story
 * Checks Supabase to see if story/answer is bookmarked and updates UI
 */
async function updateBookmarkStates() {
    // Don't override optimistic UI during an active toggle
    if (state._bookmarkToggling) {
        return;
    }

    const currentStory = state.stories[state.currentIndex];
    if (!currentStory) return;

    // Check localStorage first (always available, always authoritative)
    const localKey = `fyi_bk_${currentStory.headline}_story`;
    const isLocallyBookmarked = localStorage.getItem(localKey) === '1';

    // Try Supabase if available, but fall back to localStorage
    let isStoryBookmarked = isLocallyBookmarked;

    if (supabaseClient) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                const supabaseResult = await checkIsBookmarked(
                    currentStory.date,
                    currentStory.headline,
                    null
                );
                // Supabase is source of truth IF we have a session
                isStoryBookmarked = supabaseResult || isLocallyBookmarked;
            }
        } catch (e) {
        }
    }

    // Don't override if toggle happened while we were querying
    if (state._bookmarkToggling) return;

    // Update all story-level bookmark buttons on current card
    document.querySelectorAll('.btn-bookmark').forEach(btn => {
        // Only update story-level bookmarks (not answer-level ones inside answer cards)
        if (!btn.closest('.answer-card') && !btn.closest('.dig-deeper-answer-card')) {
            btn.classList.toggle('bookmarked', isStoryBookmarked);
        }
    });
}

// ==========================================
// BOOKMARKS PAGE FUNCTIONALITY
// ==========================================

const BOOKMARK_CATEGORIES = [
    'Politics',
    'Economy',
    'Technology',
    'Business',
    'World',
    'India',
    'Science',
    'Culture',
    'Uncategorized'
];

let currentBookmarks = [];
let filteredBookmarks = [];

/**
 * Open bookmarks page overlay
 */
function openBookmarksPage() {
    if (elements.bookmarksPage) {
        elements.bookmarksPage.classList.add('visible');
        document.body.classList.add('no-scroll');
        loadBookmarksPage();
        trackEvent('Bookmarks Page Opened');
    }
}

/**
 * Close bookmarks page overlay
 */
function closeBookmarksPage() {
    if (elements.bookmarksPage) {
        elements.bookmarksPage.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    }
}

/**
 * Load all bookmarks from Supabase
 */
async function loadBookmarksPage() {
    if (!supabaseClient) {
        showBookmarksEmpty('Sign in to see your bookmarks');
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (!session) {
            showBookmarksEmpty('Sign in to see your bookmarks');
            return;
        }

        const { data, error } = await supabaseClient
            .from('bookmarks')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Bookmarks] Load error:', error);
            showBookmarksEmpty('Error loading bookmarks');
            return;
        }

        currentBookmarks = data || [];
        populateCategoryFilter();
        applyBookmarkFilters();

    } catch (err) {
        console.error('[Bookmarks] Load failed:', err);
        showBookmarksEmpty('Error loading bookmarks');
    }
}

/**
 * Populate category filter dropdown with used categories
 */
function populateCategoryFilter() {
    if (!elements.filterCategory) return;

    // Get unique categories from bookmarks
    const usedCategories = [...new Set(
        currentBookmarks.map(b => b.category || 'Uncategorized')
    )];

    let optionsHTML = '<option value="all">All categories</option>';
    usedCategories.sort().forEach(category => {
        optionsHTML += `<option value="${escapeHTMLAttr(category)}">${escapeBookmarkHTML(category)}</option>`;
    });

    elements.filterCategory.innerHTML = optionsHTML;
}

/**
 * Apply date and category filters
 */
function applyBookmarkFilters() {
    const dateFilter = elements.filterDate?.value || 'all';
    const categoryFilter = elements.filterCategory?.value || 'all';

    filteredBookmarks = currentBookmarks.filter(bookmark => {
        // Date filter
        if (dateFilter !== 'all') {
            const bookmarkDate = new Date(bookmark.created_at);
            const now = new Date();

            if (dateFilter === 'today') {
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (bookmarkDate < today) return false;
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (bookmarkDate < weekAgo) return false;
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (bookmarkDate < monthAgo) return false;
            }
        }

        // Category filter
        if (categoryFilter !== 'all') {
            const bookmarkCategory = bookmark.category || 'Uncategorized';
            if (bookmarkCategory !== categoryFilter) return false;
        }

        return true;
    });

    renderBookmarksList();
}

/**
 * Render the bookmarks list UI
 */
function renderBookmarksList() {
    if (!elements.bookmarksList || !elements.bookmarksEmpty) return;

    if (filteredBookmarks.length === 0) {
        elements.bookmarksList.style.display = 'none';
        elements.bookmarksEmpty.style.display = 'flex';
        return;
    }

    elements.bookmarksList.style.display = 'flex';
    elements.bookmarksEmpty.style.display = 'none';

    elements.bookmarksList.innerHTML = filteredBookmarks.map(bookmark => {
        const badge = getBookmarkBadge(bookmark);
        const formattedDate = formatBookmarkDate(bookmark.created_at);
        const category = bookmark.category || 'Uncategorized';
        const questionText = bookmark.bookmark_content?.question_text || '';

        return `
            <div class="bookmark-card" data-bookmark-id="${bookmark.id}" onclick="handleBookmarkCardClick('${bookmark.id}')">
                <div class="bookmark-badge">${badge}</div>
                <div class="bookmark-content-wrap">
                    <h3 class="bookmark-headline">${escapeBookmarkHTML(bookmark.story_headline)}</h3>
                    ${questionText ? `<p class="bookmark-question">${escapeBookmarkHTML(questionText)}</p>` : ''}
                    <div class="bookmark-meta">
                        <span class="bookmark-category-tag">${escapeBookmarkHTML(category)}</span>
                        <span class="bookmark-date">${formattedDate}</span>
                    </div>
                </div>
                <button class="bookmark-delete-btn" onclick="event.stopPropagation(); handleDeleteBookmark('${bookmark.id}')" aria-label="Delete bookmark">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Get badge content for a bookmark
 * Story bookmarks show star, Q&A show numbers, Dig deeper show letters
 */
function getBookmarkBadge(bookmark) {
    const type = bookmark.bookmark_type;
    const path = bookmark.question_path;

    if (type === 'story' || !path) {
        return '&#9733;'; // Star for story
    }

    // Parse question path: 'Q1', 'Q2', 'Q1-A', 'Q2-B', etc.
    if (path.includes('-')) {
        // Dig deeper: Q1-A, Q1-B, etc.
        const letter = path.split('-')[1];
        return letter;
    } else {
        // Main question: Q1, Q2, etc.
        const number = path.replace('Q', '');
        return number;
    }
}

/**
 * Format bookmark date relative to now
 */
function formatBookmarkDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
        });
    }
}

/**
 * Escape HTML for safe rendering in bookmark cards
 */
function escapeBookmarkHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escape HTML for use in attribute values
 */
function escapeHTMLAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Show empty state with custom message
 */
function showBookmarksEmpty(message) {
    if (!elements.bookmarksList || !elements.bookmarksEmpty) return;
    elements.bookmarksList.style.display = 'none';
    elements.bookmarksEmpty.style.display = 'flex';

    const emptyText = elements.bookmarksEmpty.querySelector('.empty-text');
    if (emptyText && message) {
        emptyText.textContent = message;
    }
}

/**
 * Handle clicking a bookmark card - navigate to the bookmarked content
 */
function handleBookmarkCardClick(bookmarkId) {
    const bookmark = currentBookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    // Close bookmarks page
    closeBookmarksPage();

    // Find the story by headline in current stories
    const storyIndex = state.stories.findIndex(s =>
        s.headline === bookmark.story_headline
    );

    if (storyIndex === -1) {
        showToast('i', 'Story not in current list');
        return;
    }

    // Navigate to the story
    navigateToStoryIndex(storyIndex);

    const questionPath = bookmark.question_path;

    // If bookmark is for a specific question/answer, navigate there after a delay
    if (questionPath) {
        setTimeout(() => {
            const currentCard = document.querySelector('.story-card[data-card-type="current"]');
            const currentStory = state.stories[state.currentIndex];
            if (!currentCard || !currentStory) return;

            // First flip to summary to reveal Q&A
            flipCard(currentCard, currentStory);
            state.isCardFlipped = true;
            state.cardLayer = 'summary';
            updateBackButtonVisibility();

            setTimeout(() => {
                // Show Q&A
                setQACardState(QA_STATES.ACTIVE);
                state.cardLayer = 'questions';
                updateBackButtonVisibility();
                setupQACardSwipe();

                if (questionPath.includes('-')) {
                    // Dig deeper answer: Q1-A, Q1-B, etc.
                    const parts = questionPath.split('-');
                    const qNum = parseInt(parts[0].replace('Q', '')) - 1;
                    const digDeeperIndex = parts[1].charCodeAt(0) - 65; // A=0, B=1

                    setTimeout(() => {
                        showAnswerCard(qNum);
                        setTimeout(() => {
                            showDigDeeperQACard();
                            setTimeout(() => {
                                showDigDeeperAnswerCard(digDeeperIndex);
                            }, 300);
                        }, 300);
                    }, 300);
                } else {
                    // Main question: Q1, Q2, etc.
                    const questionIndex = parseInt(questionPath.replace('Q', '')) - 1;
                    setTimeout(() => {
                        showAnswerCard(questionIndex);
                    }, 300);
                }
            }, 300);
        }, 500);
    }
}

/**
 * Navigate to a specific story index
 */
function navigateToStoryIndex(targetIndex) {
    if (targetIndex < 0 || targetIndex >= state.stories.length) return;

    // Use existing navigation
    state.currentIndex = targetIndex;
    renderCards();
    updateProgress();
}

/**
 * Handle deleting a bookmark
 */
async function handleDeleteBookmark(bookmarkId) {
    if (!supabaseClient) return;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const { error } = await supabaseClient
            .from('bookmarks')
            .delete()
            .eq('id', bookmarkId)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('[Bookmarks] Delete error:', error);
            showToast('!', 'Failed to delete bookmark');
            return;
        }

        // Remove from local arrays
        currentBookmarks = currentBookmarks.filter(b => b.id !== bookmarkId);
        applyBookmarkFilters();

        showToast('&#10003;', 'Bookmark removed');
        trackEvent('Bookmark Deleted');
    } catch (err) {
        console.error('[Bookmarks] Delete failed:', err);
        showToast('!', 'Failed to delete bookmark');
    }
}

/**
 * Auto-categorize a story based on headline keywords
 * Used as fallback when no category is provided
 */
function guessCategory(headline) {
    if (!headline) return 'Uncategorized';
    const lower = headline.toLowerCase();

    if (lower.includes('election') || lower.includes('government') || lower.includes('minister') ||
        lower.includes('parliament') || lower.includes('modi') || lower.includes('congress') ||
        lower.includes('bjp') || lower.includes('political') || lower.includes('vote')) {
        return 'Politics';
    }
    if (lower.includes('economy') || lower.includes('gdp') || lower.includes('inflation') ||
        lower.includes('rbi') || lower.includes('fiscal') || lower.includes('budget') ||
        lower.includes('rupee') || lower.includes('stock market') || lower.includes('sensex')) {
        return 'Economy';
    }
    if (lower.includes('tech') || lower.includes('ai') || lower.includes('startup') ||
        lower.includes('software') || lower.includes('google') || lower.includes('apple') ||
        lower.includes('meta') || lower.includes('microsoft') || lower.includes('openai') ||
        lower.includes('digital') || lower.includes('app') || lower.includes('robot')) {
        return 'Technology';
    }
    if (lower.includes('business') || lower.includes('company') || lower.includes('profit') ||
        lower.includes('revenue') || lower.includes('ceo') || lower.includes('merger') ||
        lower.includes('acquisition') || lower.includes('ipo') || lower.includes('tata') ||
        lower.includes('reliance') || lower.includes('adani')) {
        return 'Business';
    }
    if (lower.includes('china') || lower.includes('usa') || lower.includes('europe') ||
        lower.includes('russia') || lower.includes('ukraine') || lower.includes('global') ||
        lower.includes('world') || lower.includes('un') || lower.includes('nato') ||
        lower.includes('war') || lower.includes('trade war') || lower.includes('sanctions')) {
        return 'World';
    }
    if (lower.includes('india') || lower.includes('delhi') || lower.includes('mumbai') ||
        lower.includes('bengaluru') || lower.includes('chennai') || lower.includes('hyderabad') ||
        lower.includes('kolkata') || lower.includes('indian')) {
        return 'India';
    }
    if (lower.includes('science') || lower.includes('space') || lower.includes('nasa') ||
        lower.includes('isro') || lower.includes('research') || lower.includes('climate') ||
        lower.includes('health') || lower.includes('vaccine') || lower.includes('medical')) {
        return 'Science';
    }
    if (lower.includes('culture') || lower.includes('film') || lower.includes('movie') ||
        lower.includes('music') || lower.includes('art') || lower.includes('cricket') ||
        lower.includes('sport') || lower.includes('bollywood') || lower.includes('oscar')) {
        return 'Culture';
    }

    return 'Uncategorized';
}

// ==========================================
// Analytics Helper Functions (Plausible)
// ==========================================

/**
 * Track an event with Plausible Analytics
 * Safe wrapper that won't break the app if Plausible fails to load
 * @param {string} eventName - The name of the event
 * @param {object} props - Optional properties to track
 */
function trackEvent(eventName, props = {}) {
    try {
        // Only track if Plausible is loaded and domain is configured
        if (typeof window.plausible !== 'undefined' && PLAUSIBLE_DOMAIN) {
            window.plausible(eventName, { props });
        }
    } catch (e) {
        // Silently fail - analytics should never break the app
    }
}

/**
 * Track app open event
 */
function trackAppOpened() {
    trackEvent('App Opened');
}

/**
 * Track story viewed event
 * @param {number} storyNumber - Which story (1, 2, or 3)
 * @param {string} headline - The story headline
 */
function trackStoryViewed(storyNumber, headline) {
    trackEvent('Story Viewed', {
        story: storyNumber,
        headline: headline.substring(0, 100) // Limit length
    });
}

/**
 * Track question clicked event
 * @param {string} storyHeadline - The story headline
 * @param {string} questionText - The question text
 */
function trackQuestionClicked(storyHeadline, questionText) {
    trackEvent('Question Clicked', {
        story: storyHeadline.substring(0, 50),
        question: questionText.substring(0, 100)
    });
}

/**
 * Track rating given event
 * @param {string} storyHeadline - The story headline
 * @param {number} rating - Rating value (1-5)
 */
function trackRatingGiven(storyHeadline, rating) {
    trackEvent('Rating Given', {
        story: storyHeadline.substring(0, 50),
        rating: rating
    });
}

/**
 * Track answer rated event (new card system)
 * @param {string} storyHeadline - The story headline
 * @param {string} questionText - The question that was answered
 * @param {number} rating - Rating value (1-5)
 */
function trackAnswerRated(storyHeadline, questionText, rating) {
    trackEvent('Answer Rated', {
        story: storyHeadline ? storyHeadline.substring(0, 50) : 'Unknown',
        question: questionText ? questionText.substring(0, 50) : 'Unknown',
        rating: rating
    });
}

/**
 * Track modal opened event
 * @param {string} modalName - 'What is FYI' or 'Our Philosophy'
 */
function trackModalOpened(modalName) {
    trackEvent('Modal Opened', {
        modal: modalName
    });
}

/**
 * Track theme changed event
 * @param {string} theme - 'light' or 'dark'
 */
function trackThemeChanged(theme) {
    trackEvent('Theme Changed', {
        theme: theme
    });
}

/**
 * Track card swipe event
 * @param {string} direction - 'skip' (left) or 'curious' (right)
 * @param {string} headline - The story headline
 * @param {number} storyNumber - Which story (1, 2, or 3)
 */
function trackSwipe(direction, headline, storyNumber) {
    trackEvent('Card Swiped', {
        direction: direction,
        story: storyNumber,
        headline: headline.substring(0, 50)
    });
}

/**
 * Track card flip event
 * @param {string} headline - The story headline
 * @param {string} side - 'to_summary' or 'to_front'
 */
function trackCardFlip(headline, side) {
    trackEvent('Card Flipped', {
        side: side,
        headline: headline.substring(0, 50)
    });
}

/**
 * Track completion screen viewed
 * @param {number} storiesRead - Number of stories completed
 * @param {number} curiousCount - Number of stories swiped curious
 */
function trackCompletionViewed(storiesRead, curiousCount) {
    trackEvent('Completion Viewed', {
        stories_read: storiesRead,
        curious_count: curiousCount
    });
}

/**
 * Track Dig Deeper interaction
 * @param {string} headline - The story headline
 * @param {string} deepQuestion - The deep question clicked
 */
function trackDigDeeper(headline, deepQuestion) {
    trackEvent('Dig Deeper Clicked', {
        headline: headline.substring(0, 50),
        question: deepQuestion.substring(0, 100)
    });
}

/**
 * Track archive/recap viewed
 * @param {string} source - 'completion_button' or 'header_recap'
 */
function trackRecapViewed(source) {
    trackEvent('Recap Viewed', {
        source: source
    });
}

/**
 * Track archive story opened
 * @param {string} headline - The story headline
 * @param {string} date - The story date
 */
function trackArchiveStoryOpened(headline, date) {
    trackEvent('Archive Story Opened', {
        headline: headline.substring(0, 50),
        date: date
    });
}

/**
 * Track skip question (when user skips all questions)
 * @param {string} headline - The story headline
 */
function trackQuestionsSkipped(headline) {
    trackEvent('Questions Skipped', {
        headline: headline.substring(0, 50)
    });
}

/**
 * Track session duration when user leaves
 * Called on page unload
 */
function trackSessionEnd() {
    const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000);
    trackEvent('Session Ended', {
        duration_seconds: sessionDuration,
        stories_completed: state.currentIndex
    });
}

// Session start time for duration tracking
const sessionStartTime = Date.now();

// ==========================================
// FIXED CARD HEIGHT SYSTEM
// ==========================================
// Calculate and set explicit card height as CSS custom property
// This ensures all story cards have identical height regardless of content

/**
 * Calculate and set the fixed card height based on viewport
 * Called on init, resize, and orientation change
 */
function setCardHeight() {
    // Safety buffer for browser chrome, Android scaling, and visual breathing room
    const BUFFER = 100;

    // Use most conservative viewport measurement
    const viewportHeight = Math.min(
        window.innerHeight,
        document.documentElement.clientHeight,
        window.visualViewport?.height || Infinity
    );

    // Measure actual elements when possible, with fallbacks
    const header = document.querySelector('.header');
    const progressArea = document.querySelector('.progress-area');

    const headerHeight = header ? header.offsetHeight : 60;
    const progressHeight = progressArea ? progressArea.offsetHeight : 50;

    // Get safe areas with sensible defaults
    const rootStyles = getComputedStyle(document.documentElement);
    const safeTop = parseInt(rootStyles.getPropertyValue('--sat')) || 0;
    const safeBottom = parseInt(rootStyles.getPropertyValue('--sab')) || 20; // Default accounts for gesture areas

    // Bottom margin for visual breathing room
    const bottomMargin = 24;

    // Calculate available height (conservative) — 85% of previous for compact sizing
    let cardHeight = (viewportHeight - headerHeight - progressHeight - safeTop - safeBottom - bottomMargin - BUFFER) * 0.85;

    // Cap at 75vh for breathing room
    const maxHeight = viewportHeight * 0.75;
    cardHeight = Math.min(cardHeight, maxHeight);

    // Enforce 1.5:1 max aspect ratio (height:width)
    // Card max-width is min(340px, 77vw) — estimate actual card width
    const viewportWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
    const cardWidth = Math.min(340, viewportWidth * 0.77);
    const maxAspectHeight = cardWidth * 1.5;
    cardHeight = Math.min(cardHeight, maxAspectHeight);

    // Set as CSS custom property
    document.documentElement.style.setProperty('--card-height', cardHeight + 'px');

}

/**
 * Initialize card height system with event listeners
 */
function initCardHeightSystem() {
    // Set initial height
    setCardHeight();

    // Update on resize
    window.addEventListener('resize', setCardHeight);

    // Update on orientation change (with delay for iOS)
    window.addEventListener('orientationchange', () => {
        setTimeout(setCardHeight, 100);
    });

    // For iOS Safari: use visualViewport API if available
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', setCardHeight);
    }
}

// ==========================================
// Fallback Story Data (used when sheet not configured)
// ==========================================

const fallbackStories = [
    {
        id: 1,
        date: getTodayDate(),
        emoji: "📉",
        headline: "Gold Prices Crash After Heavy Liquidation",
        teaser: "Investors are booking profits after gold hit record highs, triggering algorithmic selling and a sharp correction in global markets. This market behavior reveals the psychology behind profit-taking and the technical levels that matter to institutional traders. Central banks continue accumulating while retail investors panic—creating an interesting divergence in market sentiment.",
        summary: "Gold prices fell sharply as investors took profits after the precious metal hit record highs near $2,450/oz. The sell-off was accelerated by algorithmic trading and institutional limit orders set at psychological price barriers. Despite the correction, central banks—particularly in Asia—continue accumulating gold reserves, signaling long-term confidence in the asset as a hedge against economic uncertainty.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Why are investors selling NOW after gold hit records?",
                answer: "Classic profit-taking psychology. Gold touched $2,450/oz—a psychological barrier that triggered algorithmic selling. Large institutional investors had set limit orders at this level months ago. Additionally, recent Fed signals suggesting delayed rate cuts reduced gold's appeal as a hedge. When momentum traders see others exiting, FOMO works in reverse.",
                deepQuestions: [
                    { text: "What makes $2,450 a psychological barrier?", answer: "Round numbers act as mental anchors for traders. Institutions set automatic sell orders at these levels, and when multiple orders trigger simultaneously, it creates a cascade effect. This is why you see sharp movements at price points like $2,000, $2,250, and $2,500." },
                    { text: "How do algorithmic traders impact gold prices?", answer: "Algorithms now account for 60-70% of trading volume. They detect patterns and execute trades in milliseconds. When algorithms sense selling momentum, they amplify it by front-running expected price drops, creating self-fulfilling prophecies." },
                    { text: "Why does Fed policy affect gold so much?", answer: "Gold doesn't pay interest or dividends. When the Fed keeps rates high, bonds become more attractive alternatives. Gold's appeal increases when real interest rates (adjusted for inflation) are low or negative, making holding gold less costly compared to interest-bearing assets." }
                ]
            },
            {
                label: "✦",
                text: "Does this mean gold isn't safe anymore?",
                answer: "Not at all—this is normal market behavior, not a fundamental shift. Gold remains the ultimate crisis hedge. What we're seeing is a technical correction after a 15% rally. Long-term holders aren't selling; it's primarily short-term traders and algorithms. Central banks, especially in Asia, continue accumulating.",
                deepQuestions: [
                    { text: "What's the difference between a correction and a crash?", answer: "A correction is typically a 10-20% decline from recent highs and is considered healthy market behavior. A crash implies a sudden, severe decline (20%+) often driven by panic. This gold movement is firmly in correction territory—normal after any strong rally." },
                    { text: "Why are central banks still buying gold?", answer: "Central banks are diversifying away from US dollar reserves due to geopolitical risks and inflation concerns. China, Russia, and Turkey have been major buyers. Gold offers protection against currency devaluation and can't be sanctioned or frozen like foreign currency reserves." }
                ]
            },
            {
                label: "✦",
                text: "How is USD recovering with Trump chaos?",
                answer: "Counterintuitively, political uncertainty often strengthens the dollar short-term. Global investors flee to USD-denominated assets during volatility—it's still the world's reserve currency. Meanwhile, other major economies face their own issues: Europe's stagnation, China's property crisis, Japan's weak yen.",
                deepQuestions: [
                    { text: "Why do investors run TO the dollar during US political chaos?", answer: "It's the 'cleanest dirty shirt' phenomenon. Despite domestic turmoil, US markets remain the deepest and most liquid globally. Treasury bonds are still considered the safest assets. When uncertainty hits anywhere, the reflex is to buy dollars first, ask questions later." },
                    { text: "Could another currency replace the dollar?", answer: "Not soon. The dollar represents 60% of global reserves and 88% of forex trades. No alternative has the liquidity, legal framework, or trust. China's yuan has capital controls, Europe lacks unified fiscal policy, and crypto is too volatile. Change would take decades, not years." }
                ]
            }
        ]
    },
    {
        id: 2,
        date: getTodayDate(),
        emoji: "🤝",
        headline: "India-UAE Sign Nuclear, Defence, Trade Pacts",
        teaser: "A landmark strategic partnership bundles nuclear cooperation, defense agreements, and trade access into one comprehensive deal. The diplomatic move creates powerful interdependencies between both nations that extend far beyond traditional bilateral relations. This agreement signals a major shift in Middle East power dynamics and energy security frameworks.",
        summary: "India and the UAE signed a comprehensive strategic partnership covering nuclear energy cooperation, defense technology sharing, and expanded trade access. The deal includes training for UAE nuclear engineers and potential export of Indian defense systems like BrahMos missiles. This bundled approach creates mutual dependencies that strengthen bilateral ties and positions both nations advantageously in the evolving Middle East power structure.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Why bundle nuclear + defense + trade together?",
                answer: "It's diplomatic leverage maximization. Bundling creates interdependencies that make either party think twice before souring relations. If UAE wants nuclear cooperation, they commit to defense purchases. If India wants trade access, they share technology. Each component serves as insurance for the others.",
                deepQuestions: [
                    { text: "Is this bundling strategy common in international deals?", answer: "Yes, it's called 'package diplomacy.' The US does it with arms sales tied to political alignment. China's Belt and Road bundles infrastructure with resource access. The strategy reduces the risk of one-sided agreements and creates lasting partnerships." },
                    { text: "What does India gain from this specific bundle?", answer: "India gets a reliable energy partner, a major defense export market, and preferential trade terms. UAE's oil-rich economy provides investment capital India needs. The defense sales boost India's 'Make in India' initiative and establish it as a credible arms exporter." }
                ]
            },
            {
                label: "✦",
                text: "Since when does UAE have nuclear capability?",
                answer: "UAE's Barakah Nuclear Power Plant went operational in 2020—the first in the Arab world. They're not building weapons; this is about clean energy. The country aims for 25% nuclear power by 2030. India's cooperation involves training UAE engineers and potentially supplying components.",
                deepQuestions: [
                    { text: "Why would an oil-rich country need nuclear power?", answer: "Forward-thinking energy policy. UAE knows oil is finite and faces climate pressure. Nuclear provides baseload power for industry and desalination. Using oil for export rather than domestic consumption maximizes revenue. It's also about prestige and technological advancement." },
                    { text: "Is there any weapons proliferation risk here?", answer: "UAE signed the 'gold standard' 123 Agreement with the US, explicitly renouncing enrichment and reprocessing. They import fuel and return spent rods. The IAEA monitors closely. This is genuinely a civilian energy program—among the most transparent globally." }
                ]
            },
            {
                label: "✦",
                text: "Why UAE and not Russia for defense?",
                answer: "Russia's Ukraine situation changed everything. Their weapons are now battle-tested—and found wanting. Export capacity dropped as they prioritize domestic needs. Western sanctions complicate spare parts. India offers a middle path: proven systems like BrahMos missiles, no sanctions risk.",
                deepQuestions: [
                    { text: "How has Ukraine changed perceptions of Russian weapons?", answer: "Russian tanks, aircraft, and air defense systems have shown vulnerabilities against Western weapons. The vaunted T-90 tanks proved vulnerable to Javelins. Their inability to achieve air superiority raised questions about their aircraft. Buyers now question if they're getting reliable technology." },
                    { text: "What makes Indian defense equipment attractive?", answer: "India offers a 'non-aligned' option—no political strings attached. BrahMos missiles are genuinely world-class (fastest cruise missiles). Indian equipment often incorporates both Russian and Western technology, offering a unique hybrid. Pricing is competitive with generous financing." }
                ]
            }
        ]
    },
    {
        id: 3,
        date: getTodayDate(),
        emoji: "🤖",
        headline: "India Sets Up AI Task Force for Vulnerabilities",
        teaser: "The government has established a dedicated committee to assess AI model risks and develop regulatory frameworks for emerging technologies. This move positions India in the global conversation on AI governance alongside the EU and US, while balancing innovation incentives with safety concerns. The task force includes experts from major tech companies and academic institutions.",
        summary: "India formed a dedicated AI task force to assess vulnerabilities in AI models and develop appropriate regulatory frameworks. The committee includes experts from Google DeepMind, Microsoft Research India, and leading academic institutions. With a 6-month deadline for initial recommendations, India aims to establish its voice in global AI governance while balancing innovation with safety—particularly focusing on challenges unique to its context like misinformation in local languages.",
        imageUrl: "",
        questions: [
            {
                label: "✦",
                text: "Does India even have AI expertise for this?",
                answer: "More than people assume. India has the world's second-largest AI talent pool after the US. IITs and IISc produce top researchers; many return from Silicon Valley. The task force includes people from Google DeepMind, Microsoft Research India, and TCS Research.",
                deepQuestions: [
                    { text: "Why does India have such a large AI talent pool?", answer: "It's the engineering education infrastructure. India produces 1.5 million engineering graduates annually. Top IITs are globally competitive. Plus, the Indian diaspora in Silicon Valley creates a reverse brain drain as senior researchers return to lead labs at Google, Microsoft, and Amazon in India." },
                    { text: "How does India's AI research compare globally?", answer: "India ranks 5th globally in AI research publications. Indian researchers have contributed to major breakthroughs in NLP (particularly multilingual models), computer vision, and AI for healthcare. The gap is in funding and compute resources rather than talent." }
                ]
            },
            {
                label: "✦",
                text: "Will this just be another 3-year report nobody reads?",
                answer: "Valid skepticism, but timing matters. Unlike past tech committees, AI regulation has global urgency—EU's AI Act, Biden's executive order, China's rules. India can't afford to be left out of standard-setting. The task force has a 6-month deadline for initial recommendations.",
                deepQuestions: [
                    { text: "What's different about this task force?", answer: "Three things: tight deadline (6 months vs typical 2-3 years), industry participation (not just bureaucrats), and clear mandate (actionable recommendations, not just observations). The pressure from global AI regulation race adds external accountability." },
                    { text: "How has India's past tech regulation performed?", answer: "Mixed. IT Act 2000 was forward-thinking. Data Protection Bill took 5 years and multiple drafts. Digital India initiatives moved fast. The pattern suggests urgency and industry involvement correlate with better outcomes—both present here." }
                ]
            },
            {
                label: "✦",
                text: "Why not outsource to EU? They're ahead on regulation",
                answer: "EU's AI Act is designed for European values and market structures—privacy-first, precautionary principle, heavy compliance costs. India's priorities differ: enabling AI adoption for development, protecting against misinformation in local languages, and maintaining tech sovereignty.",
                deepQuestions: [
                    { text: "What are India-specific AI challenges?", answer: "Misinformation in 22 official languages (EU deals with ~24 but lower linguistic diversity), deepfakes in elections with 900 million voters, AI for agricultural advisories to 120 million farmers, and bias in systems trained predominantly on Western data. Generic Western frameworks don't address these." },
                    { text: "What does 'tech sovereignty' mean for AI?", answer: "It means not depending on foreign-controlled AI systems for critical applications. India wants domestic capability in foundational AI models, control over training data, and the ability to audit systems used in governance. It's about strategic autonomy, not isolation." }
                ]
            }
        ]
    }
];

// ==========================================
// Helper Functions
// ==========================================

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    // Handle various date formats
    const str = String(dateStr).trim();
    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    // Try MM/DD/YYYY
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
        return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
    // Try DD/MM/YYYY
    const match2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match2) {
        return `${match2[3]}-${match2[2].padStart(2, '0')}-${match2[1].padStart(2, '0')}`;
    }
    return str;
}

// ==========================================
// App State
// ==========================================

const state = {
    stories: [],
    currentIndex: 0,
    totalStories: 0,
    currentStory: null,
    currentQuestion: null, // Track current Q&A question for Dig Deeper
    currentSection: 'today',
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0, // Track vertical movement for up/down swipes
    dragThreshold: 50, // Reduced from 100 for new swipe mechanics
    swipeVelocityThreshold: 0.3, // px/ms velocity threshold
    swipeStartTime: 0, // Track swipe start time for velocity calculation
    hasShownHint: false,
    rating: 0,
    history: [],
    theme: 'dark',
    isLoading: true,
    viewedStories: [],
    userName: '',
    // Archive mode
    archiveMode: false,
    archiveStories: [],
    archiveIndex: 0,
    originalStories: [], // Store today's stories when entering archive mode
    // Track if navigated from completion screen
    cameFromCompletion: false,
    // Track if in recap view (accessed from completion)
    inRecapView: false,
    // FAQ mode
    faqMode: false,
    faqStories: [],
    faqIndex: 0,
    faqCompleted: false, // Track if user has completed FAQ onboarding
    // Content mode: 'stories', 'faqs', or 'archives'
    contentMode: 'stories',
    // First-time user choice tracking
    isFirstTimeUser: true,
    showedWelcomeChoice: false,
    showFAQsAfterName: false, // Flag to show FAQs after name entry
    // Track if entered archives from no-stories page
    enteredArchivesFromNoStories: false,
    // App mode state machine: 'welcome', 'faqs', 'stories', 'archives', 'no_stories'
    appMode: 'welcome',

    // NEW: Card layer stack for navigation
    // Layers: 'headline' (front) -> 'summary' (flipped) -> 'questions' -> 'answer' -> 'deep-questions' -> 'deep-answer'
    cardLayer: 'headline', // Current visible layer
    // Track if card is flipped (on summary side)
    isCardFlipped: false,

    // Q&A Card State: 'hidden' | 'peeking' | 'active'
    qaCardState: 'hidden',

    // Track selected question indices for Answer and Dig Deeper flows
    currentQuestionIndex: null,          // Index of selected question (0-3)
    currentDigDeeperQuestionIndex: null, // Index of selected dig deeper question (0-2)

    // Track current navigation path for dynamic progress bar coloring
    currentPath: { l3QuestionIndex: null, l5QuestionIndex: null },

};

// Q&A Card States - TWO STATES (peeking removed to fix bottom bar visibility)
const QA_STATES = {
    HIDDEN: 'hidden',   // Below viewport, not visible
    ACTIVE: 'active'    // Fully visible, user can tap questions
};

// Simple state-based back navigation map — each layer maps to its previous layer
const BACK_NAVIGATION_MAP = {
    'summary': 'headline',
    'questions': 'summary',
    'answer': 'questions',
    'dig-deeper-qa': 'answer',
    'dig-deeper-answer': 'dig-deeper-qa'
};

// ==========================================
// COLOR-CODED QUESTION BULLETS
// ==========================================

// L3 Question colors (parent questions Q1, Q2, Q3)
const L3_QUESTION_COLORS = [
    '#A8DADC', // Q1 - pastel blue
    '#B5E7A0', // Q2 - pastel green
    '#F4D58D'  // Q3 - pastel gold
];

// L5 Question colors (child dig-deeper questions, indexed by [parentIndex][childIndex])
const L5_QUESTION_COLORS = [
    ['#89CFF0', '#7EC8E3', '#B8B8FF'],  // Q1's children: aqua, light sky, periwinkle
    ['#77DD77', '#40E0D0', '#98FF98'],   // Q2's children: grass, turquoise, mint
    ['#FFD700', '#FFFDD0', '#F4A460']    // Q3's children: pale gold, cream, sand
];

// Determine if text should be dark on a light background for contrast
function getContrastTextColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#333333' : '#FFFFFF';
}

// Background blob color palette — maps navigation state to blob color
const BACKGROUND_COLORS = {
    headline: '#DA7756',              // Level 1: App accent (orange)
    summary: '#DA7756',               // Level 2: Same accent
    questions: '#DA7756',             // Q&A list: Same accent
    q1: '#A8DADC',                    // L3 Q1 answer - Blue
    q2: '#B5E7A0',                    // L3 Q2 answer - Green
    q3: '#F4D58D',                    // L3 Q3 answer - Golden
    q1_deep1: '#89CFF0',             // L5 Q1.1 - Aqua
    q1_deep2: '#7EC8E3',             // L5 Q1.2 - Light sky
    q1_deep3: '#B8B8FF',             // L5 Q1.3 - Periwinkle
    q2_deep1: '#77DD77',             // L5 Q2.1 - Grass
    q2_deep2: '#40E0D0',             // L5 Q2.2 - Turquoise
    q2_deep3: '#98FF98',             // L5 Q2.3 - Mint
    q3_deep1: '#FFD700',             // L5 Q3.1 - Pale gold
    q3_deep2: '#FFFDD0',             // L5 Q3.2 - Cream
    q3_deep3: '#F4A460'              // L5 Q3.3 - Sand
};

// Blob position/shape state for smooth animation
const blobState = {
    currentColor: '#DA7756'
};

// Per-story progress tracking for three-segment bar
// Key: storyId, Value: { visitedSummary, clickedL3, clickedL5 }
const storyProgress = {};

/**
 * Update the three-segment progress bar on summary and answer cards.
 * Segments fill based on navigation depth, colored by current path.
 * @param {string} storyId - The story ID to look up progress for
 */
function updateThreeSegmentProgress(storyId) {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;


    // Update ALL gradient progress bars in the current card
    const bars = currentCard.querySelectorAll('.progress-bar-gradient');
    bars.forEach(bar => {
        // SEGMENT 1: ALWAYS accent — if visible, summary was visited
        const seg1Color = 'var(--accent)';

        // SEGMENT 2: Filled when on answer level or deeper (L4+)
        let seg2Color = 'var(--border-color)';
        const onAnswerOrDeeper = ['answer', 'dig-deeper-qa', 'dig-deeper-answer'].includes(state.cardLayer);
        if (onAnswerOrDeeper && state.currentQuestionIndex != null) {
            const l3Color = L3_QUESTION_COLORS[state.currentQuestionIndex] || null;
            seg2Color = l3Color || 'var(--accent)';
        }

        // SEGMENT 3: Filled ONLY on dig-deeper-answer level (L6)
        let seg3Color = 'var(--border-color)';
        if (state.cardLayer === 'dig-deeper-answer' && state.currentQuestionIndex != null && state.currentDigDeeperQuestionIndex != null) {
            const parentIdx = state.currentQuestionIndex;
            const childIdx = state.currentDigDeeperQuestionIndex;
            const l5Color = (L5_QUESTION_COLORS[parentIdx] && L5_QUESTION_COLORS[parentIdx][childIdx])
                ? L5_QUESTION_COLORS[parentIdx][childIdx]
                : null;
            seg3Color = l5Color || 'var(--accent)';
        }

        bar.style.setProperty('--seg1-color', seg1Color);
        bar.style.setProperty('--seg2-color', seg2Color);
        bar.style.setProperty('--seg3-color', seg3Color);
    });
}

/**
 * Update the background blob color and position based on navigation state.
 * Called at every navigation transition point.
 */
function updateBackgroundBlob() {
    const blob = document.querySelector('.background-blob');
    if (!blob) return;

    const circle1 = blob.querySelector('.blob-circle-1');
    const circle2 = blob.querySelector('.blob-circle-2');
    if (!circle1 || !circle2) return;

    // Determine color based on current navigation state
    let colorKey = 'headline';

    if (state.cardLayer === 'summary' || state.cardLayer === 'questions') {
        colorKey = 'summary';
    } else if (state.cardLayer === 'answer' && state.currentQuestionIndex != null) {
        colorKey = ['q1', 'q2', 'q3'][state.currentQuestionIndex] || 'summary';
    } else if (state.cardLayer === 'dig-deeper-qa' && state.currentQuestionIndex != null) {
        colorKey = ['q1', 'q2', 'q3'][state.currentQuestionIndex] || 'summary';
    } else if (state.cardLayer === 'dig-deeper-answer' && state.currentQuestionIndex != null && state.currentDigDeeperQuestionIndex != null) {
        const deepKeys = [
            ['q1_deep1', 'q1_deep2', 'q1_deep3'],
            ['q2_deep1', 'q2_deep2', 'q2_deep3'],
            ['q3_deep1', 'q3_deep2', 'q3_deep3']
        ];
        const family = deepKeys[state.currentQuestionIndex];
        if (family) {
            colorKey = family[state.currentDigDeeperQuestionIndex] || colorKey;
        }
    }

    const newColor = BACKGROUND_COLORS[colorKey] || BACKGROUND_COLORS.headline;

    // Early return — skip DOM writes if color hasn't changed
    if (newColor === blobState.currentColor) return;

    // Apply color to both circles (CSS breathing animation handles movement)
    circle1.style.fill = newColor;
    circle2.style.fill = newColor;
    blobState.currentColor = newColor;
}

/**
 * Set Q&A card state - manages HIDDEN/ACTIVE states
 * HIDDEN: Q&A not visible (translateY 100%)
 * ACTIVE: Q&A fully visible, user can tap questions
 *
 * Q&A card is now INSIDE the story card, not a sibling
 */
function setQACardState(newState) {
    // Find Q&A card inside current story card
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const qaCard = currentCard.querySelector('.qa-card');
    if (!qaCard) return;

    // Remove all state classes
    qaCard.classList.remove('active');

    // Apply new state
    switch (newState) {
        case QA_STATES.ACTIVE:
            qaCard.classList.add('active');
            break;
        case QA_STATES.HIDDEN:
        default:
            // No classes = hidden (default CSS: translateY 100%)
            break;
    }

    state.qaCardState = newState;
}

// ==========================================
// STATE MACHINE - App Mode Management
// ==========================================

/**
 * Comprehensive cleanup function that removes ALL UI elements
 * Must be called before ANY state transition
 */
function cleanupCurrentState() {

    // CRITICAL: Reset Q&A card to hidden state
    setQACardState(QA_STATES.HIDDEN);

    // Close all modals
    if (elements.modalBackdrop) {
        elements.modalBackdrop.classList.remove('visible', 'peeking', 'push-transition');
        document.body.classList.remove('no-scroll');
    }
    if (elements.summaryModalBackdrop) {
        elements.summaryModalBackdrop.classList.remove('visible');
    }
    if (elements.whatIsFYIModal) {
        elements.whatIsFYIModal.classList.remove('visible');
    }
    if (elements.ourPhilosophyModal) {
        elements.ourPhilosophyModal.classList.remove('visible');
    }

    // Hide completion screen
    if (elements.completionScreen) {
        elements.completionScreen.classList.remove('visible');
    }

    // Hide no-stories state
    if (elements.noStoriesState) {
        elements.noStoriesState.classList.remove('visible');
        elements.noStoriesState.style.display = 'none';
    }

    // Hide recap view
    if (elements.recapWeekView) {
        elements.recapWeekView.classList.remove('visible');
    }

    // Clear card container
    if (elements.cardContainer) {
        elements.cardContainer.innerHTML = '';
    }

    // Reset modal views to initial state
    resetAllModalViews();

    // Clear navigation state
    state.cameFromCompletion = false;
    state.inRecapView = false;

    // Remove any stray backdrop overlays
    document.body.classList.remove('no-scroll');

}

/**
 * Transition to a new app mode with proper cleanup and initialization
 * @param {string} newMode - 'welcome', 'faqs', 'stories', 'archives', 'no_stories'
 * @param {object} options - Additional options for the transition
 */
async function transitionToMode(newMode, options = {}) {
    const previousMode = state.appMode;

    // Skip cleanup for welcome → name input transitions
    if (!(previousMode === 'welcome' && newMode === 'welcome')) {
        cleanupCurrentState();
    }

    // Update state
    state.appMode = newMode;

    // Reset mode-specific flags
    state.faqMode = (newMode === 'faqs');
    state.archiveMode = (newMode === 'archives');
    state.enteredArchivesFromNoStories = options.fromNoStories || false;

    // Clear connection to previous FAQ state when leaving FAQs
    if (previousMode === 'faqs' && newMode !== 'faqs') {
        state.faqStories = [];
        state.faqIndex = 0;
        // Mark FAQ as completed if user went through FAQs
        if (!state.faqCompleted && state.currentIndex > 0) {
            state.faqCompleted = true;
            localStorage.setItem('fyi_faq_completed', 'true');
        }
    }

    // Initialize the new mode
    switch (newMode) {
        case 'faqs':
            await initFAQMode(options.isNewUserOnboarding || false, options.forceRefresh || false);
            break;
        case 'stories':
            await initStoriesMode(options);
            break;
        case 'archives':
            await initArchivesMode(options);
            break;
        case 'no_stories':
            initNoStoriesMode();
            break;
        case 'welcome':
            // Welcome is handled separately
            break;
    }

    // Update Prev button visibility
    updatePrevButtonVisibility();


    // Verify clean state after transition
    setTimeout(verifyCleanState, 450);
}

/**
 * Initialize FAQ mode - load FAQ cards fresh
 * @param {boolean} isNewUserOnboarding - True when this is part of new user welcome flow
 * @param {boolean} forceRefresh - True to bypass cache and fetch fresh data
 */
async function initFAQMode(isNewUserOnboarding = false, forceRefresh = false) {

    // Use custom loading text for new user onboarding
    const loadingText = isNewUserOnboarding ? "Let's show you around" : "Loading FAQs...";
    showLoading(true, loadingText);

    const faqs = await fetchFAQs(forceRefresh);
    state.faqStories = faqs;
    state.stories = faqs;
    state.totalStories = faqs.length;
    state.currentIndex = 0;
    state.viewedStories = [];

    showLoading(false);

    // Update UI
    updateDateDisplay();
    renderProgressDots();
    renderCards();

    trackEvent('FAQ Mode Entered');
}

/**
 * Initialize Stories mode - load today's stories
 */
async function initStoriesMode(options = {}) {

    // Clear FAQ state completely
    state.faqMode = false;
    state.faqStories = [];

    showLoading(true);
    await fetchStories();
    showLoading(false);

    // Check if we have stories
    if (state.stories.length === 0) {
        // No stories - transition to no_stories mode
        state.appMode = 'no_stories';
        initNoStoriesMode();
        return;
    }

    // Reset to first story unless specified otherwise
    if (!options.preserveIndex) {
        state.currentIndex = 0;
        state.viewedStories = [];
    }

    // Update UI
    updateDateDisplay();
    renderProgressDots();
    renderCards();
    updateProgress();

    if (state.currentIndex === 0) {
        showSwipeHint();
    }
}

/**
 * Initialize Archives mode - load archive stories
 */
async function initArchivesMode(options = {}) {

    showLoading(true);

    const archiveStories = await fetchArchiveStories();

    showLoading(false);

    if (archiveStories.length === 0) {
        showToast('⚠', 'No archive stories available');
        // Fall back to stories mode
        await transitionToMode('stories');
        return;
    }

    state.archiveStories = archiveStories;
    state.stories = archiveStories;
    state.totalStories = archiveStories.length;
    state.currentIndex = 0;
    state.viewedStories = [];

    // Store original stories if coming from stories mode
    if (options.originalStories) {
        state.originalStories = options.originalStories;
    }

    // Update UI
    updateDateDisplay();
    renderProgressDots();
    renderCards();
    updateProgress();

    trackEvent('Archive Mode Entered', { source: options.source || 'unknown' });
}

/**
 * Initialize No Stories mode - show empty state
 */
function initNoStoriesMode() {

    if (elements.noStoriesState) {
        elements.noStoriesState.style.display = 'flex';
        elements.noStoriesState.classList.add('visible');
    }

    updateDateDisplay();
}

// ==========================================
// DOM Elements
// ==========================================

const elements = {};

function cacheElements() {
    elements.hamburgerBtn = document.getElementById('hamburgerBtn');
    elements.dropdownMenu = document.getElementById('dropdownMenu');
    elements.whatIsFYIBtn = document.getElementById('whatIsFYIBtn');
    elements.ourPhilosophyBtn = document.getElementById('ourPhilosophyBtn');
    elements.whatIsFYIModal = document.getElementById('whatIsFYIModal');
    elements.ourPhilosophyModal = document.getElementById('ourPhilosophyModal');
    elements.whatIsFYIClose = document.getElementById('whatIsFYIClose');
    elements.ourPhilosophyClose = document.getElementById('ourPhilosophyClose');
    elements.headerLogo = document.getElementById('headerLogo');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.progressFill = document.getElementById('progressFill');
    elements.dateDisplay = document.getElementById('dateDisplay');
    elements.progressDots = document.getElementById('progressDots');
    elements.pullIndicator = document.getElementById('pullIndicator');
    elements.loadingState = document.getElementById('loadingState');
    elements.loadingText = document.querySelector('.loading-text');
    elements.mainContent = document.getElementById('mainContent');
    elements.cardContainer = document.getElementById('cardContainer');
    elements.noStoriesState = document.getElementById('noStoriesState');
    elements.completionScreen = document.getElementById('completionScreen');
    elements.reviewStoriesBtn = document.getElementById('reviewStoriesBtn');
    elements.yourQuestionsBtn = document.getElementById('yourQuestionsBtn');
    elements.swipeHint = document.getElementById('swipeHint');
    elements.emptyRefreshBtn = document.getElementById('emptyRefreshBtn');
    elements.prevStoryBtn = document.getElementById('prevStoryBtn');

    // Sections
    elements.sectionToday = document.getElementById('sectionToday');
    elements.sectionHistory = document.getElementById('sectionHistory');

    // History
    elements.historyList = document.getElementById('historyList');
    elements.historyEmpty = document.getElementById('historyEmpty');
    elements.historyToggle = document.getElementById('historyToggle');
    elements.historyBackBtn = document.getElementById('historyBackBtn');

    // Q&A Card is now created dynamically inside each story card
    // No longer a static element - query it from the current story card when needed

    // LEGACY Modal (still used for Answer and Dig Deeper views)
    elements.modalBackdrop = document.getElementById('modalBackdrop');
    elements.qaModal = document.getElementById('qaModal');
    elements.modalClose = document.getElementById('modalClose');
    elements.qaView = document.getElementById('qaView');
    elements.answerView = document.getElementById('answerView');
    elements.modalEmoji = document.getElementById('modalEmoji');
    elements.modalHeadline = document.getElementById('modalHeadline');
    elements.questionsContainer = document.getElementById('questionsContainer');
    elements.answerLabel = document.getElementById('answerLabel');
    elements.answerQuestion = document.getElementById('answerQuestion');
    elements.answerText = document.getElementById('answerText');
    elements.starRating = document.getElementById('starRating');
    elements.doneBtn = document.getElementById('doneBtn');

    // Toast
    elements.toast = document.getElementById('toast');
    elements.toastIcon = document.getElementById('toastIcon');
    elements.toastMessage = document.getElementById('toastMessage');

    // Summary Modal
    elements.summaryModalBackdrop = document.getElementById('summaryModalBackdrop');
    elements.summaryModal = document.getElementById('summaryModal');
    elements.summaryModalClose = document.getElementById('summaryModalClose');
    elements.summaryModalHeadline = document.getElementById('summaryModalHeadline');

    // Dig Deeper
    elements.digDeeperBtn = document.getElementById('digDeeperBtn');
    elements.digDeeperView = document.getElementById('digDeeperView');
    elements.deepQuestionsContainer = document.getElementById('deepQuestionsContainer');
    elements.deepAnswerView = document.getElementById('deepAnswerView');
    elements.deepAnswerQuestion = document.getElementById('deepAnswerQuestion');
    elements.deepAnswerText = document.getElementById('deepAnswerText');
    elements.deepDoneBtn = document.getElementById('deepDoneBtn');

    // Modal Prev Buttons
    elements.answerViewPrev = document.getElementById('answerViewPrev');
    elements.digDeeperViewPrev = document.getElementById('digDeeperViewPrev');
    elements.deepAnswerViewPrev = document.getElementById('deepAnswerViewPrev');

    // Welcome Modal - Choice Screen
    elements.welcomeChoiceBackdrop = document.getElementById('welcomeChoiceBackdrop');
    elements.welcomeNewUserBtn = document.getElementById('welcomeNewUserBtn');
    elements.welcomeReturningBtn = document.getElementById('welcomeReturningBtn');

    // Welcome Modal - Name Input
    elements.welcomeModalBackdrop = document.getElementById('welcomeModalBackdrop');
    elements.welcomeNameInput = document.getElementById('welcomeNameInput');
    elements.welcomeSubmitBtn = document.getElementById('welcomeSubmitBtn');
    elements.welcomeBackBtn = document.getElementById('welcomeBackBtn');

    // FAQs Menu Button
    elements.faqsBtn = document.getElementById('faqsBtn');

    // No Stories - Archives Button
    elements.emptyArchivesBtn = document.getElementById('emptyArchivesBtn');

    // User Name Display
    elements.fyiUserName = document.getElementById('fyiUserName');
    elements.fyiComma = document.querySelector('.fyi-comma');
    elements.fyiSpace = document.querySelector('.fyi-space');
    elements.logoTextBlock = document.getElementById('logoTextBlock');
    elements.completionTitle = document.getElementById('completionTitle');

    // Summary Modal Bullets
    elements.summaryModalBullets = document.getElementById('summaryModalBullets');

    // Recap Week
    elements.recapWeekBtn = document.getElementById('recapWeekBtn');
    elements.recapWeekView = document.getElementById('recapWeekView');
    elements.recapStoriesList = document.getElementById('recapStoriesList');
    elements.recapEmpty = document.getElementById('recapEmpty');
    elements.recapBackBtn = document.getElementById('recapBackBtn');

    // Story Navigation Buttons (below card)
    elements.storyNavButtons = document.getElementById('storyNavButtons');
    elements.storyPrevBtn = document.getElementById('storyPrevBtn');
    elements.storyNextBtn = document.getElementById('storyNextBtn');

    // Bookmarks Page
    elements.bookmarksBtn = document.getElementById('bookmarksBtn');
    elements.bookmarksPage = document.getElementById('bookmarksPage');
    elements.bookmarksBackBtn = document.getElementById('bookmarksBackBtn');
    elements.bookmarksList = document.getElementById('bookmarksList');
    elements.bookmarksEmpty = document.getElementById('bookmarksEmpty');
    elements.filterDate = document.getElementById('filterDate');
    elements.filterCategory = document.getElementById('filterCategory');
}

// ==========================================
// Initialization
// ==========================================

async function init() {
    try {

        // Initialize fixed card height system FIRST
        initCardHeightSystem();

        cacheElements();

        loadFromStorage();
        applyTheme();
        loadTextSizePreference();
        setupTextSizeMutationObserver(); // Watch for dynamically created elements

        setupEventListeners();
        setupSignInModal();

        setupSessionTracking();

        // Initialize Supabase user (anonymous or existing session)
        generateSupabaseSessionId();
        const supabaseUser = await initializeSupabaseUser();
        if (supabaseUser) {
            await logSupabaseEvent('session_started', {
                entry_point: document.referrer ? 'link' : 'direct'
            });
        }

        // Check if user has set their name
        const savedName = localStorage.getItem('fyi_user_name');
        const faqCompleted = localStorage.getItem('fyi_faq_completed') === 'true';

        if (savedName && savedName.trim().length > 0) {
            state.userName = savedName.trim();
            state.faqCompleted = faqCompleted;
            state.isFirstTimeUser = false;
            updateUserNameDisplay();
        } else {
            // First-time user - show welcome choice modal
            state.isFirstTimeUser = true;
            showWelcomeChoice();
            return; // Don't load content until name is set
        }

        // Show loading and fetch stories
        await loadAppContent();

        // Update bookmark states for current story
        await updateBookmarkStates();

        // Track app opened
        trackAppOpened();

        // Initialize background blob to default state
        updateBackgroundBlob();
    } catch (error) {
        console.error('[init] CRITICAL ERROR during initialization:', error);
        // Try to show some feedback to user
        document.body.innerHTML += '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ff4444;color:white;padding:20px;border-radius:8px;z-index:9999;text-align:center;"><h3>App failed to load</h3><p>Please refresh the page or clear cache.</p><pre style="font-size:10px;text-align:left;margin-top:10px;">' + error.message + '</pre></div>';
    }
}

/**
 * Show the welcome choice modal (New here? / Been here before?)
 */
function showWelcomeChoice() {
    if (elements.welcomeChoiceBackdrop) {
        elements.welcomeChoiceBackdrop.classList.add('visible');
    }
}

/**
 * Hide the welcome choice modal
 */
function hideWelcomeChoice() {
    if (elements.welcomeChoiceBackdrop) {
        elements.welcomeChoiceBackdrop.classList.remove('visible');
    }
}

/**
 * Setup session tracking for when user leaves the app
 */
function setupSessionTracking() {
    // Track session end when page is about to unload
    window.addEventListener('pagehide', () => {
        trackSessionEnd();
    });

    // Also track on visibility change (when user switches tabs/apps on mobile)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            trackSessionEnd();
        }
    });
}

async function loadAppContent() {
    // Set app mode to stories
    state.appMode = 'stories';
    state.faqMode = false;
    state.archiveMode = false;

    showLoading(true);
    await fetchStories();
    showLoading(false);

    // Check if we have stories
    if (state.stories.length === 0) {
        state.appMode = 'no_stories';
    }

    renderCards();
    updateProgress();
    updateDateDisplay();
    renderProgressDots();
    renderHistory();
    showSwipeHint();
    registerServiceWorker();

    // Log first story opened
    if (state.stories.length > 0 && state.stories[state.currentIndex]) {
        const firstStory = state.stories[state.currentIndex];
        logSupabaseEvent('story_opened', {
            story_headline: firstStory.headline,
            story_date: firstStory.date
        });
    }
}

// Format and display today's date (or appropriate text for FAQ/archive mode)
function updateDateDisplay() {
    // Reset any FAQ-specific styling first
    elements.dateDisplay.classList.remove('faq-title-display');

    if (state.faqMode) {
        // Show FAQ title with special styling
        elements.dateDisplay.textContent = 'FAQs: See what we\'re all about';
        elements.dateDisplay.classList.add('faq-title-display');
    } else if (state.archiveMode) {
        // Show "Archives" instead of date
        elements.dateDisplay.textContent = 'Archives';
    } else {
        // Show today's date
        const today = new Date();
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedDate = today.toLocaleDateString('en-US', options);
        elements.dateDisplay.textContent = formattedDate;
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .catch(err => console.error('SW registration failed:', err));
    }
}

// ==========================================
// Storage
// ==========================================

function loadFromStorage() {
    try {
        // Try new key first, then fall back to old key for migration
        let saved = localStorage.getItem('fyiNews');
        if (!saved) {
            saved = localStorage.getItem('criticalNews');
            // Migrate to new key
            if (saved) {
                localStorage.setItem('fyiNews', saved);
                localStorage.removeItem('criticalNews');
            }
        }
        if (saved) {
            const data = JSON.parse(saved);
            state.history = data.history || [];
            state.theme = data.theme || 'dark';
            state.hasShownHint = data.hasShownHint || false;
            state.viewedStories = data.viewedStories || [];

            // Reset current index if it's a new day
            const lastDate = data.lastDate;
            const today = getTodayDate();
            if (lastDate !== today) {
                state.currentIndex = 0;
                state.viewedStories = [];
            } else {
                state.currentIndex = data.currentIndex || 0;
            }
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
    }
}

function saveToStorage() {
    try {
        const data = {
            history: state.history,
            theme: state.theme,
            currentIndex: state.currentIndex,
            hasShownHint: state.hasShownHint,
            viewedStories: state.viewedStories,
            lastDate: getTodayDate()
        };
        localStorage.setItem('fyiNews', JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to storage:', e);
    }
}

// ==========================================
// Google Sheets Integration (Public CSV)
// ==========================================

async function fetchStories() {
    // Check if sheet ID is configured
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE' || !SHEET_ID) {
        state.stories = fallbackStories;
        state.totalStories = state.stories.length;
        return;
    }

    try {
        // Fetch public Google Sheet as CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch sheet');
        }

        const csvText = await response.text();
        const stories = parseCSV(csvText);

        // Filter to today's stories only
        const today = getTodayDate();
        const todayStories = stories.filter(story => {
            const storyDate = parseDate(story.date);
            return storyDate === today;
        });

        if (todayStories.length > 0) {
            state.stories = todayStories;
            state.totalStories = todayStories.length;

            // Cache for offline
            localStorage.setItem('cachedStories', JSON.stringify({
                date: today,
                stories: todayStories
            }));

            showToast('✓', 'Stories loaded');
        } else {
            // Try to load cached stories
            const cached = localStorage.getItem('cachedStories');
            if (cached) {
                const data = JSON.parse(cached);
                if (data.date === today && data.stories.length > 0) {
                    state.stories = data.stories;
                    state.totalStories = data.stories.length;
                    return;
                }
            }

            // No stories for today
            state.stories = [];
            state.totalStories = 0;
        }
    } catch (error) {
        console.error('Fetch error:', error);

        // Try cached stories
        const cached = localStorage.getItem('cachedStories');
        if (cached) {
            const data = JSON.parse(cached);
            state.stories = data.stories || [];
            state.totalStories = state.stories.length;
            showToast('⚠', 'Showing cached stories');
        } else {
            // Use fallback
            state.stories = fallbackStories;
            state.totalStories = state.stories.length;
            showToast('⚠', 'Using sample stories');
        }
    }
}

// ==========================================
// Archives Functions
// ==========================================

async function fetchArchiveStories() {
    // Check if sheet ID is configured
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE' || !SHEET_ID) {
        return [];
    }

    try {
        // Fetch public Google Sheet as CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch sheet');
        }

        const csvText = await response.text();
        const stories = parseCSV(csvText);

        // Get all stories except today
        const today = getTodayDate();

        // Filter to archive stories only (excluding today)
        const archiveStories = stories.filter(story => {
            const storyDate = parseDate(story.date);
            return storyDate !== today;
        });

        // Sort by date (most recent first)
        archiveStories.sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return dateB.localeCompare(dateA);
        });

        // Return last 50 stories
        return archiveStories.slice(0, 50);
    } catch (error) {
        console.error('Error fetching archive stories:', error);
        return [];
    }
}

// ==========================================
// FAQ Functions
// ==========================================

/**
 * Fetch FAQ content from the FAQs sheet with caching
 * FAQs use the same column structure as stories but:
 * - No date filtering (FAQs are evergreen)
 * - Only 3 questions displayed (Question 4 is always "Skip this FAQ")
 * - No Dig Deeper functionality (deep question columns are empty)
 *
 * Caching: FAQ data is cached in localStorage for 24 hours
 * Cache key: 'fyi_faq_data'
 * Cache timestamp key: 'fyi_faq_timestamp'
 */
async function fetchFAQs(forceRefresh = false) {
    const CACHE_KEY = 'fyi_faq_data';
    const CACHE_TIMESTAMP_KEY = 'fyi_faq_timestamp';
    const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    // Check if sheet ID is configured
    if (SHEET_ID === 'YOUR_SHEET_ID_HERE' || !SHEET_ID) {
        return getFallbackFAQs();
    }

    // Check cache unless force refresh is requested
    if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

        if (cachedData && cachedTimestamp) {
            const cacheAge = Date.now() - parseInt(cachedTimestamp, 10);
            if (cacheAge < CACHE_DURATION_MS) {
                try {
                    return JSON.parse(cachedData);
                } catch (e) {
                    console.warn('[FAQ] Cache parse error, fetching fresh data');
                }
            } else {
            }
        }
    }

    try {
        // Fetch FAQ sheet as CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(FAQ_SHEET_NAME)}`;

        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch FAQ sheet');
        }

        const csvText = await response.text();
        const faqs = parseCSV(csvText);

        // FAQs don't need date filtering - return all
        if (faqs.length > 0) {
            // Log warning if not exactly 5 FAQs
            if (faqs.length !== 5) {
                console.warn(`[FAQ] Expected 5 FAQs, found ${faqs.length}`);
            }

            // Process FAQs - ensure no deep questions are shown
            const processedFaqs = faqs.map(faq => ({
                ...faq,
                isFAQ: true,
                // Use image from sheet or fall back to cat image
                imageUrl: faq.imageUrl || '/images/cat-sleep.jpg',
                // Strip deep questions from FAQ questions
                questions: faq.questions.map(q => ({
                    ...q,
                    deepQuestions: [] // FAQs don't have dig deeper
                }))
            }));

            // Cache the processed FAQs
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(processedFaqs));
                localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
            } catch (e) {
                console.warn('[FAQ] Failed to cache FAQs:', e.message);
            }

            return processedFaqs;
        }

        // Sheet exists but is empty - show updating message
        console.warn('[FAQ] FAQ sheet is empty');
        showToast('ℹ️', 'FAQs are being updated. Please check back soon.');
        return getFallbackFAQs();
    } catch (error) {
        console.error('Error fetching FAQs:', error);

        // Try to use cached data even if expired
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            try {
                return JSON.parse(cachedData);
            } catch (e) {
                // Cache corrupted
            }
        }

        // Show error message and return fallback
        showToast('⚠️', "We're having trouble loading FAQs. Please try refreshing.");
        return getFallbackFAQs();
    }
}

/**
 * Fallback FAQ content when sheet is not configured
 */
function getFallbackFAQs() {
    return [
        {
            id: 'faq-1',
            isFAQ: true,
            headline: "Why do I need another news app?",
            teaser: "We know you've been here before—another news service promising \"high-quality\" news that \"cuts the clutter.\" We get the eye roll. But hear us out.",
            summary: "✦ We're not trying to keep you informed about everything—that's impossible and exhausting<br>✦ We curate 3-5 stories daily that actually matter for conversations you'll have with real people<br>✦ We teach you how to think about news, not just what happened—questions beat headlines every time",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "News apps have just not worked for me, I'm still skeptical",
                    answer: "We get it. This exact skepticism is what got us to start FYI in the first place. Most news apps either overwhelm you with notifications or simplify things to the point of uselessness. We're not here to replace your news diet—we're here to make you sharper in the 15 minutes you actually have to engage with what's happening.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "What are your qualifications to report on this?",
                    answer: "Fair question. We're students at IIM Bangalore with 6+ years of competitive debate experience—meaning we're trained to interrogate arguments, spot BS, and explain complex ideas simply. Think of us as your smart friend who reads too much and can't help but share what's actually interesting.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "How is this different from reading headlines on Twitter or Reddit?",
                    answer: "Twitter gives you hot takes. Reddit gives you crowd consensus. We give you the questions you'd ask if you had time to dig deeper. Plus, our stuff is curated—you're not scrolling through an algorithm designed to keep you angry and engaged. You get in, get smarter, get out.",
                    deepQuestions: []
                }
            ]
        },
        {
            id: 'faq-2',
            isFAQ: true,
            headline: "What kind of stories do you report on?",
            teaser: "We don't break headlines. We don't give you an endless stream of stories. So why should you pick us?",
            summary: "✦ We report on stories you'll actually discuss—the ones where people say \"Did you see that thing about...\"<br>✦ Business, geopolitics, tech, culture—anything that reveals how the world actually works<br>✦ If a story won't teach you something or make you sound smarter in conversation, we skip it",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "Do you plan to personalize stories further?",
                    answer: "Yes, soon! Right now we're keeping it simple—5 stories a day that we think work for most curious people. But we're building features to let you pick topics you care about most. Politics bore you? Skip them. Obsessed with AI? Get more. We want FYI to feel like it's made for you, not for \"users.\"",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "Will you ever cover local news or niche topics?",
                    answer: "Maybe. We're focused on stories with broad relevance right now—things that matter whether you're in Mumbai, Delhi, or Bangalore. But if there's enough interest in hyperlocal stuff or niche deep-dives, we're open to experimenting. Let us know what you want to see.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "How do you decide what's \"conversation-worthy\"?",
                    answer: "Simple test: Would this come up at dinner with smart friends? If yes, it's in. We avoid breaking news that'll be outdated in 6 hours, clickbait that sounds important but isn't, and niche wonkery that only policy nerds care about. We're optimizing for \"Oh, I read about this\" moments, not \"I saw a headline\" moments.",
                    deepQuestions: []
                }
            ]
        },
        {
            id: 'faq-3',
            isFAQ: true,
            headline: "Do you store my data?",
            teaser: "We're a bunch of 20-somethings who forget to store our friends' phone numbers. Relax—we're not tracking you.",
            summary: "✦ Nope. We use Plausible Analytics—made in the EU, privacy-focused, no cookies, no creepy tracking<br>✦ We only see aggregate data: how many people read a story, which questions get clicked most<br>✦ We can't see who you are, what device you're on, or where you're reading from—and we like it that way",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "But you ask for my name—is that stored on your server?",
                    answer: "Nope. Your name is stored in localStorage on your device—basically your phone remembers it, not us. That's why the app sometimes glitches and asks you again—if it were on our server, that wouldn't happen. We genuinely have no idea who you are, and that's by design.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "So what kind of data are you actually interested in?",
                    answer: "We care about what you like. Do you swipe left on all our stories? (Hopefully not.) Which questions do people dig into most? Do people finish all 5 stories or bail after 2? That helps us get better at picking stories and writing questions—but it doesn't tell us anything about you personally.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "All news apps store data. Why not you?",
                    answer: "We don't run ads. That's the whole game. Most news apps store data because advertisers pay for targeting—show this person shoe ads, that person finance stuff. We're not doing that. We'd rather charge you ₹15/week and keep your reading experience clean than make ₹5/week per user by selling your attention to brands.",
                    deepQuestions: []
                }
            ]
        },
        {
            id: 'faq-4',
            isFAQ: true,
            headline: "What are your political inclinations?",
            teaser: "Fair question. Are we a propaganda machine in disguise?",
            summary: "✦ We like capitalism but recognize it has real limitations—markets aren't magic, regulation isn't always bad<br>✦ We're skeptical of ideology in general—left or right—because reality is messy and most loud opinions are performative<br>✦ If we've done our job right, you shouldn't be able to guess our politics from what we write",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "But everyone has biases. What are yours?",
                    answer: "Sure. We probably lean slightly left on social issues and slightly pro-market on economic ones, but honestly we care more about \"what's actually happening\" than \"what should happen.\" Our bias is toward curiosity over certainty. We'd rather ask good questions than pretend we have all the answers.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "Will you ever take a strong stance on controversial issues?",
                    answer: "Only when it's intellectually honest. If there's a genuine debate with smart people on both sides, we'll lay it out. But if one side is clearly wrong or acting in bad faith, we're not going to \"both sides\" it for balance. We're not activists, but we're also not stenographers. We call it like we see it.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "How do you handle stories where there's no \"both sides\"?",
                    answer: "We don't pretend neutrality exists where it doesn't. Some stories genuinely have one defensible interpretation—climate change is real, vaccines work, election fraud claims in 2020 were baseless. In those cases, we explain the facts and move on. Treating every issue as a debate isn't fair—it's lazy.",
                    deepQuestions: []
                }
            ]
        },
        {
            id: 'faq-5',
            isFAQ: true,
            headline: "How do you make money?",
            teaser: "If you're reading this, you're probably one of our earliest users. We hope the answer at the back of this card changes soon.",
            summary: "✦ Right now? We don't. This is a passion project run by students who should be studying for exams<br>✦ Everyone gets a 30-day free trial to test if FYI actually makes you smarter and more engaged with the world<br>✦ When we do charge, it'll be ₹15/week—less than a cup of coffee, more than a dopamine scroll",
            imageUrl: "images/cat-sleep.jpg",
            questions: [
                {
                    label: "✦",
                    text: "That doesn't seem sustainable. Will you even survive?",
                    answer: "Right now we're just students at IIM Bangalore, so surviving assignments and exams is a bigger worry than surviving as a business. This is an experiment—if people love it, we'll figure out how to make it work. If not, at least we built something we're proud of. Call it freshman idealism.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "Will you ever allow ads?",
                    answer: "No. Call it naive, but we won't. Ads ruin the reading experience—they optimize for clicks and outrage, not understanding. Our whole model is \"you pay us, we serve you.\" No middlemen, no tracking, no algorithmic manipulation. If we can't make that work, we'd rather shut down than compromise.",
                    deepQuestions: []
                },
                {
                    label: "✦",
                    text: "What happens after the free trial?",
                    answer: "You decide if it's worth ₹15/week. If you've used FYI for 30 days and feel smarter, more engaged, and more confident in conversations—keep going. If not, cancel with zero guilt. We're not locking you into annual plans or guilt-tripping you with notifications. Pay if it's valuable. That's the deal.",
                    deepQuestions: []
                }
            ]
        }
    ];
}

/**
 * Enter FAQ mode using the state machine
 * This is the main entry point for FAQ mode from anywhere in the app
 * @param {boolean} isNewUserOnboarding - True when this is part of new user welcome flow
 * @param {boolean} forceRefresh - True to bypass cache and fetch fresh FAQ data (used when accessed from menu)
 */
async function enterFAQMode(isNewUserOnboarding = false, forceRefresh = false) {
    await transitionToMode('faqs', { isNewUserOnboarding, forceRefresh });
}

/**
 * Exit FAQ mode and return to stories using state machine
 */
async function exitFAQMode() {
    await transitionToMode('stories');
}

function getPastWeekDates() {
    const dates = [];
    const today = new Date();

    // Get past 7 days (not including today)
    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }

    return dates;
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

async function showRecapView() {
    triggerHaptic('light');

    // Track that we came from completion screen
    state.cameFromCompletion = true;
    state.inRecapView = true;

    // Show loading state
    showLoading(true);

    // Fetch archive stories
    const archiveStories = await fetchArchiveStories();

    showLoading(false);

    if (archiveStories.length === 0) {
        // Show empty state in recap view
        elements.recapStoriesList.innerHTML = '';
        elements.recapEmpty.style.display = 'block';
        elements.completionScreen.classList.remove('visible');
        elements.recapWeekView.classList.add('visible');
        // Show prev button for returning to completion
        updatePrevButtonForCompletionNav();
        return;
    }

    // Enter archive mode - show archive stories as swipeable cards
    state.archiveMode = true;
    state.originalStories = [...state.stories]; // Save current stories
    state.archiveStories = archiveStories;
    state.archiveIndex = 0;

    // Replace current stories with archive stories
    state.stories = archiveStories;
    state.totalStories = archiveStories.length;
    state.currentIndex = 0;
    state.viewedStories = [];

    // Hide completion screen
    elements.completionScreen.classList.remove('visible');

    // Render archive cards
    updateProgress();
    renderProgressDots();
    renderCards();
    updatePrevButtonVisibility();

    showToast('📚', `${archiveStories.length} archive stories loaded`);
}

function hideRecapView() {
    triggerHaptic('light');
    elements.recapWeekView.classList.remove('visible');
    elements.completionScreen.classList.add('visible');
    // Reset navigation state
    state.cameFromCompletion = false;
    state.inRecapView = false;
    updatePrevButtonVisibility();
}

function exitArchiveMode() {
    if (!state.archiveMode) return;

    state.archiveMode = false;

    // Restore today's stories
    state.stories = state.originalStories;
    state.totalStories = state.stories.length;
    state.currentIndex = 0;
    state.viewedStories = [];
    state.archiveStories = [];
    state.originalStories = [];

    // Re-render with today's stories
    elements.completionScreen.classList.remove('visible');
    updateProgress();
    renderProgressDots();
    renderCards();
    updatePrevButtonVisibility();

    showToast('✓', "Back to today's stories");
}

// Exit archive mode and return to completion screen (used by Prev button)
function exitArchiveModeToCompletion() {
    if (!state.archiveMode) return;

    state.archiveMode = false;
    state.cameFromCompletion = false;
    state.inRecapView = false;

    // Restore today's stories
    state.stories = state.originalStories;
    state.totalStories = state.stories.length;
    state.currentIndex = state.totalStories; // Set to end so completion shows
    state.viewedStories = [];
    state.archiveStories = [];
    state.originalStories = [];

    // Clear all cards from DOM
    elements.cardContainer.innerHTML = '';

    // Show completion screen
    elements.completionScreen.classList.add('visible');
    elements.progressFill.style.width = '100%';
    if (elements.historyToggle) elements.historyToggle.classList.add('hidden');

    // Update completion title
    if (state.userName && elements.completionTitle) {
        elements.completionTitle.textContent = `Take a break, ${state.userName}`;
    }

    updateCompletionButtons();
    updatePrevButtonVisibility();
    triggerHaptic('light');
}

/**
 * Enter archive mode from the no-stories page
 * Similar to regular archive mode but tracks source for proper Prev button behavior
 */
async function enterArchiveModeFromNoStories() {

    showLoading(true);

    // Fetch archive stories
    const archiveStories = await fetchArchiveStories();

    showLoading(false);

    if (archiveStories.length === 0) {
        showToast('⚠', 'No archive stories available');
        return;
    }

    // Enter archive mode
    state.archiveMode = true;
    state.contentMode = 'archives';
    state.enteredArchivesFromNoStories = true;
    state.originalStories = []; // No today's stories to restore
    state.archiveStories = archiveStories;
    state.stories = archiveStories;
    state.totalStories = archiveStories.length;
    state.currentIndex = 0;
    state.viewedStories = [];

    // Hide no-stories state
    elements.noStoriesState.classList.remove('visible');
    elements.noStoriesState.style.display = 'none';

    // Render archive cards
    updateProgress();
    renderProgressDots();
    renderCards();
    updatePrevButtonVisibility();

    showToast('✓', 'Browsing archives');
    trackEvent('Archive Mode Entered', { source: 'no_stories_page' });
}

/**
 * Exit archive mode when entered from no-stories page
 * Returns to no-stories page if today still has no stories, otherwise shows today's stories
 */
async function exitArchiveModeFromNoStories() {
    state.archiveMode = false;
    state.enteredArchivesFromNoStories = false;
    state.contentMode = 'stories';
    state.archiveStories = [];

    // Re-fetch today's stories to check if any have been added
    showLoading(true);
    await fetchStories();
    showLoading(false);

    // Check if we now have stories
    if (state.stories.length > 0) {
        // Stories have been added! Show them
        state.currentIndex = 0;
        elements.cardContainer.innerHTML = '';
        renderCards();
        updateProgress();
        renderProgressDots();
        updatePrevButtonVisibility();
        showToast('✓', 'New stories available!');
    } else {
        // Still no stories - show no-stories page again
        elements.cardContainer.innerHTML = '';
        elements.noStoriesState.style.display = 'flex';
        elements.noStoriesState.classList.add('visible');
        updatePrevButtonVisibility();
    }
}

function renderRecapStories(stories) {
    // Group stories by date
    const groupedByDate = {};
    stories.forEach(story => {
        const date = parseDate(story.date);
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(story);
    });

    // Render grouped stories
    let html = '';
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach(date => {
        const displayDate = formatDateForDisplay(date);
        html += `<div class="recap-date-group">
            <div class="recap-date-header">${displayDate}</div>`;

        groupedByDate[date].forEach((story, index) => {
            html += `
                <div class="recap-story-card" data-recap-date="${date}" data-recap-index="${index}">
                    <span class="recap-story-emoji">${story.emoji || '📰'}</span>
                    <div class="recap-story-info">
                        <h4 class="recap-story-headline">${parseFormattedText(story.headline)}</h4>
                    </div>
                    <svg class="recap-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>`;
        });

        html += '</div>';
    });

    elements.recapStoriesList.innerHTML = html;

    // Add click handlers
    const recapCards = elements.recapStoriesList.querySelectorAll('.recap-story-card');
    recapCards.forEach(card => {
        card.addEventListener('click', () => {
            const date = card.dataset.recapDate;
            const index = parseInt(card.dataset.recapIndex);
            const story = groupedByDate[date][index];
            if (story) {
                triggerHaptic('light');
                openRecapStoryModal(story);
            }
        });
    });
}

function openRecapStoryModal(story) {
    // Set the current story for modal interaction
    state.currentStory = story;
    state.currentQuestion = null;

    // Track archive story opened
    trackArchiveStoryOpened(story.headline, story.date);

    // Open the Q&A modal
    openModal(story);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/\s+/g, ' '));

    // Expected column structure (28 columns):
    // 0: Date, 1: Headline, 2: Teaser, 3: Summary
    // 4: Question 1, 5: Question 2, 6: Question 3, 7: Question 4
    // 8: Answer 1, 9: Answer 2, 10: Answer 3
    // 11-13: Q1-Deep1, Q1-Deep2, Q1-Deep3
    // 14-16: A1-Deep1, A1-Deep2, A1-Deep3
    // 17-19: Q2-Deep1, Q2-Deep2, Q2-Deep3
    // 20-22: A2-Deep1, A2-Deep2, A2-Deep3
    // 23-25: Q3-Deep1, Q3-Deep2, Q3-Deep3
    // 26-28: A3-Deep1, A3-Deep2, A3-Deep3
    // 29: Banner Image URL

    // Map expected headers to indices
    const headerMap = {};

    headers.forEach((header, index) => {
        const normalized = header.replace(/[^a-z0-9\s-]/g, '').trim();

        // Core fields
        if (header === 'date' || normalized === 'date') headerMap['date'] = index;
        if (header === 'headline' || normalized === 'headline') headerMap['headline'] = index;
        if (header === 'teaser' || normalized === 'teaser') headerMap['teaser'] = index;
        if (header === 'summary' || normalized === 'summary') headerMap['summary'] = index;

        // Questions 1-4
        if (header.includes('question 1') || normalized === 'question 1') headerMap['question 1'] = index;
        if (header.includes('question 2') || normalized === 'question 2') headerMap['question 2'] = index;
        if (header.includes('question 3') || normalized === 'question 3') headerMap['question 3'] = index;
        if (header.includes('question 4') || normalized === 'question 4') headerMap['question 4'] = index;

        // Answers 1-3
        if (header.includes('answer 1') || normalized === 'answer 1') headerMap['answer 1'] = index;
        if (header.includes('answer 2') || normalized === 'answer 2') headerMap['answer 2'] = index;
        if (header.includes('answer 3') || normalized === 'answer 3') headerMap['answer 3'] = index;

        // Deep questions for Q1
        if (header.includes('q1-deep1') || normalized === 'q1-deep1') headerMap['q1-deep1'] = index;
        if (header.includes('q1-deep2') || normalized === 'q1-deep2') headerMap['q1-deep2'] = index;
        if (header.includes('q1-deep3') || normalized === 'q1-deep3') headerMap['q1-deep3'] = index;

        // Deep answers for Q1
        if (header.includes('a1-deep1') || normalized === 'a1-deep1') headerMap['a1-deep1'] = index;
        if (header.includes('a1-deep2') || normalized === 'a1-deep2') headerMap['a1-deep2'] = index;
        if (header.includes('a1-deep3') || normalized === 'a1-deep3') headerMap['a1-deep3'] = index;

        // Deep questions for Q2
        if (header.includes('q2-deep1') || normalized === 'q2-deep1') headerMap['q2-deep1'] = index;
        if (header.includes('q2-deep2') || normalized === 'q2-deep2') headerMap['q2-deep2'] = index;
        if (header.includes('q2-deep3') || normalized === 'q2-deep3') headerMap['q2-deep3'] = index;

        // Deep answers for Q2
        if (header.includes('a2-deep1') || normalized === 'a2-deep1') headerMap['a2-deep1'] = index;
        if (header.includes('a2-deep2') || normalized === 'a2-deep2') headerMap['a2-deep2'] = index;
        if (header.includes('a2-deep3') || normalized === 'a2-deep3') headerMap['a2-deep3'] = index;

        // Deep questions for Q3
        if (header.includes('q3-deep1') || normalized === 'q3-deep1') headerMap['q3-deep1'] = index;
        if (header.includes('q3-deep2') || normalized === 'q3-deep2') headerMap['q3-deep2'] = index;
        if (header.includes('q3-deep3') || normalized === 'q3-deep3') headerMap['q3-deep3'] = index;

        // Deep answers for Q3
        if (header.includes('a3-deep1') || normalized === 'a3-deep1') headerMap['a3-deep1'] = index;
        if (header.includes('a3-deep2') || normalized === 'a3-deep2') headerMap['a3-deep2'] = index;
        if (header.includes('a3-deep3') || normalized === 'a3-deep3') headerMap['a3-deep3'] = index;

        // Banner Image URL
        if (header.includes('banner') || header.includes('image url')) headerMap['banner image url'] = index;
    });

    const stories = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);

        // Get values using header map, with fallback to positional indices
        const getValue = (key, fallbackIndex) => {
            const idx = headerMap[key] !== undefined ? headerMap[key] : fallbackIndex;
            return (values[idx] || '').trim();
        };

        // Process image URL - handle relative paths from /images/ folder
        let imageUrl = getValue('banner image url', 27);
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            // Assume it's a filename in the /images/ folder
            imageUrl = `/images/${imageUrl}`;
        }

        // Build story object using the 28-column structure
        const story = {
            id: i,
            date: getValue('date', 0),
            emoji: '📰', // No emoji column - use default
            headline: getValue('headline', 1),
            teaser: getValue('teaser', 2),
            summary: getValue('summary', 3),
            imageUrl: imageUrl,
            questions: []
        };

        // Parse questions 1-3 with their deep dive questions
        for (let q = 1; q <= 3; q++) {
            const question = getValue(`question ${q}`, 3 + q);
            const answer = getValue(`answer ${q}`, 7 + q);

            if (question && question.trim() && answer && answer.trim()) {
                // Build deep dive questions array
                const deepQuestions = [];
                for (let d = 1; d <= 3; d++) {
                    const deepQ = getValue(`q${q}-deep${d}`, -1);
                    const deepA = getValue(`a${q}-deep${d}`, -1);
                    if (deepQ && deepQ.trim() && deepA && deepA.trim()) {
                        deepQuestions.push({
                            text: deepQ.trim(),
                            answer: deepA.trim()
                        });
                    }
                }

                story.questions.push({
                    label: '✦',
                    text: question.trim(),
                    answer: answer.trim(),
                    deepQuestions: deepQuestions
                });
            }
        }

        // Validate date format (YYYY-MM-DD)
        const dateStr = story.date;
        if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            console.warn(`Invalid date format for story ${i}: ${dateStr}. Expected YYYY-MM-DD`);
        }

        // Only add story if it has headline and at least one question
        if (story.headline && story.headline.trim() && story.questions.length > 0) {
            stories.push(story);
        }
    }

    return stories;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// ==========================================
// User Name / Welcome Modal
// ==========================================

function showWelcomeModal() {
    elements.welcomeModalBackdrop.classList.add('visible');
    setTimeout(() => {
        elements.welcomeNameInput.focus();
    }, 300);
}

function hideWelcomeModal() {
    elements.welcomeModalBackdrop.classList.remove('visible');
}

function formatUserName(name) {
    // Proper capitalization: first letter uppercase, rest lowercase
    const trimmed = name.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

async function saveUserName(name) {
    const formatted = formatUserName(name);
    if (formatted) {
        localStorage.setItem('fyi_user_name', formatted);
        state.userName = formatted;
        state.isFirstTimeUser = false;
        updateUserNameDisplay();
        hideWelcomeModal();
        trackAppOpened();

        // Check if we should show FAQs (new user flow) or stories (returning user flow)
        if (state.showFAQsAfterName) {
            // New user: show FAQs first with custom onboarding loading text
            await enterFAQMode(true);
        } else {
            // Returning user: go straight to stories
            await loadAppContent();
        }
    }
}

function updateUserNameDisplay() {
    if (state.userName) {
        elements.fyiUserName.textContent = state.userName;
        elements.fyiComma.classList.remove('hidden');
        if (elements.fyiSpace) elements.fyiSpace.classList.remove('hidden');
        elements.fyiUserName.classList.remove('hidden');

        // Dynamically adjust font size for long names - shrink entire logo block together
        adjustLogoFontSize();
    } else {
        elements.fyiComma.classList.add('hidden');
        if (elements.fyiSpace) elements.fyiSpace.classList.add('hidden');
        elements.fyiUserName.classList.add('hidden');
    }
}

function adjustLogoFontSize() {
    // Reset to default size first
    if (elements.logoTextBlock) {
        elements.logoTextBlock.style.fontSize = '';
    }

    // Get available width (header width minus hamburger and theme toggle buttons with padding)
    const headerWidth = window.innerWidth;
    const availableWidth = headerWidth - 140; // Reserve 140px for hamburger (44px) + theme toggle (44px) + padding

    // Measure current width of entire logo block
    const logoBlock = elements.logoTextBlock;
    if (!logoBlock) return;

    const logoWidth = logoBlock.offsetWidth;

    // If logo block is too wide, reduce font size for the ENTIRE block (both FYI and Name together)
    if (logoWidth > availableWidth) {
        const ratio = availableWidth / logoWidth;
        const currentSize = 28; // Default font size in CSS
        const newSize = Math.max(16, Math.floor(currentSize * ratio));
        logoBlock.style.fontSize = `${newSize}px`;
    }
}

// ==========================================
// HTML Text Formatting with Sanitization
// ==========================================

/**
 * Sanitize HTML by removing dangerous tags while preserving safe formatting tags
 * Whitelist approach: only allow specific safe tags
 */
function sanitizeHTML(text) {
    if (!text) return text;

    // First, temporarily preserve allowed tags by replacing them with placeholders
    const preservedTags = [];
    const allowedTagPatterns = [
        /<color1>(.*?)<\/color1>/gi,
        /<color2>(.*?)<\/color2>/gi,
        /<color3>(.*?)<\/color3>/gi,
        /<mark>(.*?)<\/mark>/gi,
        /<br\s*\/?>/gi,
        /<strong>(.*?)<\/strong>/gi,
        /<em>(.*?)<\/em>/gi,
        /<b>(.*?)<\/b>/gi,
        /<i>(.*?)<\/i>/gi,
        /<lookup\s+def="[^"]*">(.*?)<\/lookup>/gi
    ];

    let sanitized = text;

    // Preserve allowed tags with placeholders
    allowedTagPatterns.forEach((pattern, index) => {
        sanitized = sanitized.replace(pattern, (match) => {
            preservedTags.push(match);
            return `__PRESERVED_TAG_${preservedTags.length - 1}__`;
        });
    });

    // Remove all remaining HTML tags (potentially dangerous ones like <script>, <iframe>, etc.)
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Restore preserved tags
    preservedTags.forEach((tag, index) => {
        sanitized = sanitized.replace(`__PRESERVED_TAG_${index}__`, tag);
    });

    return sanitized;
}

/**
 * Parse custom HTML-like tags for text formatting
 * Converts safe custom tags to styled spans
 * Includes XSS protection via sanitization
 */
function parseFormattedText(text) {
    if (!text) return text;

    // Sanitize first to remove any dangerous HTML
    let formatted = sanitizeHTML(text);

    // <color1>text</color1> -> orange accent color
    formatted = formatted.replace(/<color1>(.*?)<\/color1>/gi, '<span class="text-color1">$1</span>');

    // <color2>text</color2> -> teal/blue secondary color
    formatted = formatted.replace(/<color2>(.*?)<\/color2>/gi, '<span class="text-color2">$1</span>');

    // <color3>text</color3> -> plum/purple color (#6B5C8A)
    formatted = formatted.replace(/<color3>(.*?)<\/color3>/gi, '<span class="text-color3">$1</span>');

    // <mark>text</mark> -> golden yellow highlight background
    formatted = formatted.replace(/<mark>(.*?)<\/mark>/gi, '<span class="text-mark">$1</span>');

    // <strong>text</strong> or <b>text</b> -> bold text
    formatted = formatted.replace(/<strong>(.*?)<\/strong>/gi, '<strong>$1</strong>');
    formatted = formatted.replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>');

    // <em>text</em> or <i>text</i> -> italic text
    formatted = formatted.replace(/<em>(.*?)<\/em>/gi, '<em>$1</em>');
    formatted = formatted.replace(/<i>(.*?)<\/i>/gi, '<em>$1</em>');

    // <lookup def="definition">word</lookup> -> clickable orange underlined word
    formatted = formatted.replace(
        /<lookup\s+def="([^"]*)">(.*?)<\/lookup>/gi,
        '<span class="text-lookup" data-definition="$1" onclick="showLookupTooltip(this, event)">$2</span>'
    );

    return formatted;
}

function parseSummaryWithBullets(text) {
    if (!text) return '';

    // Split by <br> tags
    const lines = text.split(/<br\s*\/?>/gi);

    // If only one line (no <br> tags), return as single bullet
    if (lines.length === 1) {
        return `<div class="summary-bullet-item">
            <span class="summary-bullet-icon">✦</span>
            <span class="summary-bullet-text">${parseFormattedText(lines[0].trim())}</span>
        </div>`;
    }

    // Multiple lines - create bullet for each non-empty line
    return lines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<div class="summary-bullet-item">
            <span class="summary-bullet-icon">✦</span>
            <span class="summary-bullet-text">${parseFormattedText(line)}</span>
        </div>`)
        .join('');
}

// ==========================================
// Theme
// ==========================================

function applyTheme() {
    if (state.theme === 'light') {
        document.documentElement.classList.add('light-mode');
    } else {
        document.documentElement.classList.remove('light-mode');
    }
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveToStorage();
    triggerHaptic('light');
    trackThemeChanged(state.theme);
}

// ==========================================
// Text Size Toggle + Slider
// ==========================================

let textEnlarged = false;
let textMultiplier = 1.4; // Default: 12.5px × 1.4 = 17.5px
const TEXT_BASE_SIZE = 12.5;
const TEXT_DEFAULT_MULTIPLIER = 1.4;
const TEXT_ENLARGED_MULTIPLIER = 2.8; // 12.5px × 2.8 = 35px
let sliderVisible = false;

const TEXT_SIZE_SELECTORS = [
    '.card-teaser',
    '.card-summary-text',
    '.answer-text',
    '.qa-question-text',
    '.answer-question-text',
    '.dig-deeper-subheading',
    '.answer-question',
    '.dig-deeper-answer-text'
];

/**
 * Toggle text size between normal and enlarged (tap behavior)
 */
function toggleTextSize() {
    textEnlarged = !textEnlarged;
    textMultiplier = textEnlarged ? TEXT_ENLARGED_MULTIPLIER : TEXT_DEFAULT_MULTIPLIER;
    document.body.classList.toggle('text-enlarged', textEnlarged);


    applyTextSizeToAllElements();

    // Update all AA button states
    document.querySelectorAll('.btn-text-size').forEach(btn => {
        btn.classList.toggle('active', textEnlarged);
    });

    // Update slider position if visible
    const slider = document.getElementById('textSizeSlider');
    if (slider) slider.value = textMultiplier;

    // Persist preference
    localStorage.setItem('fyi_text_multiplier', textMultiplier.toString());

    triggerHaptic('light');
    trackEvent('Text Size Toggled', { enlarged: textEnlarged, multiplier: textMultiplier });
}

function loadTextSizePreference() {
    // Handle both old boolean format and new multiplier format
    const stored = localStorage.getItem('fyi_text_multiplier');
    const oldBool = localStorage.getItem('fyi_text_enlarged');

    if (stored) {
        textMultiplier = parseFloat(stored);
        textEnlarged = textMultiplier > TEXT_DEFAULT_MULTIPLIER;
    } else if (oldBool === 'true') {
        // Migrate old boolean preference
        textMultiplier = TEXT_ENLARGED_MULTIPLIER;
        textEnlarged = true;
        localStorage.setItem('fyi_text_multiplier', textMultiplier.toString());
        localStorage.removeItem('fyi_text_enlarged');
    }

    if (textEnlarged) {
        document.body.classList.add('text-enlarged');
        applyTextSizeToAllElements();
        document.querySelectorAll('.btn-text-size').forEach(btn => {
            btn.classList.add('active');
        });
    }
}

/**
 * Apply text size to all matching elements based on current multiplier
 */
function applyTextSizeToAllElements() {
    const size = Math.round(TEXT_BASE_SIZE * textMultiplier * 10) / 10 + 'px';
    TEXT_SIZE_SELECTORS.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.fontSize = (textMultiplier !== TEXT_DEFAULT_MULTIPLIER) ? size : '';
        });
    });
}

/**
 * Toggle slider visibility (called by AA button tap)
 */
function toggleSliderVisibility() {
    if (sliderVisible) {
        hideTextSizeSlider();
    } else {
        showTextSizeSlider();
    }
}

/**
 * Show text size slider overlay (triggered by AA button tap)
 */
function showTextSizeSlider() {
    const overlay = document.getElementById('textSizeSliderOverlay');
    const slider = document.getElementById('textSizeSlider');
    if (!overlay || !slider) return;

    slider.value = textMultiplier;
    overlay.classList.add('visible');
    sliderVisible = true;
    triggerHaptic('medium');

    // Listen for input changes
    slider.oninput = (e) => {
        textMultiplier = parseFloat(e.target.value);
        textEnlarged = textMultiplier > TEXT_DEFAULT_MULTIPLIER;
        document.body.classList.toggle('text-enlarged', textEnlarged);
        applyTextSizeToAllElements();
        document.querySelectorAll('.btn-text-size').forEach(btn => {
            btn.classList.toggle('active', textEnlarged);
        });
    };

    // Close on tap outside (with delay to prevent immediate close)
    const closeHandler = (e) => {
        if (!overlay.contains(e.target) && !e.target.closest('.btn-text-size')) {
            hideTextSizeSlider();
            document.removeEventListener('click', closeHandler);
            document.removeEventListener('touchend', closeHandler);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeHandler);
        document.addEventListener('touchend', closeHandler);
    }, 100);
}

/**
 * Hide text size slider overlay
 */
function hideTextSizeSlider() {
    const overlay = document.getElementById('textSizeSliderOverlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    sliderVisible = false;

    // Save final value
    localStorage.setItem('fyi_text_multiplier', textMultiplier.toString());
    triggerHaptic('light');
}

/**
 * Setup mutation observer to apply text size to dynamically created elements
 */
function setupTextSizeMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        if (textMultiplier === TEXT_DEFAULT_MULTIPLIER) return;

        const size = Math.round(TEXT_BASE_SIZE * textMultiplier * 10) / 10 + 'px';
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    TEXT_SIZE_SELECTORS.forEach(selector => {
                        if (node.matches && node.matches(selector)) {
                            node.style.fontSize = size;
                        }
                        if (node.querySelectorAll) {
                            node.querySelectorAll(selector).forEach(el => {
                                el.style.fontSize = size;
                            });
                        }
                    });
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// ==========================================
// Bookmark Toggle (Supabase-backed)
// ==========================================

function toggleBookmark(button) {
    const currentStory = state.stories[state.currentIndex];
    if (!currentStory) {
        // Fallback: just toggle visually
        button.classList.toggle('bookmarked');
        triggerHaptic('light');
        return;
    }

    // Determine bookmark type and context based on current card layer
    let bookmarkType = 'story';
    let questionPath = null;
    let contentPayload = {
        headline: currentStory.headline,
        teaser: currentStory.teaser,
        emoji: currentStory.emoji
    };

    if (state.cardLayer === 'answer' && state.currentQuestion) {
        bookmarkType = 'answer';
        questionPath = `Q${(state.currentQuestionIndex || 0) + 1}`;
        contentPayload.question_text = state.currentQuestion.text;
        contentPayload.answer_text = state.currentQuestion.answer;
    } else if (state.cardLayer === 'dig-deeper-answer' && state.currentQuestion) {
        bookmarkType = 'deep_answer';
        const qIdx = (state.currentQuestionIndex || 0) + 1;
        const dIdx = state.currentDigDeeperQuestionIndex || 0;
        // Format: Q1-A, Q1-B, Q2-C — matches handleBookmarkCardClick parser
        const deepLetter = String.fromCharCode(65 + dIdx); // 0→A, 1→B, 2→C
        questionPath = `Q${qIdx}-${deepLetter}`;
        const deepQ = state.currentQuestion.deepQuestions?.[state.currentDigDeeperQuestionIndex];
        if (deepQ) {
            contentPayload.question_text = deepQ.text;
            contentPayload.answer_text = deepQ.answer;
        }
    }

    const bookmarkData = {
        type: bookmarkType,
        storyDate: currentStory.date,
        storyHeadline: currentStory.headline,
        questionPath: questionPath,
        content: contentPayload
    };


    // Use Supabase-backed handler
    handleBookmarkClick(button, bookmarkData);

    // Also track with Plausible
    const storyId = button.dataset.storyId;
    const isBookmarked = button.classList.contains('bookmarked');
    trackEvent('Bookmark Toggled', { storyId, bookmarked: isBookmarked, level: state.cardLayer });
}

// ==========================================
// Loading State
// ==========================================

function showLoading(show, customText = null) {
    state.isLoading = show;
    elements.loadingState.classList.toggle('visible', show);

    // Update loading text if provided, otherwise reset to default
    if (elements.loadingText) {
        if (show && customText) {
            elements.loadingText.textContent = customText;
        } else if (!show) {
            // Reset to default when hiding
            elements.loadingText.textContent = "Loading today's stories...";
        }
    }
}

// ==========================================
// Card Rendering
// ==========================================

function renderCards() {
    elements.cardContainer.innerHTML = '';

    // Check if no stories
    if (state.stories.length === 0) {
        elements.noStoriesState.style.display = 'flex';
        elements.noStoriesState.classList.add('visible');
        if (elements.historyToggle) elements.historyToggle.classList.add('hidden');
        return;
    }

    elements.noStoriesState.style.display = 'none';
    elements.noStoriesState.classList.remove('visible');
    if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');

    // Check if completed
    if (state.currentIndex >= state.totalStories) {
        showCompletion();
        return;
    }

    // RENDER PREVIOUS CARD (off-screen left) for progressive animation
    if (state.currentIndex > 0) {
        const prevStory = state.stories[state.currentIndex - 1];
        const prevCard = createCardElement(prevStory, -1);
        prevCard.dataset.cardType = 'prev';
        elements.cardContainer.appendChild(prevCard);
    }

    // RENDER CURRENT CARD
    const currentStory = state.stories[state.currentIndex];
    const currentCard = createCardElement(currentStory, 0);
    currentCard.dataset.cardType = 'current';
    elements.cardContainer.appendChild(currentCard);
    setupCardInteractions(currentCard, currentStory);

    // RENDER NEXT CARD (off-screen right) for progressive animation
    if (state.currentIndex < state.totalStories - 1) {
        const nextStory = state.stories[state.currentIndex + 1];
        const nextCard = createCardElement(nextStory, 1);
        nextCard.dataset.cardType = 'next';
        elements.cardContainer.appendChild(nextCard);
    }

    // Update prev button visibility
    updatePrevButtonVisibility();
}

function createCardElement(story, position) {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.dataset.id = story.id;
    card.dataset.position = position;
    card.dataset.flipped = 'false';

    // Banner image
    let bannerHTML = '';
    if (story.imageUrl) {
        bannerHTML = `
            <div class="card-banner">
                <img src="${story.imageUrl}" alt="" onerror="this.parentElement.innerHTML='<span class=card-banner-placeholder>${story.emoji}</span>'">
            </div>
        `;
    } else {
        bannerHTML = `
            <div class="card-banner">
                <span class="card-banner-placeholder">${story.emoji}</span>
            </div>
        `;
    }

    // Use teaser from story, or placeholder if empty
    const teaserText = story.teaser || "This is placeholder teaser text for the story. It should span approximately five lines to show how the expanded subheading area will look with real content from your Google Sheet.";

    // Parse summary for display on back face
    const summaryText = story.summary || story.teaser || '';
    const summaryHTML = parseFormattedText(summaryText);

    // Check if user has flipped before (for "Tap to flip" hint)
    const hasFlippedBefore = localStorage.getItem('fyi_has_flipped') === 'true';
    const flipHintClass = hasFlippedBefore ? 'hidden' : '';

    // Determine disabled state for prev/next based on position
    // CRITICAL: Always show ALL buttons, use 'disabled' class for inactive ones
    // This preserves CSS Grid spacing and prevents alignment bugs
    const isFirstStory = state.currentIndex === 0;
    const isLastStory = state.currentIndex >= state.totalStories - 1;

    card.innerHTML = `
        <div class="card-flipper">
            <!-- FRONT FACE (Headline) -->
            <div class="card-face card-front">
                <div class="card-swipe-overlay left"></div>
                <div class="card-swipe-overlay right"></div>
                ${bannerHTML}
                <div class="card-body">
                    <h2 class="card-headline">${parseFormattedText(story.headline)}</h2>
                    <p class="card-teaser">${parseFormattedText(teaserText)}</p>
                </div>
                <!-- Bottom Navigation Bar - AA (left), Read ahead (center), Bookmark (right) -->
                <div class="card-nav-hints">
                    <button class="btn-text-size" aria-label="Toggle text size">
                        <span class="text-size-small">A</span><span class="text-size-large">A</span>
                    </button>
                    <span class="nav-hint nav-hint-center nav-hint-read-ahead" data-action="flip">Read ahead ↑</span>
                    <button class="btn-bookmark" aria-label="Bookmark this story" data-story-id="${story.id}">
                        <svg class="bookmark-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- BACK FACE (Summary) -->
            <div class="card-face card-back">
                <div class="card-swipe-overlay left"></div>
                <div class="card-swipe-overlay right"></div>
                <div class="card-back-content">
                    <div class="three-segment-progress">
                        <div class="progress-bar-gradient"></div>
                    </div>
                    <h3 class="card-back-header">Summary</h3>
                    <div class="card-summary-text">${summaryHTML}</div>
                </div>
                <!-- Summary face: AA (left), Dig deeper (center), Bookmark (right) -->
                <div class="card-nav-hints card-nav-hints-summary">
                    <button class="btn-text-size" aria-label="Toggle text size">
                        <span class="text-size-small">A</span><span class="text-size-large">A</span>
                    </button>
                    <span class="nav-hint nav-hint-center nav-hint-dig-deeper" data-action="flip">Dig deeper ↑</span>
                    <button class="btn-bookmark" aria-label="Bookmark this story" data-story-id="${story.id}">
                        <svg class="bookmark-icon" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- SINGLE ADAPTIVE BACK BUTTON — adapts to current layer -->
        <button class="btn-universal-back back-hidden" aria-label="Go back"><span class="back-chevron">&#8249;</span></button>

        <!-- Q&A CARD - slides up from bottom of story card -->
        <div class="qa-card" data-story-id="${story.id}">
            <p class="qa-prompt">Are you curious about:</p>
            <div class="qa-questions-list">
                <!-- Questions injected by populateQACard() -->
            </div>
        </div>

        <!-- ANSWER CARD - slides up when question is clicked -->
        <div class="answer-card" data-story-id="${story.id}">
            <div class="three-segment-progress">
                <div class="progress-bar-gradient"></div>
            </div>
            <div class="answer-header">
                <p class="answer-question-text"></p>
            </div>
            <div class="answer-body">
                <p class="answer-text"></p>
            </div>
            <div class="answer-rating">
                <div class="rating-stars">
                    <button class="rating-star" data-value="1">★</button>
                    <button class="rating-star" data-value="2">★</button>
                    <button class="rating-star" data-value="3">★</button>
                    <button class="rating-star" data-value="4">★</button>
                    <button class="rating-star" data-value="5">★</button>
                </div>
            </div>
            <div class="answer-bottom-bar">
                <button class="btn-text-size" aria-label="Toggle text size">
                    <span class="text-size-small">A</span><span class="text-size-large">A</span>
                </button>
                <button class="nav-hint nav-hint-center answer-dig-deeper-hint">Dig Deeper ↑</button>
                <button class="btn-bookmark answer-bookmark" aria-label="Bookmark this answer" data-story-id="${story.id}">
                    <svg class="bookmark-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- DIG DEEPER Q&A CARD - slides up when Dig Deeper is clicked -->
        <div class="dig-deeper-qa-card" data-story-id="${story.id}">
            <div class="dig-deeper-header">
                <div class="dig-deeper-header-text">
                    <h2 class="dig-deeper-headline">Dig deeper</h2>
                    <p class="dig-deeper-subheading">Curiosity never killed the cat</p>
                </div>
            </div>
            <div class="dig-deeper-questions-list">
                <!-- Dig Deeper questions injected by populateDigDeeperQACard() -->
            </div>
            <div class="dig-deeper-bottom-bar">
                <button class="btn-text-size" aria-label="Toggle text size">
                    <span class="text-size-small">A</span><span class="text-size-large">A</span>
                </button>
                <button class="back-to-headline-link">Back to headline</button>
                <button class="btn-bookmark" aria-label="Bookmark this story" data-story-id="${story.id}">
                    <svg class="bookmark-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- DIG DEEPER ANSWER CARD - slides up when dig deeper question is clicked -->
        <div class="dig-deeper-answer-card" data-story-id="${story.id}">
            <div class="three-segment-progress">
                <div class="progress-bar-gradient"></div>
            </div>
            <div class="answer-header">
                <p class="answer-question-text"></p>
            </div>
            <div class="answer-body">
                <p class="answer-text"></p>
            </div>
            <div class="answer-rating">
                <div class="rating-stars">
                    <button class="rating-star" data-value="1">★</button>
                    <button class="rating-star" data-value="2">★</button>
                    <button class="rating-star" data-value="3">★</button>
                    <button class="rating-star" data-value="4">★</button>
                    <button class="rating-star" data-value="5">★</button>
                </div>
            </div>
            <div class="answer-bottom-bar dig-deeper-answer-bottom-bar">
                <button class="btn-text-size" aria-label="Toggle text size">
                    <span class="text-size-small">A</span><span class="text-size-large">A</span>
                </button>
                <button class="back-to-headline-link">Back to headline</button>
                <button class="btn-bookmark answer-bookmark" aria-label="Bookmark this answer" data-story-id="${story.id}">
                    <svg class="bookmark-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    return card;
}

// Flip card function - manages headline/summary flip AND Q&A peek state
function flipCard(card, story) {
    const isFlipped = card.dataset.flipped === 'true';

    if (isFlipped) {
        // Flip back to front (headline)
        card.classList.remove('flipped');
        card.dataset.flipped = 'false';
        trackCardFlip(story.headline, 'to_front');

        // CRITICAL: Hide Q&A card when returning to headline
        setQACardState(QA_STATES.HIDDEN);
    } else {
        // Flip to back (summary)
        card.classList.add('flipped');
        card.dataset.flipped = 'true';
        trackCardFlip(story.headline, 'to_summary');
        logSupabaseEvent('card_flipped_to_summary', { story_headline: story.headline });

        // Track progress: user visited summary
        const storyId = story.id;
        if (!storyProgress[storyId]) storyProgress[storyId] = { visitedSummary: false, clickedL3: false, clickedL5: false };
        storyProgress[storyId].visitedSummary = true;
        updateThreeSegmentProgress(storyId);

        // Populate Q&A card content (but keep it HIDDEN until user swipes up)
        populateQACard(story);
        // Q&A stays HIDDEN on summary - user swipes up to see it
        setQACardState(QA_STATES.HIDDEN);

        // Hide the "Tap to flip" hint permanently after first flip
        if (localStorage.getItem('fyi_has_flipped') !== 'true') {
            localStorage.setItem('fyi_has_flipped', 'true');
            document.querySelectorAll('.nav-flip').forEach(hint => {
                hint.classList.add('hidden');
            });
        }
    }
}

/**
 * Populate Q&A card with story questions
 * Called when flipping to summary to prepare the peek state
 * Q&A card is now INSIDE the story card element
 */
function populateQACard(story) {
    if (!story || !story.questions) return;

    state.currentStory = story;

    // Find the Q&A card INSIDE the current story card
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const qaCard = currentCard.querySelector('.qa-card');
    const questionsList = currentCard.querySelector('.qa-questions-list');
    if (!questionsList) return;

    questionsList.innerHTML = '';

    // For FAQs, only show first 3 questions
    const questionsToShow = story.isFAQ ? story.questions.slice(0, 3) : story.questions;

    questionsToShow.forEach((q, index) => {
        const bulletColor = L3_QUESTION_COLORS[index] || 'var(--accent)';
        const bulletTextColor = L3_QUESTION_COLORS[index] ? getContrastTextColor(L3_QUESTION_COLORS[index]) : '#FFFFFF';
        const button = document.createElement('button');
        button.className = 'qa-question-btn';
        button.innerHTML = `
            <span class="qa-question-number" style="background-color: ${bulletColor}; color: ${bulletTextColor}">${index + 1}</span>
            <span class="qa-question-text">${parseFormattedText(q.text)}</span>
        `;
        button.addEventListener('click', () => {
            triggerHaptic('light');
            // Use new Answer Card system instead of legacy modal
            showAnswerCard(index);
        });
        questionsList.appendChild(button);
    });

    // Add skip button (no number, use arrow icon)
    const skipButton = document.createElement('button');
    skipButton.className = 'qa-question-btn skip';
    const skipText = story.isFAQ ? 'Skip this FAQ' : 'Skip this story';
    skipButton.innerHTML = `
        <span class="qa-question-skip-icon">→</span>
        <span class="qa-question-text">${skipText}</span>
    `;
    skipButton.addEventListener('click', () => {
        triggerHaptic('light');
        trackQuestionsSkipped(story.headline);
        // Return to headline and go to next story
        setQACardState(QA_STATES.HIDDEN);
        const card = document.querySelector('.story-card[data-card-type="current"]');
        if (card) {
            card.classList.remove('flipped');
            card.dataset.flipped = 'false';
        }
        state.cardLayer = 'headline';
        state.isCardFlipped = false;
        updateBackButtonVisibility();
        setTimeout(() => nextCard(), 300);
    });
    questionsList.appendChild(skipButton);

    // Also populate legacy modal for Answer/Dig Deeper views
    if (elements.modalEmoji) elements.modalEmoji.textContent = story.emoji || '✦';
    if (elements.modalHeadline) elements.modalHeadline.innerHTML = parseFormattedText(story.headline);
}

function setupCardInteractions(card, story) {
    // Touch events for swiping - NEW NAVIGATION SYSTEM
    card.addEventListener('touchstart', (e) => handleDragStart(e, card, story), { passive: true });
    card.addEventListener('touchmove', (e) => handleDragMove(e, card), { passive: false });
    card.addEventListener('touchend', (e) => handleDragEnd(e, card, story));

    // Mouse events for desktop swiping
    card.addEventListener('mousedown', (e) => handleDragStart(e, card, story));
    card.addEventListener('mousemove', (e) => handleDragMove(e, card));
    card.addEventListener('mouseup', (e) => handleDragEnd(e, card, story));
    card.addEventListener('mouseleave', (e) => {
        if (state.isDragging) handleDragEnd(e, card, story);
    });

    // Setup click handlers for nav hints
    setupNavHintClickHandlers(card, story);

    // Setup Q&A card click handler (tap to expand from peeking state)
    setupQACardClickHandler(card);

    // Setup Answer card button handlers
    setupAnswerCardButtons(card);

    // Setup Dig Deeper Answer card button handlers
    setupDigDeeperAnswerCardButtons(card);

    // Setup Dig Deeper Q&A card button handlers (Back to headline)
    setupDigDeeperQACardButtons(card);

    // Setup universal back buttons on all card layers
    setupUniversalBackButtons(card, story);

    // Setup rating star handlers
    setupRatingStars(card);

    // Setup text size toggle buttons
    setupTextSizeButtons(card);

    // Setup bookmark buttons
    setupBookmarkButtons(card);

    // Setup dig deeper hint button (answer card → dig deeper Q&A)
    setupDigDeeperHintButton(card);
}

/**
 * Setup universal back buttons on all card layers
 * Each back button has a data-layer attribute indicating which layer it belongs to.
 * Clicking navigates one level up in the card hierarchy.
 * Uses both touchend + click handlers (same pattern as AA buttons) for mobile reliability.
 */
function setupUniversalBackButtons(card, story) {
    // Single adaptive back button — reads state.cardLayer to decide action
    const btn = card.querySelector('.btn-universal-back');
    if (!btn) return;

    let touchHandled = false;

    const handleBack = () => {
        triggerHaptic('light');

        // ━━━━ SELF-CONTAINED BACK BUTTON ━━━━
        // This handler does ALL work itself — no delegation to hide functions
        // which have their own state management that causes double-calls.

        const entryLayer = state.cardLayer;

        // Defensive: Verify state.cardLayer is valid
        const validLayers = ['headline', 'summary', 'questions', 'answer', 'dig-deeper-qa', 'dig-deeper-answer'];
        if (!validLayers.includes(entryLayer)) {
            console.error('[BackButton] Invalid cardLayer:', entryLayer, '— resetting to headline');
            state.cardLayer = 'headline';
            updateBackButtonVisibility(card);
            return;
        }

        // Get the previous layer from the map
        const previousLayer = BACK_NAVIGATION_MAP[entryLayer];
        if (!previousLayer) {
            return;
        }


        // Find the current story card for DOM operations
        const currentCard = document.querySelector('.story-card[data-card-type="current"]') || card;

        // ── Navigate based on current layer ──
        if (entryLayer === 'summary') {
            // L2 → L1: Summary → Headline
            flipCard(card, story);
            state.isCardFlipped = false;
            state.cardLayer = 'headline';
            setQACardState(QA_STATES.HIDDEN);

        } else if (entryLayer === 'questions') {
            // L3 → L2: Questions → Summary
            setQACardState(QA_STATES.HIDDEN);
            state.cardLayer = 'summary';

        } else if (entryLayer === 'answer') {
            // L4 → L3: Answer → Questions (DOM only, no hideAnswerCard delegation)
            const answerCard = currentCard.querySelector('.answer-card');
            if (answerCard) {
                answerCard.classList.remove('active');
                answerCard.style.transform = '';
            }
            state.cardLayer = 'questions';
            // Note: Do NOT clear currentQuestionIndex here — the Q&A card still needs it

        } else if (entryLayer === 'dig-deeper-qa') {
            // L5 → L4: Dig Deeper QA → Answer (DOM only, no hideDigDeeperQACard delegation)
            const digDeeperQACard = currentCard.querySelector('.dig-deeper-qa-card');
            if (digDeeperQACard) {
                digDeeperQACard.classList.remove('active');
                digDeeperQACard.style.transform = '';
            }
            state.cardLayer = 'answer';

        } else if (entryLayer === 'dig-deeper-answer') {
            // L6 → L5: Dig Deeper Answer → Dig Deeper QA (DOM only)
            const digDeeperAnswerCard = currentCard.querySelector('.dig-deeper-answer-card');
            if (digDeeperAnswerCard) {
                digDeeperAnswerCard.classList.remove('active');
                digDeeperAnswerCard.style.transform = '';
            }
            state.cardLayer = 'dig-deeper-qa';
        }

        // ── Update UI (single consolidated call) ──
        updateUI(card);
    };

    // Touchend handler - fires BEFORE click on mobile
    btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        const touch = e.changedTouches[0];
        if (touch) {
            touchHandled = true;
            handleBack();
            setTimeout(() => { touchHandled = false; }, 300);
        }
    }, { capture: true });

    // Click handler for desktop
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (touchHandled) return;
        handleBack();
    });

    // Initial visibility
    updateBackButtonVisibility(card);
}

/**
 * Show/hide the single back button based on current card layer.
 * Hidden on L1 (headline), visible on all other layers.
 * Uses class-based toggling so CSS default (display: block) works reliably.
 */
function updateBackButtonVisibility(card) {
    if (!card) {
        card = document.querySelector('.story-card[data-card-type="current"]');
    }
    if (!card) return;
    const btn = card.querySelector('.btn-universal-back');
    if (!btn) return;
    // Hide on headline, show on everything else
    if (state.cardLayer === 'headline') {
        btn.classList.add('back-hidden');
    } else {
        btn.classList.remove('back-hidden');
    }
}

/**
 * Consolidated UI update — call once per navigation event.
 * Replaces scattered updateBackButtonVisibility + updateThreeSegmentProgress + updateBackgroundBlob calls.
 */
function updateUI(card) {
    card = card || document.querySelector('.story-card[data-card-type="current"]');
    if (!card) return;
    updateBackButtonVisibility(card);
    updateThreeSegmentProgress();
    updateBackgroundBlob();
}

/**
 * Setup text size toggle buttons on card
 * Uses both click AND touchend handlers for bulletproof mobile support.
 * On mobile, the card's touchstart/touchend drag handlers can intercept before
 * the synthetic click event fires. Using a direct touchend handler with
 * stopImmediatePropagation ensures the toggle fires reliably.
 */
function setupTextSizeButtons(card) {
    const textSizeBtns = card.querySelectorAll('.btn-text-size');
    textSizeBtns.forEach(btn => {
        // Track touch state to prevent double-fire from touchend + click
        let touchHandled = false;

        // Touchstart: just stop propagation (no long press timer needed)
        btn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { capture: true });

        // Touchend: toggle slider visibility (no font change on tap)
        btn.addEventListener('touchend', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            touchHandled = true;
            toggleSliderVisibility();
            setTimeout(() => { touchHandled = false; }, 300);
        }, { capture: true });

        // Click handler - for desktop and as fallback
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (touchHandled) return;
            toggleSliderVisibility();
        });

        // Apply current state
        if (textEnlarged) {
            btn.classList.add('active');
        }
    });
}

/**
 * Setup bookmark buttons on card
 */
function setupBookmarkButtons(card) {
    card.querySelectorAll('.btn-bookmark').forEach(btn => {
        if (btn._bookmarkBound) return; // Already bound
        btn._bookmarkBound = true;

        let touchHandled = false;

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            touchHandled = true;
            toggleBookmark(btn);
            setTimeout(() => { touchHandled = false; }, 300);
        }, { capture: true, passive: false });

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (touchHandled) return;
            toggleBookmark(btn);
        }, { capture: true });
    });
}

/**
 * Setup click handlers for Dig Deeper Q&A card (Back to headline)
 */
function setupDigDeeperQACardButtons(card) {
    const digDeeperQACard = card.querySelector('.dig-deeper-qa-card');
    if (!digDeeperQACard) return;

    const backToHeadlineBtn = digDeeperQACard.querySelector('.back-to-headline-link');

    if (backToHeadlineBtn) {
        backToHeadlineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            // Reset ALL card states and return to headline
            backToHeadline();
        });
    }
}

/**
 * Return all the way back to headline from any depth
 */
function backToHeadline() {

    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    // Hide all overlay cards
    const digDeeperAnswerCard = currentCard.querySelector('.dig-deeper-answer-card');
    const digDeeperQACard = currentCard.querySelector('.dig-deeper-qa-card');
    const answerCard = currentCard.querySelector('.answer-card');
    const qaCard = currentCard.querySelector('.qa-card');

    if (digDeeperAnswerCard) {
        digDeeperAnswerCard.classList.remove('active');
        digDeeperAnswerCard.style.transform = '';
    }
    if (digDeeperQACard) {
        digDeeperQACard.classList.remove('active');
        digDeeperQACard.style.transform = '';
    }
    if (answerCard) {
        answerCard.classList.remove('active');
        answerCard.style.transform = '';
    }

    // Hide Q&A card
    setQACardState(QA_STATES.HIDDEN);
    if (qaCard) {
        qaCard.style.transform = '';
    }

    // Flip card back to headline
    currentCard.classList.remove('flipped');
    currentCard.dataset.flipped = 'false';

    // Reset state
    state.cardLayer = 'headline';
    state.isCardFlipped = false;
    state.currentQuestionIndex = null;
    state.currentDigDeeperQuestionIndex = null;

    updateUI();
}

/**
 * Setup click handlers for Answer card buttons (Dig Deeper)
 * The dig deeper hint button has an inline onclick as primary handler.
 * This function adds belt-and-suspenders touchend handler for mobile reliability.
 */
function setupAnswerCardButtons(card) {
    const answerCard = card.querySelector('.answer-card');
    if (!answerCard) return;

    // "Dig Deeper ↑" button in the bottom bar
    // Primary handler: inline onclick="showDigDeeperQACard()" in HTML template
    // Secondary handler: touchend for guaranteed mobile reliability
    const digDeeperHint = answerCard.querySelector('.answer-dig-deeper-hint');
    if (digDeeperHint) {
        digDeeperHint.addEventListener('touchend', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            if (e.changedTouches[0]) {
                triggerHaptic('light');
                showDigDeeperQACard();
            }
        }, { capture: true });
    } else {
        console.warn('[setupAnswerCardButtons] WARNING: dig deeper hint NOT found');
    }
}

/**
 * NUCLEAR: Re-attach dig deeper handler with clone-and-replace.
 * Called every time answer card is shown to guarantee the handler is fresh.
 * Uses cloneNode to strip ALL existing event listeners, then re-attaches.
 */
/**
 * Setup dig deeper hint button — bound once per card creation.
 * Uses guard to prevent double-binding.
 */
function setupDigDeeperHintButton(card) {
    const btn = card.querySelector('.answer-dig-deeper-hint');
    if (!btn || btn._digDeeperBound) return;
    btn._digDeeperBound = true;

    // Remove inline onclick if present (we handle it properly here)
    btn.removeAttribute('onclick');

    let touchHandled = false;

    btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        touchHandled = true;
        triggerHaptic('light');
        showDigDeeperQACard();
        setTimeout(() => { touchHandled = false; }, 300);
    }, { capture: true, passive: false });

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (touchHandled) return;
        triggerHaptic('light');
        showDigDeeperQACard();
    }, { capture: true });
}

/**
 * Setup click handlers for Dig Deeper Answer card buttons
 * Back navigation is now handled by universal back button.
 */
function setupDigDeeperAnswerCardButtons(card) {
    const digDeeperAnswerCard = card.querySelector('.dig-deeper-answer-card');
    if (!digDeeperAnswerCard) return;

    const backToHeadlineBtn = digDeeperAnswerCard.querySelector('.back-to-headline-link');
    if (backToHeadlineBtn) {
        backToHeadlineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            backToHeadline();
        });
    }
}

/**
 * Setup rating star click handlers for both answer cards
 */
function setupRatingStars(card) {
    // Answer Card stars
    const answerCard = card.querySelector('.answer-card');
    if (answerCard) {
        setupStarInteractions(answerCard);
    }

    // Dig Deeper Answer Card stars
    const digDeeperAnswerCard = card.querySelector('.dig-deeper-answer-card');
    if (digDeeperAnswerCard) {
        setupStarInteractions(digDeeperAnswerCard);
    }
}

/**
 * Setup click + hover interactions for rating stars in a card
 */
function setupStarInteractions(cardElement) {
    const stars = cardElement.querySelectorAll('.rating-star');

    stars.forEach(star => {
        // Click handler
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            handleStarClick(star, cardElement);
        });

        // Cumulative hover: highlight this star and all before it
        star.addEventListener('mouseenter', () => {
            const hoverValue = parseInt(star.dataset.value);
            stars.forEach(s => {
                const v = parseInt(s.dataset.value);
                if (v <= hoverValue) {
                    s.classList.add('hovered');
                } else {
                    s.classList.remove('hovered');
                }
            });
        });

        // Remove hover state on mouse leave (from each star)
        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hovered'));
        });
    });
}

/**
 * Handle star click - highlight clicked star and all before it
 */
function handleStarClick(clickedStar, cardElement) {
    const value = parseInt(clickedStar.dataset.value);
    const stars = cardElement.querySelectorAll('.rating-star');

    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        if (starValue <= value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    triggerHaptic('light');

    // Track the rating (for analytics)
    if (state.currentQuestion) {
        trackAnswerRated(state.currentStory?.headline, state.currentQuestion.text, value);
        logSupabaseEvent('answer_rated', {
            story_headline: state.currentStory?.headline || '',
            question_path: state.currentQuestion.text,
            rating: value
        });
    }
}

/**
 * Setup click handler for Q&A card inside story card
 * Tapping the peeking Q&A card activates it to full view
 */
function setupQACardClickHandler(card) {
    // Q&A card is now activated via swipe up or Read Ahead click
    // No longer needs tap-to-expand from peeking state
    const qaCard = card.querySelector('.qa-card');
    if (!qaCard) return;

    // Stop propagation when clicking inside active Q&A card
    qaCard.addEventListener('click', (e) => {
        if (state.qaCardState === QA_STATES.ACTIVE) {
            // Let question button clicks propagate normally
        }
    });
}

// Click handlers for nav hints
// CRITICAL: Check for 'disabled' class (not 'hidden') - disabled buttons stay in grid but don't work
function setupNavHintClickHandlers(card, story) {
    const prevHint = card.querySelector('.nav-hint-prev');
    const nextHint = card.querySelector('.nav-hint-next');

    // Prev button - only active if NOT disabled
    if (prevHint && !prevHint.classList.contains('disabled')) {
        prevHint.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            handleSwipeLeft(card, story);
        });
    }

    // READ AHEAD button (L1 headline → L2 summary) — explicit, isolated handler
    const readAheadBtn = card.querySelector('.nav-hint-read-ahead');
    if (readAheadBtn) {
        readAheadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');

            // EXPLICIT: Always go headline → summary, never skip
            if (card.dataset.flipped !== 'true') {
                flipCard(card, story);
                state.isCardFlipped = true;
                state.cardLayer = 'summary';
                updateUI(card);
            }
        });
    }

    // DIG DEEPER button (L2 summary → Q&A questions) — explicit, isolated handler
    const digDeeperBtn = card.querySelector('.card-nav-hints .nav-hint-dig-deeper');
    if (digDeeperBtn) {
        digDeeperBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');

            // EXPLICIT: Always go summary → questions, never skip
            if (card.dataset.flipped === 'true' && state.cardLayer === 'summary') {
                state.cardLayer = 'questions';
                setQACardState(QA_STATES.ACTIVE);
                setupQACardSwipe();
                logSupabaseEvent('questions_opened', { story_headline: story.headline });
                updateUI(card);
            }
        });
    }

    // Next button - only active if NOT disabled
    if (nextHint && !nextHint.classList.contains('disabled')) {
        nextHint.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerHaptic('light');
            handleSwipeRight(card, story);
        });
    }
}

// ==========================================
// NEW SWIPE MECHANICS (Part 1 Implementation)
// ==========================================
// Left swipe = Previous story (navigate to prev story headline)
// Right swipe = Next story (navigate to next story headline)
// Swipe up = Flip card / Reveal next layer (headline->summary->questions)
// Swipe down = Return to previous layer (questions->summary->headline)
// ==========================================

function handleDragStart(e, card, story) {
    // NUCLEAR FIX: If touch originates inside an active sub-card (answer, dig deeper),
    // do NOT start drag on the parent story card — the sub-card handles its own gestures
    const target = e.target || e.srcElement;
    const activeSubCard = target.closest('.answer-card.active, .dig-deeper-qa-card.active, .dig-deeper-answer-card.active');
    if (activeSubCard) {
        state.isDragging = false;
        return;
    }

    // Check if touch is inside a scrollable L1/L2 content area
    const scrollableEl = target.closest('.card-teaser, .card-summary-text');
    state._scrollTarget = null;
    state._gestureDecided = false;
    state._isContentScroll = false;
    if (scrollableEl && scrollableEl.scrollHeight > scrollableEl.clientHeight + 2) {
        state._scrollTarget = scrollableEl;
    }

    state.isDragging = true;
    state.isLongPress = false;
    state.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    state.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    state.currentX = 0;
    state.currentY = 0;
    state.swipeStartTime = Date.now();
    card.classList.add('dragging');
    card.classList.add('touch-active'); // Subtle scale feedback
    hideSwipeHint();
}

// Legacy function kept for compatibility
function clearLongPressTimer() {
    // No-op: long press timer removed
}

function handleDragMove(e, card) {
    if (!state.isDragging) return;

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - state.startX;
    const deltaY = clientY - state.startY;

    // NUCLEAR FIX: If touch is in a scrollable L1/L2 area, decide gesture once
    if (state._scrollTarget && !state._gestureDecided && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
        state._gestureDecided = true;
        const isVertical = Math.abs(deltaY) > Math.abs(deltaX);
        if (isVertical) {
            // Vertical movement in scrollable area → let native scroll handle it
            const atTop = state._scrollTarget.scrollTop <= 0;
            const atBottom = state._scrollTarget.scrollTop >= (state._scrollTarget.scrollHeight - state._scrollTarget.clientHeight - 2);
            // Only allow native scroll if NOT at boundary, or if at boundary and pulling further into boundary
            if ((deltaY > 0 && !atTop) || (deltaY < 0 && !atBottom) || (!atTop && !atBottom)) {
                state._isContentScroll = true;
            }
            // If at top pulling down or at bottom pulling up, let card swipe handle it
        }
        // Horizontal movement → proceed with card drag (not content scroll)
    }

    // If content is scrolling, abort all card transforms
    if (state._isContentScroll) {
        return; // Let native scroll happen
    }

    state.currentX = deltaX;
    state.currentY = deltaY;

    // Determine dominant axis
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
        // Horizontal swipe - DO NOT move current card, only show direction indicators
        if (e.type === 'touchmove' && Math.abs(deltaX) > 10) {
            e.preventDefault();
        }

        // Show visual indicators for swipe direction (no card transform)
        card.classList.toggle('swiping-left', deltaX < -20);
        card.classList.toggle('swiping-right', deltaX > 20);

        // PROGRESSIVE REVEAL: Animate adjacent card proportionally during drag
        const screenWidth = window.innerWidth;
        const dragProgress = Math.min(Math.abs(deltaX) / (screenWidth * 0.35), 1);

        if (deltaX < 0) {
            // Swiping LEFT (toward NEXT story)
            const nextCard = document.querySelector('.story-card[data-card-type="next"]');
            if (nextCard) {
                const nextOffset = 110 - (dragProgress * 110);
                const nextOpacity = 0.7 + (dragProgress * 0.3);
                nextCard.style.transform = `translateX(${nextOffset}%)`;
                nextCard.style.opacity = nextOpacity;
                nextCard.style.transition = 'none';
            }
        } else {
            // Swiping RIGHT (toward PREV story)
            const prevCard = document.querySelector('.story-card[data-card-type="prev"]');
            if (prevCard) {
                const prevOffset = -110 + (dragProgress * 110);
                const prevOpacity = 0.7 + (dragProgress * 0.3);
                prevCard.style.transform = `translateX(${prevOffset}%)`;
                prevCard.style.opacity = prevOpacity;
                prevCard.style.transition = 'none';
            }
        }
    } else {
        // Vertical swipe - DO NOT move card, only track direction indicators
        if (e.type === 'touchmove' && Math.abs(deltaY) > 10) {
            e.preventDefault();
        }

        // Direction classes only — no translateY on card
        card.classList.toggle('swiping-up', deltaY < -20);
        card.classList.toggle('swiping-down', deltaY > 20);
    }
}

function handleDragEnd(e, card, story) {
    if (!state.isDragging) { return; }

    state.isDragging = false;
    card.classList.remove('dragging', 'swiping-left', 'swiping-right', 'swiping-up', 'swiping-down', 'touch-active');

    // NUCLEAR FIX: If was content scrolling, just clean up — no swipe action
    if (state._isContentScroll) {
        state._scrollTarget = null;
        state._gestureDecided = false;
        state._isContentScroll = false;
        state.currentX = 0;
        state.currentY = 0;
        return;
    }
    state._scrollTarget = null;
    state._gestureDecided = false;
    state._isContentScroll = false;

    const deltaX = state.currentX;
    const deltaY = state.currentY;
    const swipeDuration = Date.now() - state.swipeStartTime;

    // NEW: Detect TAP (minimal movement, quick touch) - Instagram style
    const isTap = Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15 && swipeDuration < 300;

    if (isTap) {
        handleTapZone(e, card, story);
        snapCardBack(card);
        state.currentX = 0;
        state.currentY = 0;
        return;
    }

    // Calculate velocity (px/ms)
    const velocityX = Math.abs(deltaX) / swipeDuration;
    const velocityY = Math.abs(deltaY) / swipeDuration;

    // Determine dominant axis
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

    // Check if swipe meets threshold (distance OR velocity)
    const meetsHorizontalThreshold = Math.abs(deltaX) > state.dragThreshold || velocityX > state.swipeVelocityThreshold;
    const meetsVerticalThreshold = Math.abs(deltaY) > state.dragThreshold || velocityY > state.swipeVelocityThreshold;

    if (isHorizontal && meetsHorizontalThreshold) {
        // HORIZONTAL SWIPE: left/right navigation
        triggerHaptic('light');

        if (deltaX < 0) {
            // LEFT SWIPE = Next story (swipe toward next)
            handleSwipeRight(card, story);
        } else {
            // RIGHT SWIPE = Previous story (swipe toward prev)
            handleSwipeLeft(card, story);
        }
    } else if (isVertical && meetsVerticalThreshold) {
        // VERTICAL SWIPE: layer navigation
        triggerHaptic('light');

        if (deltaY < 0) {
            // SWIPE UP = Reveal next layer
            handleSwipeUp(card, story);
        } else {
            // SWIPE DOWN = Return to previous layer
            handleSwipeDown(card, story);
        }
    } else {
        // Small drag or tap: snap back
        snapCardBack(card);
    }

    state.currentX = 0;
    state.currentY = 0;
}

/**
 * Handle TAP based on screen position - Instagram style
 * Left 1/3 = Previous story
 * Center 1/3 = Flip card / Reveal
 * Right 1/3 = Next story
 */
function handleTapZone(e, card, story) {
    // CRITICAL: Ignore taps on buttons (text size toggle, bookmark, etc.)
    const target = e.target;
    if (target.closest('.btn-text-size') ||
        target.closest('.btn-bookmark') ||
        target.closest('.nav-hint-center') ||
        target.closest('button')) {
        return; // Let the button handle its own click
    }

    const tapX = e.type.includes('touch')
        ? (e.changedTouches ? e.changedTouches[0].clientX : state.startX)
        : e.clientX;

    const screenWidth = window.innerWidth;
    const leftThird = screenWidth / 3;
    const rightThird = screenWidth * 2 / 3;

    if (tapX < leftThird) {
        // LEFT THIRD = Previous story
        triggerHaptic('light');
        handleSwipeLeft(card, story);
    } else if (tapX > rightThird) {
        // RIGHT THIRD = Next story
        triggerHaptic('light');
        handleSwipeRight(card, story);
    } else {
        // CENTER THIRD = Flip card / Reveal (same as swipe up)
        triggerHaptic('light');
        handleSwipeUp(card, story);
    }
}

/**
 * Handle LEFT swipe = Navigate to PREVIOUS story
 * CRITICAL: Only works from headline/summary, NOT from Q&A/answer
 */
function handleSwipeLeft(card, story) {
    // Block story navigation from Q&A or deeper views
    if (state.cardLayer === 'questions' ||
        state.cardLayer === 'answer' ||
        state.cardLayer === 'dig-deeper-qa' ||
        state.cardLayer === 'dig-deeper-answer') {
        snapCardBack(card);
        return;
    }

    if (state.currentIndex <= 0) {
        // Already at first story - bounce back
        showToast('', "You're at the first story");
        snapCardBack(card);
        return;
    }

    // Track the navigation
    trackEvent('Story Swiped', { direction: 'prev', from: state.currentIndex + 1, to: state.currentIndex });

    // CRITICAL: Reset ALL card states before navigating
    resetAllCardStates();

    // Navigate to previous story (always to headline, not summary)
    prevCard();
}

/**
 * Handle RIGHT swipe = Navigate to NEXT story
 * CRITICAL: Only works from headline/summary, NOT from Q&A/answer/dig-deeper
 */
function handleSwipeRight(card, story) {
    // Block story navigation from Q&A or deeper views
    if (state.cardLayer === 'questions' ||
        state.cardLayer === 'answer' ||
        state.cardLayer === 'dig-deeper-qa' ||
        state.cardLayer === 'dig-deeper-answer') {
        snapCardBack(card);
        return;
    }

    if (state.currentIndex >= state.totalStories - 1) {
        // At last story - show completion or bounce
        if (!elements.completionScreen.classList.contains('visible')) {
            showCompletion();
        } else {
            showToast('', "You've seen all stories");
            snapCardBack(card);
        }
        return;
    }

    // Track the navigation
    trackEvent('Story Swiped', { direction: 'next', from: state.currentIndex + 1, to: state.currentIndex + 2 });

    // CRITICAL: Reset ALL card states before navigating
    resetAllCardStates();

    // Navigate to next story (always to headline)
    nextCard();
}

/**
 * Handle SWIPE UP = Reveal next layer
 * From headline -> flip to summary (Q&A peeks)
 * From summary -> Q&A becomes active (from peeking to active)
 */
function handleSwipeUp(card, story) {
    // Guard: Only handle swipe up on headline or summary layers
    // Q&A, answer, and dig-deeper layers have their own swipe handlers
    if (state.cardLayer !== 'headline' && state.cardLayer !== 'summary') {
        return;
    }

    const isFlipped = card.dataset.flipped === 'true';

    if (!isFlipped && state.cardLayer === 'headline') {
        // Currently on HEADLINE - flip to SUMMARY
        flipCard(card, story);
        state.isCardFlipped = true;
        state.cardLayer = 'summary';
    } else if (isFlipped && state.cardLayer === 'summary') {
        // Currently on SUMMARY - show Q&A (ACTIVE)
        state.cardLayer = 'questions';
        setQACardState(QA_STATES.ACTIVE);
        setupQACardSwipe(); // Setup swipe-down to dismiss
        logSupabaseEvent('questions_opened', { story_headline: story.headline });
    } else {
        return;
    }

    updateUI(card);
}

/**
 * Handle SWIPE DOWN = Return to previous layer
 * From Q&A/Answer/etc -> handled by their own swipe handlers, do nothing here
 * From summary -> flip back to headline
 * From headline -> do nothing (already at top)
 */
function handleSwipeDown(card, story) {
    // CRITICAL: If we're in Q&A or deeper layers, their own handlers manage swipe down
    // Do NOT flip the card - just snap back and let the layer handler do its job
    if (state.cardLayer === 'questions' ||
        state.cardLayer === 'answer' ||
        state.cardLayer === 'dig-deeper-qa' ||
        state.cardLayer === 'dig-deeper-answer') {
        snapCardBack(card);
        return;
    }

    const isFlipped = card.dataset.flipped === 'true';

    if (isFlipped && state.cardLayer === 'summary') {
        // Currently on SUMMARY - flip back to HEADLINE
        flipCard(card, story);
        state.isCardFlipped = false;
        state.cardLayer = 'headline';
        // Also hide Q&A card completely when going back to headline
        setQACardState(QA_STATES.HIDDEN);
        updateUI(card);
    } else {
        // Already on HEADLINE - bounce back, nothing to do
        snapCardBack(card);
    }
}

/**
 * Snap card back to original position with spring animation
 */
function snapCardBack(card) {
    // Current card stays in place — no transform needed (card never moves during drag)
    card.style.transform = '';
    card.style.transition = '';

    // Reset adjacent cards to their off-screen positions
    const prevCard = document.querySelector('.story-card[data-card-type="prev"]');
    const nextCard = document.querySelector('.story-card[data-card-type="next"]');

    if (prevCard) {
        prevCard.style.transition = 'transform 300ms ease, opacity 300ms ease';
        prevCard.style.transform = 'translateX(-110%)';
        prevCard.style.opacity = '0.7';
    }

    if (nextCard) {
        nextCard.style.transition = 'transform 300ms ease, opacity 300ms ease';
        nextCard.style.transform = 'translateX(110%)';
        nextCard.style.opacity = '0.7';
    }

    setTimeout(() => {
        if (prevCard) prevCard.style.transition = '';
        if (nextCard) nextCard.style.transition = '';
    }, 300);
}

/**
 * Open Questions card with push-from-bottom transition
 * This is called when user swipes up from Summary card
 * Q&A card pushes up to replace Summary (like PowerPoint slide)
 */
function openQuestionsWithPushTransition(story) {
    // Push current state to modal stack
    state.modalStack.push({ type: 'summary', storyId: story.id });

    // Update state
    state.currentStory = story;
    state.cardLayer = 'questions';

    // Set initial position for Q&A card (below viewport)
    elements.qaModal.style.transform = 'translateX(-50%) translateY(100%)';

    // Open the Q&A card with push transition
    elements.modalBackdrop.classList.add('push-transition');
    openModal(story);

    // Remove transition class after animation
    setTimeout(() => {
        elements.modalBackdrop.classList.remove('push-transition');
    }, 400);
}

function animateCardExit(card, direction, callback) {
    const swipeDuration = Date.now() - state.swipeStartTime;
    const velocity = Math.abs(state.currentX) / swipeDuration;

    // Faster swipe = faster animation (150-350ms range)
    const exitDuration = Math.max(150, Math.min(350, 250 / (velocity + 0.3)));

    const exitX = direction === 'left' ? '-110%' : '110%';

    card.classList.add('exiting');
    card.style.transition = `transform ${exitDuration}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${exitDuration}ms ease-out`;
    card.style.transform = `translateX(${exitX})`;
    card.style.opacity = '0';

    // Animate incoming card to center position
    const incomingCard = direction === 'left'
        ? document.querySelector('.story-card[data-card-type="next"]')
        : document.querySelector('.story-card[data-card-type="prev"]');

    if (incomingCard) {
        incomingCard.style.transition = `transform ${exitDuration}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${exitDuration}ms ease-out`;
        incomingCard.style.transform = 'translateX(0)';
        incomingCard.style.opacity = '1';
    }

    setTimeout(() => {
        card.style.transition = '';
        if (callback) callback();
    }, exitDuration);
}

// Legacy function - kept for compatibility but now simplified
function animateCardExitWithModal(card, direction, callback, story) {
    // For new swipe mechanics, modal is opened via swipe up
    // This function now just opens the modal directly
    openModal(story);
    if (callback) callback();
}

// ==========================================
// Card Navigation
// ==========================================

function nextCard() {
    // Reset card layer state for new navigation
    state.isCardFlipped = false;
    state.cardLayer = 'headline';

    // Log navigation to Supabase
    const fromStory = state.stories[state.currentIndex];

    // Mark current story as viewed
    if (fromStory) {
        state.viewedStories.push(fromStory.id);
    }

    state.currentIndex++;
    saveToStorage();

    if (state.currentIndex >= state.totalStories) {
        showCompletion();
    } else {
        updateProgress();
        renderProgressDots();
        renderCards();
        updatePrevButtonVisibility();
        updateBookmarkStates();

        // Log navigation event
        const toStory = state.stories[state.currentIndex];
        logSupabaseEvent('story_navigation', {
            direction: 'next',
            from_story: fromStory ? fromStory.headline : '',
            to_story: toStory ? toStory.headline : ''
        });
        logSupabaseEvent('story_opened', {
            story_headline: toStory ? toStory.headline : '',
            story_date: toStory ? toStory.date : ''
        });
    }
}

function prevCard() {
    // Reset card layer state for new navigation
    state.isCardFlipped = false;
    state.cardLayer = 'headline';

    const fromStory = state.stories[state.currentIndex];

    // If on completion screen, clear it first and show last story
    if (elements.completionScreen.classList.contains('visible')) {
        elements.completionScreen.classList.remove('visible');
        // Restore history toggle if present
        if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');
        // Decrement to show last story
        if (state.currentIndex > 0) {
            state.currentIndex--;
        } else {
            // If at index 0, we need to go to last story (totalStories - 1)
            state.currentIndex = Math.max(0, state.totalStories - 1);
        }
        saveToStorage();
        updateProgress();
        renderProgressDots();
        renderCards();
        updatePrevButtonVisibility();
        updateBookmarkStates();
        triggerHaptic('light');
        return;
    }

    // Normal prev card navigation
    if (state.currentIndex > 0) {
        state.currentIndex--;
        saveToStorage();
        updateProgress();
        renderProgressDots();
        renderCards();
        updatePrevButtonVisibility();
        updateBookmarkStates();
        triggerHaptic('light');

        // Log navigation event
        const toStory = state.stories[state.currentIndex];
        logSupabaseEvent('story_navigation', {
            direction: 'prev',
            from_story: fromStory ? fromStory.headline : '',
            to_story: toStory ? toStory.headline : ''
        });
    }
}

function updatePrevButtonVisibility() {
    if (elements.prevStoryBtn) {
        // Hide prev button on first story, unless we came from completion screen
        const shouldHide = state.currentIndex === 0 && !state.cameFromCompletion && !state.inRecapView;
        elements.prevStoryBtn.classList.toggle('hidden', shouldHide);
    }

    // Update the new story nav buttons (below card)
    updateStoryNavButtons();
}

/**
 * Update visibility of Prev/Next story navigation buttons below card
 * Buttons always remain in DOM to prevent layout shift - use 'disabled' class
 */
function updateStoryNavButtons() {
    if (elements.storyPrevBtn) {
        const disablePrev = state.currentIndex === 0;
        elements.storyPrevBtn.classList.toggle('disabled', disablePrev);
    }

    if (elements.storyNextBtn) {
        const disableNext = state.currentIndex >= state.totalStories - 1;
        elements.storyNextBtn.classList.toggle('disabled', disableNext);
    }
}

// Show prev button when navigating from completion screen to history/recap
function updatePrevButtonForCompletionNav() {
    if (elements.prevStoryBtn && state.cameFromCompletion) {
        elements.prevStoryBtn.classList.remove('hidden');
    }
}

function updateProgress() {
    if (state.totalStories === 0) {
        elements.progressFill.style.width = '0%';
        return;
    }
    const progress = ((state.currentIndex + 1) / state.totalStories) * 100;
    elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
}

function renderProgressDots() {
    if (state.totalStories === 0) {
        elements.progressDots.innerHTML = '';
        return;
    }

    let dotsHTML = '';
    for (let i = 0; i < state.totalStories; i++) {
        let className = 'progress-dot';
        if (i === state.currentIndex) {
            className += ' active';
        } else if (i < state.currentIndex) {
            className += ' viewed';
        }
        dotsHTML += `<div class="${className}"></div>`;
    }
    elements.progressDots.innerHTML = dotsHTML;
}

function showCompletion() {
    elements.cardContainer.innerHTML = '';
    elements.completionScreen.classList.add('visible');
    elements.progressFill.style.width = '100%';
    if (elements.historyToggle) elements.historyToggle.classList.add('hidden');

    // Update completion title and subtitle based on mode
    const subtitle = elements.completionScreen.querySelector('.completion-subtitle');

    if (state.userName && elements.completionTitle) {
        if (state.faqMode) {
            // FAQ completion - welcoming and action-oriented
            elements.completionTitle.textContent = `Ready to jump in, ${state.userName}?`;
            if (subtitle) {
                subtitle.textContent = "We will make it worth your time.";
            }
        } else if (state.archiveMode) {
            // Archive completion
            elements.completionTitle.textContent = `All caught up, ${state.userName}`;
            if (subtitle) {
                subtitle.textContent = "You've reviewed the archives.";
            }
        } else {
            // Regular stories completion
            elements.completionTitle.textContent = `Take a break, ${state.userName}`;
            if (subtitle) {
                subtitle.textContent = "That's your daily dose of critical thinking.";
            }
        }
    }

    // Track completion - count curious swipes from the state
    const curiousCount = state.viewedStories.length;
    trackCompletionViewed(state.totalStories, curiousCount);

    // Update button labels based on mode
    updateCompletionButtons();
}

function updateCompletionButtons() {
    const reviewBtn = elements.reviewStoriesBtn;
    const questionsBtn = elements.yourQuestionsBtn;
    const archiveBtn = elements.recapWeekBtn;

    if (state.faqMode) {
        // FAQ completion buttons: "Review FAQs", "Go to stories", "Go to archives"
        if (reviewBtn) {
            reviewBtn.querySelector('span').textContent = 'Review FAQs';
        }
        if (questionsBtn) {
            questionsBtn.querySelector('span').textContent = 'Go to stories';
            // Change functionality for FAQ mode
            questionsBtn.dataset.faqAction = 'go-to-stories';
        }
        if (archiveBtn) {
            archiveBtn.querySelector('span').textContent = 'Go to archives';
        }
    } else if (state.archiveMode) {
        // Archives completion buttons: "Review stories", "Your questions", "Back to today"
        if (reviewBtn) {
            reviewBtn.querySelector('span').textContent = 'Review stories';
        }
        if (questionsBtn) {
            questionsBtn.querySelector('span').textContent = 'Your questions';
            questionsBtn.dataset.faqAction = '';
        }
        if (archiveBtn) {
            archiveBtn.querySelector('span').textContent = 'Back to today';
        }
    } else {
        // Stories completion buttons: "Review stories", "Your questions", "Go to archives"
        if (reviewBtn) {
            reviewBtn.querySelector('span').textContent = 'Review stories';
        }
        if (questionsBtn) {
            questionsBtn.querySelector('span').textContent = 'Your questions';
            questionsBtn.dataset.faqAction = '';
        }
        if (archiveBtn) {
            archiveBtn.querySelector('span').textContent = 'Go to archives';
        }
    }
}

function resetApp() {
    state.currentIndex = 0;
    state.viewedStories = [];
    saveToStorage();
    elements.completionScreen.classList.remove('visible');
    if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');
    updateProgress();
    renderProgressDots();
    renderCards();
    showSwipeHint();
    updatePrevButtonVisibility();
    triggerHaptic('light');
}

// ==========================================
// Modal Handling
// ==========================================

function openModal(story) {
    state.currentStory = story;
    state.rating = 0;

    // Track story viewed
    const storyIndex = state.stories.findIndex(s => s.id === story.id);
    trackStoryViewed(storyIndex + 1, story.headline);

    elements.modalEmoji.textContent = story.emoji || '✦';
    elements.modalHeadline.innerHTML = parseFormattedText(story.headline);

    elements.questionsContainer.innerHTML = '';

    // For FAQs, only show first 3 questions (Question 4 is "Skip this FAQ")
    const questionsToShow = story.isFAQ ? story.questions.slice(0, 3) : story.questions;

    questionsToShow.forEach((q, index) => {
        const button = document.createElement('button');
        button.className = 'question-button';
        button.innerHTML = `
            <span class="qa-question-number">${index + 1}</span>
            <span class="question-text">${parseFormattedText(q.text)}</span>
        `;
        button.addEventListener('click', () => {
            triggerHaptic('light');
            showAnswer(q, index);
        });
        elements.questionsContainer.appendChild(button);
    });

    // Add skip button - text differs for FAQs vs stories
    const skipButton = document.createElement('button');
    skipButton.className = 'question-button skip';
    const skipText = story.isFAQ ? 'Skip this FAQ' : 'Skip this story';
    skipButton.innerHTML = `
        <span class="question-label">✦</span>
        <span class="question-text">${skipText}</span>
    `;
    skipButton.addEventListener('click', () => {
        triggerHaptic('light');
        trackQuestionsSkipped(story.headline);
        closeModal();
        // Animate current card out and move to next
        setTimeout(() => {
            const card = document.querySelector('.story-card[data-position="0"]');
            if (card) {
                animateCardExit(card, 'left', () => nextCard());
            } else {
                nextCard();
            }
        }, 300);
    });
    elements.questionsContainer.appendChild(skipButton);

    elements.qaView.classList.remove('hidden', 'fade-out');
    elements.answerView.classList.add('hidden');

    elements.modalBackdrop.classList.add('visible');
    document.body.classList.add('no-scroll');

    // Setup modal swipe to dismiss
    setupModalSwipe();
}

function setupModalSwipe() {
    let startY = 0;
    let currentY = 0;

    const modal = elements.qaModal;

    // CRITICAL: Remove old listeners first to prevent duplicates
    if (modal._touchStartHandler) {
        modal.removeEventListener('touchstart', modal._touchStartHandler);
        modal.removeEventListener('touchmove', modal._touchMoveHandler);
        modal.removeEventListener('touchend', modal._touchEndHandler);
    }

    const handleTouchStart = (e) => {
        startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (deltaY > 0 && modal.scrollTop === 0) {
            e.preventDefault();
            // Q&A card positioned absolutely, apply translateY offset
            modal.style.transform = `translateY(${deltaY}px)`;
        }
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;

        if (deltaY > 100) {
            // Swipe down threshold met - return to Summary (Q&A becomes peeking)
            triggerHaptic('light');
            closeModal();
        } else {
            // Reset position to active state
            modal.style.transform = 'translateY(0)';
        }

        startY = 0;
        currentY = 0;
    };

    // Store handlers for removal later
    modal._touchStartHandler = handleTouchStart;
    modal._touchMoveHandler = handleTouchMove;
    modal._touchEndHandler = handleTouchEnd;

    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchmove', handleTouchMove, { passive: false });
    modal.addEventListener('touchend', handleTouchEnd);
}

/**
 * Setup swipe-to-dismiss for Q&A card (inside story card)
 * Swipe down from Q&A returns to Summary (Q&A becomes peeking)
 */
function setupQACardSwipe() {
    // Find Q&A card inside current story card
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const qaCard = currentCard.querySelector('.qa-card');
    if (!qaCard) return;

    let startY = 0;
    let currentY = 0;

    // Remove old listeners first to prevent duplicates
    if (qaCard._touchStartHandler) {
        qaCard.removeEventListener('touchstart', qaCard._touchStartHandler);
        qaCard.removeEventListener('touchmove', qaCard._touchMoveHandler);
        qaCard.removeEventListener('touchend', qaCard._touchEndHandler);
    }

    const handleTouchStart = (e) => {
        startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Only prevent default when swiping down at top of scroll — NO card movement
        if (deltaY > 0 && qaCard.scrollTop === 0) {
            e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;

        if (deltaY > 100 && qaCard.scrollTop === 0) {
            // Swipe down threshold met - return to Summary
            triggerHaptic('light');
            closeQACard();
        }
        // No snap-back needed — card never moved

        startY = 0;
        currentY = 0;
    };

    // Store handlers for removal later
    qaCard._touchStartHandler = handleTouchStart;
    qaCard._touchMoveHandler = handleTouchMove;
    qaCard._touchEndHandler = handleTouchEnd;

    qaCard.addEventListener('touchstart', handleTouchStart, { passive: true });
    qaCard.addEventListener('touchmove', handleTouchMove, { passive: false });
    qaCard.addEventListener('touchend', handleTouchEnd);
}

/**
 * Close Q&A card - return from ACTIVE to HIDDEN state
 * Called when swiping down from Q&A
 */
function closeQACard() {
    // Transition Q&A from ACTIVE back to HIDDEN
    setQACardState(QA_STATES.HIDDEN);

    // Update layer state - return to SUMMARY
    state.cardLayer = 'summary';

    // Reset Q&A card inline transform
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (currentCard) {
        const qaCard = currentCard.querySelector('.qa-card');
        if (qaCard) {
            qaCard.style.transform = '';
        }
    }

    updateUI();
}

// ==========================================
// ANSWER CARD STATE MANAGEMENT
// ==========================================

/**
 * Show Answer Card - slide up from bottom
 * @param {number} questionIndex - Index of the selected question (0-3)
 */
function showAnswerCard(questionIndex) {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) { return; }

    const answerCard = currentCard.querySelector('.answer-card');
    if (!answerCard) return;

    // Store the question index
    state.currentQuestionIndex = questionIndex;

    // Track progress and path
    state.currentPath.l3QuestionIndex = questionIndex;
    state.currentPath.l5QuestionIndex = null; // Reset L5 when choosing new L3
    const storyId = state.currentStory?.id;
    if (storyId) {
        if (!storyProgress[storyId]) storyProgress[storyId] = { visitedSummary: false, clickedL3: false, clickedL5: false };
        storyProgress[storyId].clickedL3 = true;
    }

    // Populate the answer card with content
    populateAnswerCard(questionIndex);

    // Show the card
    answerCard.classList.add('active');

    // Update state
    state.cardLayer = 'answer';

    // Setup swipe handler for this card
    setupAnswerCardSwipe();

    updateUI(currentCard);

}

/**
 * Hide Answer Card - slide down, return to Q&A
 */
function hideAnswerCard() {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const answerCard = currentCard.querySelector('.answer-card');
    if (answerCard) {
        answerCard.classList.remove('active');
        answerCard.style.transform = '';
    }

    // Update state - return to Q&A
    state.cardLayer = 'questions';
    state.currentQuestionIndex = null;

    // Reset path tracking
    state.currentPath = { l3QuestionIndex: null, l5QuestionIndex: null };

    updateUI();

}

/**
 * Populate Answer Card with question and answer content
 * @param {number} questionIndex - Index of the question
 */
function populateAnswerCard(questionIndex) {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard || !state.currentStory) return;

    const answerCard = currentCard.querySelector('.answer-card');
    if (!answerCard) return;

    const question = state.currentStory.questions[questionIndex];
    if (!question) return;

    // Store for later use (dig deeper, history, etc.)
    state.currentQuestion = question;
    state.currentQuestionIndex = questionIndex;

    // Populate content
    const questionText = answerCard.querySelector('.answer-question-text');
    const answerText = answerCard.querySelector('.answer-text');
    const digDeeperHint = answerCard.querySelector('.answer-dig-deeper-hint');

    if (questionText) questionText.innerHTML = parseFormattedText(question.text);
    if (answerText) answerText.innerHTML = parseFormattedText(question.answer);

    // Show/hide Dig Deeper hint in bottom bar based on availability
    const hasDeepQuestions = question.deepQuestions && question.deepQuestions.length > 0;
    if (digDeeperHint) {
        digDeeperHint.style.visibility = hasDeepQuestions ? 'visible' : 'hidden';
    }

    // Reset rating stars
    resetAnswerCardStars(answerCard);

    // Add to history
    addToHistory(state.currentStory, question);

    // Track analytics
    trackQuestionClicked(state.currentStory.headline, question.text);
}

/**
 * Reset rating stars in answer card
 */
function resetAnswerCardStars(answerCard) {
    const stars = answerCard.querySelectorAll('.rating-star');
    stars.forEach(star => star.classList.remove('active'));
}

// ==========================================
// DIG DEEPER Q&A CARD STATE MANAGEMENT
// ==========================================

/**
 * Show Dig Deeper Q&A Card - slide up from bottom
 */
function showDigDeeperQACard() {

    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) {
        console.error('[showDigDeeperQACard] ERROR: No current card found');
        return;
    }

    const digDeeperQACard = currentCard.querySelector('.dig-deeper-qa-card');
    if (!digDeeperQACard) {
        console.error('[showDigDeeperQACard] ERROR: No dig-deeper-qa-card found');
        return;
    }

    // Populate with dig deeper questions
    populateDigDeeperQACard();

    // Show the card
    digDeeperQACard.classList.add('active');

    // Update state
    state.cardLayer = 'dig-deeper-qa';

    // Setup swipe handler
    setupDigDeeperQACardSwipe();

    updateUI(currentCard);

}

/**
 * Hide Dig Deeper Q&A Card - slide down, return to Answer
 */
function hideDigDeeperQACard() {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const digDeeperQACard = currentCard.querySelector('.dig-deeper-qa-card');
    if (digDeeperQACard) {
        digDeeperQACard.classList.remove('active');
        digDeeperQACard.style.transform = '';
    }

    // Update state - return to Answer
    state.cardLayer = 'answer';

    updateUI();

}

/**
 * Populate Dig Deeper Q&A Card with follow-up questions
 */
function populateDigDeeperQACard() {

    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard || !state.currentQuestion) {
        console.error('[populateDigDeeperQACard] ERROR: No current card or question', { card: !!currentCard, question: !!state.currentQuestion });
        return;
    }

    const digDeeperQACard = currentCard.querySelector('.dig-deeper-qa-card');
    const questionsList = digDeeperQACard?.querySelector('.dig-deeper-questions-list');
    if (!questionsList) {
        console.error('[populateDigDeeperQACard] ERROR: No questions list found');
        return;
    }

    // Clear existing questions
    questionsList.innerHTML = '';

    const deepQuestions = state.currentQuestion.deepQuestions || [];

    // Create button for each dig deeper question
    const parentIndex = state.currentQuestionIndex;
    deepQuestions.forEach((q, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C
        const childColor = (L5_QUESTION_COLORS[parentIndex] && L5_QUESTION_COLORS[parentIndex][index])
            ? L5_QUESTION_COLORS[parentIndex][index]
            : 'var(--accent)';
        const childTextColor = (L5_QUESTION_COLORS[parentIndex] && L5_QUESTION_COLORS[parentIndex][index])
            ? getContrastTextColor(L5_QUESTION_COLORS[parentIndex][index])
            : '#FFFFFF';
        const button = document.createElement('button');
        button.className = 'qa-question-btn';
        button.innerHTML = `
            <span class="deep-question-number" style="background-color: ${childColor}; color: ${childTextColor}">${letter}</span>
            <span class="qa-question-text">${parseFormattedText(q.text)}</span>
        `;
        button.addEventListener('click', () => {
            triggerHaptic('light');
            showDigDeeperAnswerCard(index);
        });
        questionsList.appendChild(button);
    });
}

// ==========================================
// DIG DEEPER ANSWER CARD STATE MANAGEMENT
// ==========================================

/**
 * Show Dig Deeper Answer Card - slide up from bottom
 * @param {number} questionIndex - Index of the dig deeper question (0-2)
 */
function showDigDeeperAnswerCard(questionIndex) {

    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) { console.error('[showDigDeeperAnswerCard] ERROR: No current card'); return; }

    const digDeeperAnswerCard = currentCard.querySelector('.dig-deeper-answer-card');
    if (!digDeeperAnswerCard) { console.error('[showDigDeeperAnswerCard] ERROR: No dig-deeper-answer-card'); return; }

    // Store the question index
    state.currentDigDeeperQuestionIndex = questionIndex;

    // Track progress and path
    state.currentPath.l5QuestionIndex = questionIndex;
    const storyId = state.currentStory?.id;
    if (storyId) {
        if (!storyProgress[storyId]) storyProgress[storyId] = { visitedSummary: false, clickedL3: false, clickedL5: false };
        storyProgress[storyId].clickedL5 = true;
    }

    // Populate the card with content
    populateDigDeeperAnswerCard(questionIndex);

    // Show the card
    digDeeperAnswerCard.classList.add('active');

    // Update state
    state.cardLayer = 'dig-deeper-answer';

    // Setup swipe handler
    setupDigDeeperAnswerCardSwipe();

    updateUI(currentCard);

}

/**
 * Hide Dig Deeper Answer Card - slide down, return to Dig Deeper Q&A
 */
function hideDigDeeperAnswerCard() {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const digDeeperAnswerCard = currentCard.querySelector('.dig-deeper-answer-card');
    if (digDeeperAnswerCard) {
        digDeeperAnswerCard.classList.remove('active');
        digDeeperAnswerCard.style.transform = '';
    }

    // Update state - return to Dig Deeper Q&A
    state.cardLayer = 'dig-deeper-qa';
    state.currentDigDeeperQuestionIndex = null;

    // Reset L5 path tracking
    state.currentPath.l5QuestionIndex = null;

    updateUI();

}

/**
 * Populate Dig Deeper Answer Card with content
 * @param {number} questionIndex - Index of the dig deeper question
 */
function populateDigDeeperAnswerCard(questionIndex) {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard || !state.currentQuestion) return;

    const digDeeperAnswerCard = currentCard.querySelector('.dig-deeper-answer-card');
    if (!digDeeperAnswerCard) return;

    const deepQuestions = state.currentQuestion.deepQuestions || [];
    const question = deepQuestions[questionIndex];
    if (!question) return;

    // Populate content
    const questionText = digDeeperAnswerCard.querySelector('.answer-question-text');
    const answerText = digDeeperAnswerCard.querySelector('.answer-text');

    if (questionText) questionText.innerHTML = parseFormattedText(question.text);
    if (answerText) answerText.innerHTML = parseFormattedText(question.answer);

    // Reset rating stars
    resetAnswerCardStars(digDeeperAnswerCard);

    // Track analytics
    trackQuestionClicked(state.currentStory.headline, question.text);
}

// ==========================================
// SWIPE HANDLERS FOR NEW CARDS
// ==========================================

/**
 * Setup swipe-to-dismiss for Answer Card
 * Swipe down returns to Q&A card
 * NUCLEAR FIX: Respects scrollable .answer-body — only intercepts
 * swipe-to-dismiss when NOT scrolling content.
 */
function setupAnswerCardSwipe() {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const answerCard = currentCard.querySelector('.answer-card');
    if (!answerCard) return;

    let startY = 0;
    let currentY = 0;
    let gestureDecided = false;  // Has the gesture type been determined?
    let isScrolling = false;     // true = native scroll, false = swipe-to-dismiss
    let isDismissing = false;    // true = actively dragging card down to dismiss

    // Remove old listeners
    if (answerCard._touchStartHandler) {
        answerCard.removeEventListener('touchstart', answerCard._touchStartHandler);
        answerCard.removeEventListener('touchmove', answerCard._touchMoveHandler);
        answerCard.removeEventListener('touchend', answerCard._touchEndHandler);
    }

    const handleTouchStart = (e) => {
        startY = e.touches[0].clientY;
        currentY = startY;
        gestureDecided = false;
        isScrolling = false;
        isDismissing = false;
    };

    const handleTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (!gestureDecided && Math.abs(deltaY) > 8) {
            gestureDecided = true;

            // Check if touch is inside a scrollable body with overflowing content
            const scrollBody = e.target.closest('.answer-body');
            const hasOverflow = scrollBody && (scrollBody.scrollHeight > scrollBody.clientHeight + 2);

            if (hasOverflow) {
                const atTop = scrollBody.scrollTop <= 0;
                const atBottom = scrollBody.scrollTop >= (scrollBody.scrollHeight - scrollBody.clientHeight - 2);

                if (deltaY > 0 && atTop) {
                    // Pulling down at scroll top → swipe-to-dismiss
                    isDismissing = true;
                    isScrolling = false;
                } else if (deltaY < 0 && atBottom) {
                    // Pulling up at scroll bottom → let it be (no action)
                    isScrolling = true;
                } else {
                    // Normal scroll within content
                    isScrolling = true;
                }
            } else {
                // No scrollable content — treat all downward drags as dismiss
                isDismissing = deltaY > 0;
                isScrolling = false;
            }
        }

        if (isScrolling) {
            // Let native scroll handle it — don't preventDefault
            return;
        }

        if (isDismissing && deltaY > 0) {
            e.preventDefault();
            // NO card transform — card stays in place during swipe
        }
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;

        if (isDismissing && deltaY > 100) {
            triggerHaptic('light');
            hideAnswerCard();
        }
        // No snap-back needed — card never moved

        startY = 0;
        currentY = 0;
        gestureDecided = false;
        isScrolling = false;
        isDismissing = false;
    };

    answerCard._touchStartHandler = handleTouchStart;
    answerCard._touchMoveHandler = handleTouchMove;
    answerCard._touchEndHandler = handleTouchEnd;

    answerCard.addEventListener('touchstart', handleTouchStart, { passive: true });
    answerCard.addEventListener('touchmove', handleTouchMove, { passive: false });
    answerCard.addEventListener('touchend', handleTouchEnd);
}

/**
 * Setup swipe-to-dismiss for Dig Deeper Q&A Card
 * Swipe down returns to Answer card
 * NUCLEAR FIX: Same scroll-aware pattern as answer card
 */
function setupDigDeeperQACardSwipe() {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const digDeeperQACard = currentCard.querySelector('.dig-deeper-qa-card');
    if (!digDeeperQACard) return;

    let startY = 0;
    let currentY = 0;
    let gestureDecided = false;
    let isScrolling = false;
    let isDismissing = false;

    // Remove old listeners
    if (digDeeperQACard._touchStartHandler) {
        digDeeperQACard.removeEventListener('touchstart', digDeeperQACard._touchStartHandler);
        digDeeperQACard.removeEventListener('touchmove', digDeeperQACard._touchMoveHandler);
        digDeeperQACard.removeEventListener('touchend', digDeeperQACard._touchEndHandler);
    }

    const handleTouchStart = (e) => {
        startY = e.touches[0].clientY;
        currentY = startY;
        gestureDecided = false;
        isScrolling = false;
        isDismissing = false;
    };

    const handleTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (!gestureDecided && Math.abs(deltaY) > 8) {
            gestureDecided = true;
            const scrollBody = e.target.closest('.dig-deeper-questions-list');
            const hasOverflow = scrollBody && (scrollBody.scrollHeight > scrollBody.clientHeight + 2);

            if (hasOverflow) {
                const atTop = scrollBody.scrollTop <= 0;
                if (deltaY > 0 && atTop) {
                    isDismissing = true;
                } else {
                    isScrolling = true;
                }
            } else {
                isDismissing = deltaY > 0;
            }
        }

        if (isScrolling) return;

        if (isDismissing && deltaY > 0) {
            e.preventDefault();
            // NO card transform — card stays in place during swipe
        }
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;

        if (isDismissing && deltaY > 100) {
            triggerHaptic('light');
            hideDigDeeperQACard();
        }
        // No snap-back needed — card never moved

        startY = 0;
        currentY = 0;
        gestureDecided = false;
        isScrolling = false;
        isDismissing = false;
    };

    digDeeperQACard._touchStartHandler = handleTouchStart;
    digDeeperQACard._touchMoveHandler = handleTouchMove;
    digDeeperQACard._touchEndHandler = handleTouchEnd;

    digDeeperQACard.addEventListener('touchstart', handleTouchStart, { passive: true });
    digDeeperQACard.addEventListener('touchmove', handleTouchMove, { passive: false });
    digDeeperQACard.addEventListener('touchend', handleTouchEnd);
}

/**
 * Setup swipe-to-dismiss for Dig Deeper Answer Card
 * Swipe down returns to Dig Deeper Q&A card
 * NUCLEAR FIX: Same scroll-aware pattern as answer card
 */
function setupDigDeeperAnswerCardSwipe() {
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (!currentCard) return;

    const digDeeperAnswerCard = currentCard.querySelector('.dig-deeper-answer-card');
    if (!digDeeperAnswerCard) return;

    let startY = 0;
    let currentY = 0;
    let gestureDecided = false;
    let isScrolling = false;
    let isDismissing = false;

    // Remove old listeners
    if (digDeeperAnswerCard._touchStartHandler) {
        digDeeperAnswerCard.removeEventListener('touchstart', digDeeperAnswerCard._touchStartHandler);
        digDeeperAnswerCard.removeEventListener('touchmove', digDeeperAnswerCard._touchMoveHandler);
        digDeeperAnswerCard.removeEventListener('touchend', digDeeperAnswerCard._touchEndHandler);
    }

    const handleTouchStart = (e) => {
        startY = e.touches[0].clientY;
        currentY = startY;
        gestureDecided = false;
        isScrolling = false;
        isDismissing = false;
    };

    const handleTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (!gestureDecided && Math.abs(deltaY) > 8) {
            gestureDecided = true;
            const scrollBody = e.target.closest('.answer-body');
            const hasOverflow = scrollBody && (scrollBody.scrollHeight > scrollBody.clientHeight + 2);

            if (hasOverflow) {
                const atTop = scrollBody.scrollTop <= 0;
                const atBottom = scrollBody.scrollTop >= (scrollBody.scrollHeight - scrollBody.clientHeight - 2);

                if (deltaY > 0 && atTop) {
                    isDismissing = true;
                } else if (deltaY < 0 && atBottom) {
                    isScrolling = true;
                } else {
                    isScrolling = true;
                }
            } else {
                isDismissing = deltaY > 0;
            }
        }

        if (isScrolling) return;

        if (isDismissing && deltaY > 0) {
            e.preventDefault();
            // NO card transform — card stays in place during swipe
        }
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;

        if (isDismissing && deltaY > 100) {
            triggerHaptic('light');
            hideDigDeeperAnswerCard();
        }
        // No snap-back needed — card never moved

        startY = 0;
        currentY = 0;
        gestureDecided = false;
        isScrolling = false;
        isDismissing = false;
    };

    digDeeperAnswerCard._touchStartHandler = handleTouchStart;
    digDeeperAnswerCard._touchMoveHandler = handleTouchMove;
    digDeeperAnswerCard._touchEndHandler = handleTouchEnd;

    digDeeperAnswerCard.addEventListener('touchstart', handleTouchStart, { passive: true });
    digDeeperAnswerCard.addEventListener('touchmove', handleTouchMove, { passive: false });
    digDeeperAnswerCard.addEventListener('touchend', handleTouchEnd);
}

// ==========================================
// LEGACY ANSWER SYSTEM (keeping for backwards compatibility)
// ==========================================

function showAnswer(question, questionIndex) {
    addToHistory(state.currentStory, question);

    // Store current question for Dig Deeper feature
    state.currentQuestion = question;

    // Track question clicked
    trackQuestionClicked(state.currentStory.headline, question.text);
    logSupabaseEvent('question_clicked', {
        story_headline: state.currentStory.headline,
        question_text: question.text
    });


    // Prepare answer view content in LEGACY modal
    elements.answerLabel.textContent = (questionIndex !== undefined) ? (questionIndex + 1) : '✦';
    elements.answerQuestion.innerHTML = parseFormattedText(question.text);
    elements.answerText.innerHTML = parseFormattedText(question.answer);

    // Show/hide Dig Deeper button based on availability
    const hasDeepQuestions = question.deepQuestions && question.deepQuestions.length > 0;
    if (elements.digDeeperBtn) {
        elements.digDeeperBtn.style.display = hasDeepQuestions ? 'flex' : 'none';
    }

    resetStars();

    // Hide NEW Q&A card (it was active)
    setQACardState(QA_STATES.HIDDEN);

    // Show LEGACY modal with Answer view
    elements.qaView.classList.add('hidden');
    elements.answerView.classList.remove('hidden');
    elements.modalBackdrop.classList.add('visible');
    document.body.classList.add('no-scroll');

    // Update state
    state.cardLayer = 'answer';

    // Setup swipe on legacy modal
    setupModalSwipe();
}

function showQAView() {

    // Find which view is currently visible
    const currentView = [elements.answerView, elements.digDeeperView, elements.deepAnswerView]
        .find(v => v && !v.classList.contains('hidden'));

    if (currentView) {
        // SLIDE TRANSITION: Current view slides out right, Q&A slides in from left
        elements.qaView.style.transform = 'translateX(-100%)';
        elements.qaView.classList.remove('hidden');

        // Force reflow
        void elements.qaView.offsetHeight;

        elements.qaView.style.transform = '';
        currentView.classList.add('slide-out-left');

        setTimeout(() => {
            currentView.classList.add('hidden');
            currentView.classList.remove('slide-out-left');
            // Reset inline styles
            currentView.style.cssText = '';
        }, 350);
    } else {
        // Just show Q&A view directly
        elements.qaView.classList.remove('hidden');
    }

    // Verify modal backdrop is still correctly visible
    if (!elements.modalBackdrop.classList.contains('visible')) {
        elements.modalBackdrop.classList.add('visible');
    }

}

function verifyModalState() {
    // Check Q&A view is visible
    const qaViewStyle = getComputedStyle(elements.qaView);
    const qaViewVisible = qaViewStyle.display !== 'none' && qaViewStyle.visibility !== 'hidden';

    // Check other views are hidden
    const answerHidden = elements.answerView.classList.contains('hidden');
    const digDeeperHidden = elements.digDeeperView ? elements.digDeeperView.classList.contains('hidden') : true;
    const deepAnswerHidden = elements.deepAnswerView ? elements.deepAnswerView.classList.contains('hidden') : true;


    // Check for any stray overlay elements
    const overlays = document.querySelectorAll('[class*="overlay"], [class*="backdrop"]');
    overlays.forEach(el => {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
        }
    });
}

function closeModal() {
    // Close LEGACY modal and return to NEW Q&A card (ACTIVE state)
    // This is called when dismissing Answer/Dig Deeper views

    // Hide legacy modal
    elements.modalBackdrop.classList.remove('visible');
    document.body.classList.remove('no-scroll');

    // Show NEW Q&A card in ACTIVE state (return to questions)
    setQACardState(QA_STATES.ACTIVE);

    // Update layer state - return to Q&A questions
    state.cardLayer = 'questions';
    if (state.modalStack.length > 0) {
        state.modalStack.pop();
    }

    // Reset modal views after animation completes
    setTimeout(() => {
        elements.qaView.classList.remove('hidden', 'fade-out', 'fade-in', 'slide-out-left');
        elements.answerView.classList.add('hidden');
        elements.answerView.classList.remove('fade-out', 'fade-in', 'slide-out-left');
        elements.digDeeperView.classList.add('hidden');
        elements.digDeeperView.classList.remove('fade-out', 'fade-in', 'slide-out-left');
        elements.deepAnswerView.classList.add('hidden');
        elements.deepAnswerView.classList.remove('fade-out', 'fade-in', 'slide-out-left');

        state.currentQuestion = null;
        state.currentHistoryEntry = null;
    }, 300);

    // Setup swipe on new Q&A card
    setupQACardSwipe();
}

// ==========================================
// Summary Modal
// ==========================================

function openSummaryModal(story) {
    state.currentStory = story;

    // Track story viewed
    const storyIndex = state.stories.findIndex(s => s.id === story.id);
    trackStoryViewed(storyIndex + 1, story.headline);

    elements.summaryModalHeadline.innerHTML = parseFormattedText(story.headline);

    // Parse summary with bullets and HTML formatting
    const summaryText = story.summary || story.teaser;
    elements.summaryModalBullets.innerHTML = parseSummaryWithBullets(summaryText);

    elements.summaryModalBackdrop.classList.add('visible');
    document.body.classList.add('no-scroll');

    // Setup swipe to dismiss
    setupSummaryModalSwipe();
}

function closeSummaryModal() {
    elements.summaryModalBackdrop.classList.remove('visible');
    document.body.classList.remove('no-scroll');
    elements.summaryModal.style.transform = '';
}

function setupSummaryModalSwipe() {
    let startY = 0;
    let currentY = 0;

    const modal = elements.summaryModal;

    const handleTouchStart = (e) => {
        startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (deltaY > 0 && modal.scrollTop === 0) {
            e.preventDefault();
            modal.style.transform = `translateY(${deltaY}px)`;
        }
    };

    const handleTouchEnd = () => {
        const deltaY = currentY - startY;

        if (deltaY > 100) {
            closeSummaryModal();
        } else {
            modal.style.transform = '';
        }

        startY = 0;
        currentY = 0;
    };

    // Remove old listeners first to avoid duplicates
    modal.removeEventListener('touchstart', modal._touchStartHandler);
    modal.removeEventListener('touchmove', modal._touchMoveHandler);
    modal.removeEventListener('touchend', modal._touchEndHandler);

    // Store handlers for removal later
    modal._touchStartHandler = handleTouchStart;
    modal._touchMoveHandler = handleTouchMove;
    modal._touchEndHandler = handleTouchEnd;

    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchmove', handleTouchMove, { passive: false });
    modal.addEventListener('touchend', handleTouchEnd);
}

// ==========================================
// Dig Deeper Feature
// ==========================================

function showDigDeeper() {

    const question = state.currentQuestion;
    if (!question || !question.deepQuestions || question.deepQuestions.length === 0) {
        showToast('ℹ', 'No follow-up questions available');
        showQAView();
        return;
    }

    // Reset all views first
    resetAllModalViews();

    // Populate deep questions
    elements.deepQuestionsContainer.innerHTML = '';
    question.deepQuestions.forEach((dq, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C
        const button = document.createElement('button');
        button.className = 'deep-question-button';
        button.innerHTML = `
            <span class="deep-question-number">${letter}</span>
            <span class="deep-question-text">${parseFormattedText(dq.text)}</span>
        `;
        button.addEventListener('click', () => {
            triggerHaptic('light');
            trackDigDeeper(state.currentStory.headline, dq.text);
            showDeepAnswer(dq, index);
        });
        elements.deepQuestionsContainer.appendChild(button);
    });

    // Add "Back to main questions" option
    const backButton = document.createElement('button');
    backButton.className = 'deep-question-button';
    backButton.style.background = 'transparent';
    backButton.style.border = '1px solid var(--border-color)';
    backButton.innerHTML = `
        <span class="deep-question-label">←</span>
        <span class="deep-question-text">Back to main questions</span>
    `;
    backButton.addEventListener('click', () => {
        triggerHaptic('light');
        hideDigDeeper();
    });
    elements.deepQuestionsContainer.appendChild(backButton);

    // Show dig deeper view
    elements.digDeeperView.classList.remove('hidden');
    elements.digDeeperView.style.display = 'block';
    elements.digDeeperView.style.visibility = 'visible';
    elements.digDeeperView.style.opacity = '1';

    // Force reflow
    void elements.digDeeperView.offsetHeight;
}

function hideDigDeeper() {
    showQAView();
}

function showDeepAnswer(deepQuestion, questionIndex) {

    // Reset all views first
    resetAllModalViews();

    // Update answer label with letter (A, B, C)
    const deepAnswerLabel = elements.deepAnswerView?.querySelector('.answer-label');
    if (deepAnswerLabel && questionIndex !== undefined) {
        deepAnswerLabel.textContent = String.fromCharCode(65 + questionIndex);
    }

    // Prepare deep answer content
    elements.deepAnswerQuestion.innerHTML = parseFormattedText(deepQuestion.text);
    elements.deepAnswerText.innerHTML = parseFormattedText(deepQuestion.answer);

    // Show deep answer view
    elements.deepAnswerView.classList.remove('hidden');
    elements.deepAnswerView.style.display = 'block';
    elements.deepAnswerView.style.visibility = 'visible';
    elements.deepAnswerView.style.opacity = '1';

    // Force reflow
    void elements.deepAnswerView.offsetHeight;
}

function backToDeepQuestions() {

    // Immediately reset all views
    resetAllModalViews();

    // Show only dig deeper view
    elements.digDeeperView.classList.remove('hidden');
    elements.digDeeperView.style.display = 'block';
    elements.digDeeperView.style.visibility = 'visible';
    elements.digDeeperView.style.opacity = '1';

    // Force reflow
    void elements.digDeeperView.offsetHeight;
}

function hideDigDeeperToAnswer() {

    // Immediately reset all views
    resetAllModalViews();

    // Show only answer view
    elements.answerView.classList.remove('hidden');
    elements.answerView.style.display = 'block';
    elements.answerView.style.visibility = 'visible';
    elements.answerView.style.opacity = '1';

    // Force reflow
    void elements.answerView.offsetHeight;
}

function deepDone() {

    // Use the comprehensive showQAView function
    showQAView();
}

// Helper function to reset all modal views to hidden state
function resetAllModalViews() {
    const allViews = [elements.qaView, elements.answerView, elements.digDeeperView, elements.deepAnswerView].filter(v => v);

    allViews.forEach(v => {
        v.classList.add('hidden');
        v.classList.remove('fade-out', 'fade-in', 'slide-out-left');
        v.style.cssText = '';
    });

    // Force reflow
    void document.body.offsetHeight;
}

/**
 * Verify clean navigation state - call after every major transition
 * Ensures no invisible overlays or broken states
 */
function verifyCleanState() {
    // Check that Q&A modal is either fully visible or fully hidden
    const modalVisible = elements.modalBackdrop.classList.contains('visible');

    if (!modalVisible) {
        // Modal should be completely hidden
        const modalRect = elements.qaModal.getBoundingClientRect();
        if (modalRect.top < window.innerHeight && modalRect.bottom > 0) {
            console.warn('[verifyCleanState] Q&A card visible when modal backdrop hidden - forcing cleanup');
            elements.qaModal.style.transform = 'translateX(-50%) translateY(100%)';
        }
    }

    // Verify no stray backdrop overlays
    const backdrops = document.querySelectorAll('.modal-backdrop, .summary-modal-backdrop, .info-modal-backdrop');
    backdrops.forEach(backdrop => {
        if (!backdrop.classList.contains('visible')) {
            // Ensure truly hidden
            backdrop.style.pointerEvents = 'none';
        }
    });

    // Log current state for debugging
}

/**
 * Reset ALL card states - called on EVERY story navigation
 * CRITICAL: This prevents cards persisting across stories
 */
function resetAllCardStates() {

    const storyCard = document.querySelector('.story-card[data-card-type="current"]');

    // 1. Reset Q&A card to HIDDEN state
    setQACardState(QA_STATES.HIDDEN);

    // 2. Reset ALL card transforms and states inside current story card
    if (storyCard) {
        // Reset Q&A card
        const qaCard = storyCard.querySelector('.qa-card');
        if (qaCard) {
            qaCard.style.transform = '';
        }

        // Reset Answer card
        const answerCard = storyCard.querySelector('.answer-card');
        if (answerCard) {
            answerCard.classList.remove('active');
            answerCard.style.transform = '';
        }

        // Reset Dig Deeper Q&A card
        const digDeeperQACard = storyCard.querySelector('.dig-deeper-qa-card');
        if (digDeeperQACard) {
            digDeeperQACard.classList.remove('active');
            digDeeperQACard.style.transform = '';
        }

        // Reset Dig Deeper Answer card
        const digDeeperAnswerCard = storyCard.querySelector('.dig-deeper-answer-card');
        if (digDeeperAnswerCard) {
            digDeeperAnswerCard.classList.remove('active');
            digDeeperAnswerCard.style.transform = '';
        }
    }

    // 3. Hide LEGACY modal
    if (elements.modalBackdrop) {
        elements.modalBackdrop.classList.remove('visible', 'peeking', 'push-transition');
    }

    // 4. Reset flip card to front (headline)
    const currentCard = document.querySelector('.story-card[data-card-type="current"]');
    if (currentCard) {
        currentCard.classList.remove('flipped');
        currentCard.dataset.flipped = 'false';
    }

    // 5. Reset modal views
    resetAllModalViews();

    // 6. Reset card layer state
    state.cardLayer = 'headline';
    state.isCardFlipped = false;

    // 7. Reset question indices
    state.currentQuestionIndex = null;
    state.currentDigDeeperQuestionIndex = null;

    // 8. Reset navigation path
    state.currentPath = { l3QuestionIndex: null, l5QuestionIndex: null };

    // 9. Remove no-scroll from body
    document.body.classList.remove('no-scroll');

    // 10. Reset UI to default state
    updateUI();
}

/**
 * Full state reset - returns to Story 1 headline from any state
 * Used by logo click and other "go home" actions
 */
function fullStateReset() {

    // Reset all card states
    resetAllCardStates();

    // Reset story to first
    state.currentIndex = 0;
    state.currentStory = null;
    state.currentQuestion = null;

    // Re-render cards
    renderCards();
    updateProgress();
    renderProgressDots();

    // Verify clean state
    setTimeout(verifyCleanState, 450);
}

// ==========================================
// History
// ==========================================

function addToHistory(story, question) {
    const entry = {
        id: Date.now(),
        storyId: story.id,
        emoji: story.emoji,
        headline: story.headline,
        question: question.text,
        answer: question.answer,
        label: question.label,
        rating: 0,
        timestamp: Date.now()
    };

    state.history.unshift(entry);

    if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
    }

    saveToStorage();
    renderHistory();
}

function updateHistoryRating(entryId, rating) {
    const entry = state.history.find(h => h.id === entryId);
    if (entry) {
        entry.rating = rating;
        saveToStorage();
        renderHistory();
    }
}

function renderHistory() {
    if (state.history.length === 0) {
        elements.historyList.innerHTML = '';
        elements.historyEmpty.classList.add('visible');
        return;
    }

    elements.historyEmpty.classList.remove('visible');
    elements.historyList.innerHTML = state.history.map(entry => `
        <div class="history-item" data-id="${entry.id}">
            <span class="history-emoji">${entry.emoji}</span>
            <div class="history-content">
                <h4 class="history-headline">${entry.headline}</h4>
                <p class="history-question">${entry.label}: ${entry.question}</p>
            </div>
            <div class="history-meta">
                ${entry.rating > 0 ? `<span class="history-rating">${'★'.repeat(entry.rating)}</span>` : ''}
                <span class="history-time">${formatTimeAgo(entry.timestamp)}</span>
            </div>
        </div>
    `).join('');

    elements.historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const entry = state.history.find(h => h.id === id);
            if (entry) {
                triggerHaptic('light');
                showHistoryAnswer(entry);
            }
        });
    });
}

function showHistoryAnswer(entry) {
    const story = {
        id: entry.storyId,
        emoji: entry.emoji,
        headline: entry.headline,
        teaser: '',
        questions: [{
            label: entry.label,
            text: entry.question,
            answer: entry.answer
        }]
    };

    state.currentStory = story;
    state.currentHistoryEntry = entry;

    elements.modalEmoji.textContent = story.emoji;
    elements.modalHeadline.innerHTML = parseFormattedText(story.headline);

    elements.qaView.classList.add('hidden');
    elements.answerView.classList.remove('hidden');

    elements.answerLabel.textContent = entry.label || '✦';
    elements.answerQuestion.innerHTML = parseFormattedText(entry.question);
    // Apply HTML formatting to history answer
    elements.answerText.innerHTML = parseFormattedText(entry.answer);

    // Hide Dig Deeper button for history items (no deep questions stored)
    if (elements.digDeeperBtn) {
        elements.digDeeperBtn.style.display = 'none';
    }

    setRating(entry.rating, true);

    elements.modalBackdrop.classList.add('visible');
    document.body.classList.add('no-scroll');
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==========================================
// Navigation
// ==========================================

function switchSection(sectionName) {
    state.currentSection = sectionName;
    triggerHaptic('light');

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    if (sectionName === 'today') {
        elements.sectionToday.classList.add('active');
        if (elements.historyToggle) elements.historyToggle.classList.remove('hidden');
        // Reset navigation state when returning to today
        state.cameFromCompletion = false;
        updatePrevButtonVisibility();
    } else {
        elements.sectionHistory.classList.add('active');
        if (elements.historyToggle) elements.historyToggle.classList.add('hidden');
        // Show prev button if came from completion
        updatePrevButtonForCompletionNav();
    }
}

// ==========================================
// Star Rating
// ==========================================

function setupStarRating() {
    const stars = elements.starRating.querySelectorAll('.star');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setRating(rating);
            triggerHaptic('light');

            if (state.currentHistoryEntry) {
                updateHistoryRating(state.currentHistoryEntry.id, rating);
            }
        });

        // Cumulative hover for legacy star rating
        star.addEventListener('mouseenter', () => {
            const hoverValue = parseInt(star.dataset.rating);
            stars.forEach(s => {
                const v = parseInt(s.dataset.rating);
                if (v <= hoverValue) {
                    s.classList.add('hovered');
                } else {
                    s.classList.remove('hovered');
                }
            });
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hovered'));
        });
    });
}

function setRating(rating, skipAnimation = false) {
    state.rating = rating;
    const stars = elements.starRating.querySelectorAll('.star');

    // Track rating if not skipping animation (i.e., user clicked)
    if (!skipAnimation && state.currentStory) {
        trackRatingGiven(state.currentStory.headline, rating);
        logSupabaseEvent('answer_rated', {
            story_headline: state.currentStory.headline,
            question_path: state.currentQuestion ? state.currentQuestion.text : '',
            rating: rating
        });
    }

    stars.forEach((star, index) => {
        const starRating = index + 1;

        if (starRating <= rating) {
            if (skipAnimation) {
                star.classList.add('active');
                star.classList.remove('filling');
            } else if (!star.classList.contains('active')) {
                star.classList.add('filling');
                setTimeout(() => {
                    star.classList.remove('filling');
                    star.classList.add('active');
                }, 200);
            }
        } else {
            star.classList.remove('active', 'filling');
        }
    });
}

function resetStars() {
    state.rating = 0;
    state.currentHistoryEntry = null;
    const stars = elements.starRating.querySelectorAll('.star');
    stars.forEach(star => star.classList.remove('active', 'filling'));
}

// ==========================================
// Word Lookup Tooltip
// ==========================================

function createLookupTooltip() {
    // Create tooltip if it doesn't exist
    if (document.getElementById('lookupTooltip')) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'lookup-tooltip';
    tooltip.id = 'lookupTooltip';
    tooltip.innerHTML = `
        <div class="lookup-tooltip-header">FYI explains</div>
        <div class="lookup-tooltip-content" id="lookupTooltipContent"></div>
    `;
    document.body.appendChild(tooltip);
}

function showLookupTooltip(element, event) {
    event.stopPropagation(); // Prevent card flip

    createLookupTooltip();

    const tooltip = document.getElementById('lookupTooltip');
    const content = document.getElementById('lookupTooltipContent');
    const definition = element.dataset.definition;

    if (!definition) return;

    content.textContent = definition;

    // Position tooltip near the word
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 280;

    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    let top = rect.bottom + 8;
    // If not enough space below, show above
    if (top + 150 > window.innerHeight) {
        top = rect.top - 120;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.classList.add('visible');

    triggerHaptic('light');

    // Close on click outside (after a small delay)
    setTimeout(() => {
        document.addEventListener('click', closeLookupTooltip, { once: true });
        document.addEventListener('touchstart', closeLookupTooltip, { once: true });
    }, 10);
}

function closeLookupTooltip() {
    const tooltip = document.getElementById('lookupTooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

// ==========================================
// Pull to Refresh
// ==========================================

// Pull-to-refresh requires deliberate action:
// - Must pull down 150px+ (much more than swipe navigation 50-80px)
// - Must hold for 300ms after reaching threshold
// This prevents accidental refresh during normal swipe-down navigation

const PULL_REFRESH_THRESHOLD = 150;  // px - must pull this far
const PULL_REFRESH_HOLD_TIME = 300;  // ms - must hold after threshold

function setupPullToRefresh() {
    let pullStartY = 0;
    let isPulling = false;
    let pullHoldTimer = null;
    let refreshReady = false;

    elements.sectionToday.addEventListener('touchstart', (e) => {
        // Only enable pull-to-refresh when at top of content
        if (elements.sectionToday.scrollTop === 0) {
            pullStartY = e.touches[0].clientY;
            isPulling = true;
            refreshReady = false;
            clearTimeout(pullHoldTimer);
            pullHoldTimer = null;
        }
    }, { passive: true });

    elements.sectionToday.addEventListener('touchmove', (e) => {
        if (!isPulling) return;

        const pullDistance = e.touches[0].clientY - pullStartY;

        // Only show indicator when past the high threshold
        if (pullDistance > PULL_REFRESH_THRESHOLD) {
            elements.pullIndicator.classList.add('visible');

            if (refreshReady) {
                elements.pullIndicator.querySelector('.pull-text').textContent = 'Release to refresh';
            } else {
                elements.pullIndicator.querySelector('.pull-text').textContent = 'Keep pulling...';

                // Start hold timer if not already started
                if (!pullHoldTimer) {
                    pullHoldTimer = setTimeout(() => {
                        refreshReady = true;
                        // Haptic feedback when refresh is ready
                        triggerHaptic('medium');
                        elements.pullIndicator.querySelector('.pull-text').textContent = 'Release to refresh';
                    }, PULL_REFRESH_HOLD_TIME);
                }
            }
        } else {
            // Below threshold - hide indicator and reset timer
            elements.pullIndicator.classList.remove('visible');
            clearTimeout(pullHoldTimer);
            pullHoldTimer = null;
            refreshReady = false;
        }
    }, { passive: true });

    elements.sectionToday.addEventListener('touchend', (e) => {
        if (!isPulling) return;

        const pullDistance = e.changedTouches[0].clientY - pullStartY;

        // Only trigger refresh if threshold was met AND hold time completed
        if (pullDistance > PULL_REFRESH_THRESHOLD && refreshReady) {
            triggerHaptic('heavy');
            elements.pullIndicator.classList.add('refreshing');
            elements.pullIndicator.querySelector('.pull-text').textContent = 'Refreshing...';
            refreshStories();
        } else {
            // Not a refresh - just hide indicator
            elements.pullIndicator.classList.remove('visible');
        }

        // Reset state
        isPulling = false;
        refreshReady = false;
        clearTimeout(pullHoldTimer);
        pullHoldTimer = null;
    });
}

async function refreshStories() {
    await fetchStories();
    renderCards();
    updateProgress();
    renderProgressDots();

    elements.pullIndicator.classList.remove('visible', 'refreshing');
}

// ==========================================
// Haptic Feedback
// ==========================================

function triggerHaptic(intensity = 'light') {
    if ('vibrate' in navigator) {
        switch (intensity) {
            case 'light': navigator.vibrate(10); break;
            case 'medium': navigator.vibrate(20); break;
            case 'heavy': navigator.vibrate([30, 10, 30]); break;
        }
    }
}

// ==========================================
// Toast
// ==========================================

function showToast(icon, message) {
    elements.toastIcon.textContent = icon;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('visible');

    setTimeout(() => {
        elements.toast.classList.remove('visible');
    }, 2500);
}

// ==========================================
// Swipe Hint
// ==========================================

function showSwipeHint() {
    if (state.hasShownHint || state.stories.length === 0) return;

    setTimeout(() => {
        elements.swipeHint.classList.add('visible');
        state.hasShownHint = true;
        saveToStorage();

        setTimeout(hideSwipeHint, 3000);
    }, 1000);
}

function hideSwipeHint() {
    elements.swipeHint.classList.remove('visible');
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {
    // Helper to safely add event listeners with null check
    const safeAddListener = (element, event, handler) => {
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn('[setupEventListeners] Missing element for', event, 'listener');
        }
    };

    // Theme toggle
    safeAddListener(elements.themeToggle, 'click', toggleTheme);

    // Hamburger menu toggle
    safeAddListener(elements.hamburgerBtn, 'click', (e) => {
        e.stopPropagation();
        triggerHaptic('light');
        if (elements.dropdownMenu) elements.dropdownMenu.classList.toggle('visible');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (elements.dropdownMenu && elements.hamburgerBtn) {
            if (!elements.dropdownMenu.contains(e.target) && e.target !== elements.hamburgerBtn) {
                elements.dropdownMenu.classList.remove('visible');
            }
        }
    });

    // What is FYI modal
    safeAddListener(elements.whatIsFYIBtn, 'click', () => {
        triggerHaptic('light');
        if (elements.dropdownMenu) elements.dropdownMenu.classList.remove('visible');
        if (elements.whatIsFYIModal) elements.whatIsFYIModal.classList.add('visible');
        document.body.classList.add('no-scroll');
        trackModalOpened('What is FYI');
    });

    safeAddListener(elements.whatIsFYIClose, 'click', () => {
        triggerHaptic('light');
        if (elements.whatIsFYIModal) elements.whatIsFYIModal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    });

    safeAddListener(elements.whatIsFYIModal, 'click', (e) => {
        if (e.target === elements.whatIsFYIModal) {
            triggerHaptic('light');
            elements.whatIsFYIModal.classList.remove('visible');
            document.body.classList.remove('no-scroll');
        }
    });

    // Bookmarks menu button
    safeAddListener(elements.bookmarksBtn, 'click', () => {
        triggerHaptic('light');
        if (elements.dropdownMenu) elements.dropdownMenu.classList.remove('visible');
        openBookmarksPage();
    });

    // Bookmarks page back button
    safeAddListener(elements.bookmarksBackBtn, 'click', () => {
        triggerHaptic('light');
        closeBookmarksPage();
    });

    // Bookmarks filter change handlers
    safeAddListener(elements.filterDate, 'change', applyBookmarkFilters);
    safeAddListener(elements.filterCategory, 'change', applyBookmarkFilters);

    // FAQs menu button - force refresh to get latest FAQ content
    safeAddListener(elements.faqsBtn, 'click', async () => {
        triggerHaptic('light');
        if (elements.dropdownMenu) elements.dropdownMenu.classList.remove('visible');
        trackEvent('FAQs Menu Clicked');
        // Force refresh when explicitly accessing FAQs from menu
        await enterFAQMode(false, true);
    });

    // Our Philosophy modal
    safeAddListener(elements.ourPhilosophyBtn, 'click', () => {
        triggerHaptic('light');
        if (elements.dropdownMenu) elements.dropdownMenu.classList.remove('visible');
        if (elements.ourPhilosophyModal) elements.ourPhilosophyModal.classList.add('visible');
        document.body.classList.add('no-scroll');
        trackModalOpened('Our Philosophy');
    });

    safeAddListener(elements.ourPhilosophyClose, 'click', () => {
        triggerHaptic('light');
        if (elements.ourPhilosophyModal) elements.ourPhilosophyModal.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    });

    safeAddListener(elements.ourPhilosophyModal, 'click', (e) => {
        if (e.target === elements.ourPhilosophyModal) {
            triggerHaptic('light');
            elements.ourPhilosophyModal.classList.remove('visible');
            document.body.classList.remove('no-scroll');
        }
    });

    // Logo click - ALWAYS returns to today's Story 1, from ANY state
    safeAddListener(elements.headerLogo, 'click', async () => {
        triggerHaptic('light');

        // Always transition to stories mode with fresh state
        await transitionToMode('stories');
        showToast('✓', "Back to today's stories");
    });

    // Empty state refresh
    safeAddListener(elements.emptyRefreshBtn, 'click', () => {
        triggerHaptic('light');
        refreshStories();
    });

    // Modal controls
    safeAddListener(elements.modalClose, 'click', () => {
        triggerHaptic('light');
        closeModal();
    });

    safeAddListener(elements.modalBackdrop, 'click', (e) => {
        if (e.target === elements.modalBackdrop) {
            triggerHaptic('light');
            closeModal();
        }
    });

    // Q&A card click handler is now set up dynamically in setupQACardClickHandler()
    // Called by setupCardInteractions() when card is created

    // LEGACY: Keep old qaModal click handler for Answer/Dig Deeper views
    if (elements.qaModal) {
        elements.qaModal.addEventListener('click', (e) => {
            // Clicking inside the modal shouldn't close it
            e.stopPropagation();
        });
    }

    // Done button - returns to question set (Q&A view), NOT to card deck
    safeAddListener(elements.doneBtn, 'click', () => {
        triggerHaptic('light');
        showQAView();
    });

    // Dig Deeper button
    if (elements.digDeeperBtn) {
        elements.digDeeperBtn.addEventListener('click', () => {
            triggerHaptic('light');
            showDigDeeper();
        });
    }

    // Deep done button
    if (elements.deepDoneBtn) {
        elements.deepDoneBtn.addEventListener('click', () => {
            triggerHaptic('light');
            deepDone();
        });
    }

    // Modal Prev buttons
    if (elements.answerViewPrev) {
        elements.answerViewPrev.addEventListener('click', () => {
            triggerHaptic('light');
            showQAView();
        });
    }

    if (elements.digDeeperViewPrev) {
        elements.digDeeperViewPrev.addEventListener('click', () => {
            triggerHaptic('light');
            hideDigDeeperToAnswer();
        });
    }

    if (elements.deepAnswerViewPrev) {
        elements.deepAnswerViewPrev.addEventListener('click', () => {
            triggerHaptic('light');
            backToDeepQuestions();
        });
    }

    // Summary Modal close button
    if (elements.summaryModalClose) {
        elements.summaryModalClose.addEventListener('click', () => {
            triggerHaptic('light');
            closeSummaryModal();
        });
    }

    // Summary Modal backdrop click
    if (elements.summaryModalBackdrop) {
        elements.summaryModalBackdrop.addEventListener('click', (e) => {
            if (e.target === elements.summaryModalBackdrop) {
                triggerHaptic('light');
                closeSummaryModal();
            }
        });
    }

    // Review stories button
    safeAddListener(elements.reviewStoriesBtn, 'click', () => {
        triggerHaptic('light');
        resetApp();
    });

    // Your Questions button (on completion screen) - behavior changes in FAQ mode
    if (elements.yourQuestionsBtn) {
        elements.yourQuestionsBtn.addEventListener('click', async () => {
            triggerHaptic('light');

            // In FAQ mode, this button becomes "Go to stories"
            if (elements.yourQuestionsBtn.dataset.faqAction === 'go-to-stories') {
                // Use state machine to properly transition to stories
                await transitionToMode('stories');
                return;
            }

            // Default behavior: show question history
            state.cameFromCompletion = true; // Track that we came from completion
            switchSection('history');
        });
    }

    // Prev Story button - handles card navigation with mode-aware behavior
    if (elements.prevStoryBtn) {
        elements.prevStoryBtn.addEventListener('click', async () => {
            triggerHaptic('light');

            // If we're in history section (came from completion's "Your Questions")
            if (state.currentSection === 'history' && state.cameFromCompletion) {
                // Return to completion screen
                state.cameFromCompletion = false;
                switchSection('today');
                elements.completionScreen.classList.add('visible');
                return;
            }

            // If we're in recap view (came from completion's "Go to archives")
            if (state.inRecapView && state.cameFromCompletion) {
                hideRecapView();
                return;
            }

            // If in FAQ mode on first card, exit to stories
            if (state.faqMode && state.currentIndex === 0) {
                await transitionToMode('stories');
                return;
            }

            // If in archive mode on first card from no-stories page
            if (state.archiveMode && state.currentIndex === 0 && state.enteredArchivesFromNoStories) {
                await transitionToMode('stories'); // Will show no-stories if still empty
                return;
            }

            // If in archive mode on first card, return to stories completion
            if (state.archiveMode && state.currentIndex === 0) {
                // Go back to stories and show completion
                cleanupCurrentState();
                state.archiveMode = false;
                state.appMode = 'stories';
                state.stories = state.originalStories || [];
                state.totalStories = state.stories.length;
                state.currentIndex = state.totalStories; // At end = completion
                state.originalStories = [];

                // Show completion
                elements.completionScreen.classList.add('visible');
                elements.progressFill.style.width = '100%';
                updateCompletionButtons();
                updateDateDisplay();
                updatePrevButtonVisibility();
                return;
            }

            // Default: go to previous card
            prevCard();
        });
    }

    // Recap This Week / Back to Today / Go to Archives button - behavior depends on mode
    if (elements.recapWeekBtn) {
        elements.recapWeekBtn.addEventListener('click', async () => {
            triggerHaptic('light');

            if (state.faqMode) {
                // In FAQ mode: "Go to archives" - use state machine
                trackRecapViewed('faq_completion');
                await transitionToMode('archives', { source: 'faq_completion' });
            } else if (state.archiveMode) {
                // In archive mode: go back to today's stories
                await transitionToMode('stories');
            } else {
                // In today mode: go to archives
                trackRecapViewed('completion_button');
                await transitionToMode('archives', {
                    source: 'completion_button',
                    originalStories: [...state.stories]
                });
            }
        });
    }

    // Star rating
    setupStarRating();

    // Story Navigation Buttons (below card) - Prev
    if (elements.storyPrevBtn) {
        elements.storyPrevBtn.addEventListener('click', () => {
            triggerHaptic('light');
            if (state.currentIndex > 0) {
                prevCard();
            }
        });
    }

    // Story Navigation Buttons (below card) - Next
    if (elements.storyNextBtn) {
        elements.storyNextBtn.addEventListener('click', () => {
            triggerHaptic('light');
            if (state.currentIndex < state.totalStories - 1) {
                nextCard();
            }
        });
    }

    // History toggle (legacy floating button, may be removed)
    if (elements.historyToggle) {
        elements.historyToggle.addEventListener('click', () => {
            switchSection('history');
        });
    }

    // History back button - REMOVED from HTML, functionality moved to global Prev button

    // Welcome Choice - New User button
    if (elements.welcomeNewUserBtn) {
        elements.welcomeNewUserBtn.addEventListener('click', () => {
            triggerHaptic('medium');
            state.showFAQsAfterName = true; // Flag to show FAQs after name entry
            hideWelcomeChoice();
            showWelcomeModal();
        });
    }

    // Welcome Choice - Returning User button
    if (elements.welcomeReturningBtn) {
        elements.welcomeReturningBtn.addEventListener('click', () => {
            triggerHaptic('medium');
            state.showFAQsAfterName = false; // Skip FAQs, go to stories
            hideWelcomeChoice();
            showWelcomeModal();
        });
    }

    // Welcome Back button - returns to welcome choice
    if (elements.welcomeBackBtn) {
        elements.welcomeBackBtn.addEventListener('click', () => {
            triggerHaptic('light');
            hideWelcomeModal();
            showWelcomeChoice();
        });
    }

    // Welcome modal submit
    if (elements.welcomeSubmitBtn) {
        elements.welcomeSubmitBtn.addEventListener('click', () => {
            const name = elements.welcomeNameInput.value.trim();
            if (name) {
                triggerHaptic('medium');
                saveUserName(name);
            }
        });
    }

    // Welcome modal input - submit on Enter key
    if (elements.welcomeNameInput) {
        elements.welcomeNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const name = elements.welcomeNameInput.value.trim();
                if (name) {
                    triggerHaptic('medium');
                    saveUserName(name);
                }
            }
        });
    }

    // No Stories - Go to Archives button
    if (elements.emptyArchivesBtn) {
        elements.emptyArchivesBtn.addEventListener('click', async () => {
            triggerHaptic('light');
            trackRecapViewed('no_stories_page');
            await enterArchiveModeFromNoStories();
        });
    }

    // Resize handler to adjust logo font size
    window.addEventListener('resize', () => {
        if (state.userName) {
            adjustLogoFontSize();
        }
    });

    // Pull to refresh
    setupPullToRefresh();

    // Keyboard shortcuts - NEW NAVIGATION SYSTEM
    document.addEventListener('keydown', (e) => {
        // Escape closes modals (returns to previous layer)
        if (e.key === 'Escape') {
            handleKeyboardBack();
            return;
        }

        // Check legacy modal states
        const qaModalOpen = elements.modalBackdrop && elements.modalBackdrop.classList.contains('visible');
        const summaryModalOpen = elements.summaryModalBackdrop && elements.summaryModalBackdrop.classList.contains('visible');

        // When in legacy Q&A modal - only down arrow works (to go back)
        if (qaModalOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                closeModal();
            }
            return;
        }

        // When in summary modal - only down arrow works (to go back)
        if (summaryModalOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                closeSummaryModal();
            }
            return;
        }

        // Card navigation (when no modal is open)
        if (state.currentSection === 'today') {
            const card = document.querySelector('.story-card[data-card-type="current"]');
            const story = state.stories[state.currentIndex];

            // Handle ArrowDown based on current layer state
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleKeyboardDown(card, story);
                return;
            }

            // Handle ArrowUp based on current layer state
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (card && story) handleSwipeUp(card, story);
                return;
            }

            // Left/Right only work on headline/summary
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (card && story) handleSwipeLeft(card, story);
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (card && story) handleSwipeRight(card, story);
            }
        }
    });
}

/**
 * Handle ArrowDown key navigation for all card layers
 */
function handleKeyboardDown(card, story) {
    // Handle based on current card layer
    switch (state.cardLayer) {
        case 'dig-deeper-answer':
            // From Dig Deeper Answer -> return to Dig Deeper Q&A
            hideDigDeeperAnswerCard();
            break;

        case 'dig-deeper-qa':
            // From Dig Deeper Q&A -> return to Answer
            hideDigDeeperQACard();
            break;

        case 'answer':
            // From Answer -> return to Q&A
            hideAnswerCard();
            break;

        case 'questions':
            // From Q&A -> return to Summary
            closeQACard();
            break;

        case 'summary':
            // From Summary -> flip back to Headline
            if (card && story) {
                flipCard(card, story);
                state.isCardFlipped = false;
                state.cardLayer = 'headline';
                setQACardState(QA_STATES.HIDDEN);
                updateUI();
            }
            break;

        case 'headline':
        default:
            // Already at headline, do nothing
            break;
    }
}

/**
 * Handle keyboard back navigation (Escape key)
 * Returns to previous layer based on current state
 */
function handleKeyboardBack() {
    // Check legacy modals first
    if (elements.summaryModalBackdrop && elements.summaryModalBackdrop.classList.contains('visible')) {
        closeSummaryModal();
        return;
    }
    if (elements.modalBackdrop && elements.modalBackdrop.classList.contains('visible')) {
        closeModal();
        return;
    }

    // Handle new card system layers
    const card = document.querySelector('.story-card[data-card-type="current"]');
    const story = state.stories[state.currentIndex];

    switch (state.cardLayer) {
        case 'dig-deeper-answer':
            hideDigDeeperAnswerCard();
            break;

        case 'dig-deeper-qa':
            hideDigDeeperQACard();
            break;

        case 'answer':
            hideAnswerCard();
            break;

        case 'questions':
            closeQACard();
            break;

        case 'summary':
            // From Summary -> flip back to Headline
            if (card && story) {
                flipCard(card, story);
                state.isCardFlipped = false;
                state.cardLayer = 'headline';
                setQACardState(QA_STATES.HIDDEN);
                updateUI();
            }
            break;

        default:
            // At headline or unknown state, do nothing
            break;
    }
}

// ==========================================
// Start App
// ==========================================

document.addEventListener('DOMContentLoaded', init);

