/**
 * Unified Search Module - Exact match with accent-insensitive comparison
 * Provides consistent search behavior across all pages
 */
(function () {
    'use strict';

    // Accent patterns for matching accented and non-accented versions
    var ACCENT_MAP = {
        a: '[aáàäâ]',
        e: '[eéèëê]',
        i: '[iíìïî]',
        o: '[oóòöô]',
        u: '[uúùüû]',
        n: '[nñ]',
        c: '[cç]',
    };

    /**
     * Normalize text for comparison (remove accents, lowercase)
     * @param {string} text - Text to normalize
     * @returns {string} Normalized text
     */
    function normalizeText(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Build a regex pattern that matches accented and non-accented versions
     * @param {string} query - Search query
     * @returns {RegExp} Regular expression for matching
     */
    function buildAccentInsensitivePattern(query) {
        var normalizedQuery = normalizeText(query);
        var pattern = '';
        for (var i = 0; i < normalizedQuery.length; i++) {
            var char = normalizedQuery[i];
            if (ACCENT_MAP[char]) {
                pattern += ACCENT_MAP[char];
            } else {
                // Escape regex special characters
                pattern += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }
        }
        return new RegExp(pattern, 'gi');
    }

    /**
     * Check if text contains query (accent-insensitive exact match)
     * @param {string} text - Text to search in
     * @param {string} query - Search query
     * @returns {boolean} True if text contains query
     */
    function textContains(text, query) {
        if (!text || !query) return false;
        var normalizedText = normalizeText(text);
        var normalizedQuery = normalizeText(query);
        return normalizedText.indexOf(normalizedQuery) !== -1;
    }

    /**
     * Escape HTML entities for safe display
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Highlight matches in text
     * @param {string} text - Original text
     * @param {string} query - Search query to highlight
     * @returns {string} HTML string with highlighted matches
     */
    function highlightText(text, query) {
        if (!text || !query) return escapeHtml(text || '');

        var escaped = escapeHtml(text);
        var pattern = buildAccentInsensitivePattern(query);

        return escaped.replace(pattern, '<mark class="search-highlight">$&</mark>');
    }

    /**
     * Search through index with exact accent-insensitive matching
     * @param {Array} index - Search index array
     * @param {string} query - Search query
     * @param {number} limit - Maximum results to return
     * @returns {Array} Array of matching results
     */
    function search(index, query, limit) {
        limit = limit || 50;

        if (!query || query.trim().length < 2) return [];

        var normalizedQuery = query.trim();
        var results = [];

        for (var i = 0; i < index.length; i++) {
            var item = index[i];

            // Search across all relevant fields
            var fieldsToSearch = [item.question, item.answer, item.verse, item.reference];

            var matchFound = false;
            var matchedFields = [];

            for (var j = 0; j < fieldsToSearch.length; j++) {
                var field = fieldsToSearch[j];
                if (textContains(field, normalizedQuery)) {
                    matchFound = true;
                    matchedFields.push(field);
                }
            }

            if (matchFound) {
                results.push({
                    item: item,
                    matchedFields: matchedFields,
                });
            }

            if (results.length >= limit) break;
        }

        return results;
    }

    // Export to global scope
    window.UnifiedSearch = {
        search: search,
        highlightText: highlightText,
        normalizeText: normalizeText,
        textContains: textContains,
        escapeHtml: escapeHtml,
    };
})();
