/**
 * El Catecismo Bautista - Search Functionality
 */

(function () {
    'use strict';

    let fuse = null;
    let searchIndex = null;

    // Google Analytics helper
    function trackEvent(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
    }

    // Load search index
    async function loadSearchIndex() {
        try {
            const response = await fetch('/data/search-index.json');
            searchIndex = await response.json();
            initFuse();
        } catch (error) {
            console.error('Error loading search index:', error);
            showStatus('Error al cargar el indice de busqueda.');
        }
    }

    // Initialize Fuse.js
    function initFuse() {
        if (typeof Fuse === 'undefined') {
            showStatus('Error: Fuse.js no esta disponible.');
            return;
        }

        const options = {
            keys: [
                { name: 'question', weight: 0.4 },
                { name: 'answer', weight: 0.3 },
                { name: 'verse', weight: 0.2 },
                { name: 'reference', weight: 0.1 },
            ],
            threshold: 0.4,
            ignoreLocation: true,
            includeMatches: true,
            minMatchCharLength: 2,
        };

        fuse = new Fuse(searchIndex, options);
        showStatus('Listo para buscar.');
    }

    // Perform search
    function performSearch(query) {
        if (!fuse) {
            showStatus('Cargando...');
            return;
        }

        query = query.trim();

        if (query.length < 2) {
            clearResults();
            showStatus('Escribe al menos 2 caracteres.');
            return;
        }

        const results = fuse.search(query, { limit: 50 });

        if (results.length === 0) {
            clearResults();
            showStatus('No se encontraron resultados para "' + escapeHtml(query) + '".');
            return;
        }

        showStatus(results.length + ' resultado(s) encontrado(s).');
        displayResults(results, query);

        // Track search
        trackEvent('search', {
            search_term: query,
            results_count: results.length,
        });
    }

    // Display search results
    function displayResults(results, query) {
        const container = document.getElementById('search-results');
        if (!container) return;

        container.innerHTML = results
            .map(function (result, index) {
                const item = result.item;
                const typeLabel =
                    item.type === 'question' ? 'Pregunta principal' : 'Exposicion de Beddome';

                return (
                    '<div class="search-result">' +
                    '<a href="' +
                    item.url +
                    '" data-result-index="' +
                    index +
                    '" data-question="' +
                    item.number +
                    '">' +
                    '<div class="search-result-header">' +
                    '<span class="result-number">Pregunta ' +
                    item.number +
                    '</span>' +
                    '<span class="result-type">' +
                    typeLabel +
                    '</span>' +
                    '</div>' +
                    '<div class="result-question">' +
                    highlightMatches(item.question, query) +
                    '</div>' +
                    '<div class="result-answer">' +
                    highlightMatches(item.answer, query) +
                    '</div>' +
                    (item.verse
                        ? '<div class="result-verse"><em>' +
                          highlightMatches(item.verse, query) +
                          '</em> - ' +
                          item.reference +
                          '</div>'
                        : '') +
                    '</a>' +
                    '</div>'
                );
            })
            .join('');

        // Track result clicks
        container.querySelectorAll('a[data-result-index]').forEach(function (link) {
            link.addEventListener('click', function () {
                trackEvent('search_result_click', {
                    search_term: query,
                    result_position: parseInt(this.dataset.resultIndex) + 1,
                    question_number: parseInt(this.dataset.question),
                });
            });
        });
    }

    // Highlight matching text
    function highlightMatches(text, query) {
        if (!text || !query) return escapeHtml(text || '');

        const escaped = escapeHtml(text);
        const queryTerms = query
            .toLowerCase()
            .split(/\s+/)
            .filter(function (t) {
                return t.length >= 2;
            });

        let result = escaped;
        queryTerms.forEach(function (term) {
            const regex = new RegExp('(' + escapeRegex(term) + ')', 'gi');
            result = result.replace(regex, '<span class="result-highlight">$1</span>');
        });

        return result;
    }

    // Clear results
    function clearResults() {
        const container = document.getElementById('search-results');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Show status message
    function showStatus(message) {
        const status = document.getElementById('search-status');
        if (status) {
            status.textContent = message;
        }
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Escape regex special characters
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    // Initialize search
    function initSearch() {
        const input = document.getElementById('search-input');
        const clearBtn = document.getElementById('clear-search');

        if (!input) return;

        // Load index
        loadSearchIndex();

        // Search on input
        const debouncedSearch = debounce(function () {
            performSearch(input.value);
        }, 200);

        input.addEventListener('input', debouncedSearch);

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                input.value = '';
                clearResults();
                showStatus('');
                input.focus();
            });
        }

        // Focus input on page load
        input.focus();

        // Handle URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const queryParam = urlParams.get('q');
        if (queryParam) {
            input.value = queryParam;
            performSearch(queryParam);
        }
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', initSearch);
})();
