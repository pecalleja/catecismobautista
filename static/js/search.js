/**
 * El Catecismo Bautista - Search Page Functionality
 * Uses UnifiedSearch for exact accent-insensitive matching
 */

(function () {
    'use strict';

    var searchIndex = null;

    // Google Analytics helper
    function trackEvent(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
    }

    // Load search index
    function loadSearchIndex() {
        fetch('/data/search-index.json')
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                searchIndex = data;
                showStatus('Listo para buscar.');

                // Check for URL query parameter
                var urlParams = new URLSearchParams(window.location.search);
                var queryParam = urlParams.get('q');
                if (queryParam) {
                    var input = document.getElementById('search-input');
                    if (input) {
                        input.value = queryParam;
                        performSearch(queryParam);
                    }
                }
            })
            .catch(function (error) {
                console.error('Error loading search index:', error);
                showStatus('Error al cargar el indice de busqueda.');
            });
    }

    // Perform search
    function performSearch(query) {
        if (!searchIndex) {
            showStatus('Cargando...');
            return;
        }

        query = query.trim();

        if (query.length < 2) {
            clearResults();
            showStatus('Escribe al menos 2 caracteres.');
            return;
        }

        // Check if UnifiedSearch is available
        if (typeof UnifiedSearch === 'undefined') {
            showStatus('Error: modulo de busqueda no disponible.');
            return;
        }

        var results = UnifiedSearch.search(searchIndex, query, 50);

        if (results.length === 0) {
            clearResults();
            showStatus(
                'No se encontraron resultados para "' + UnifiedSearch.escapeHtml(query) + '".'
            );
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
        var container = document.getElementById('search-results');
        if (!container) return;

        var html = '';
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var item = result.item;
            var typeLabel =
                item.type === 'question' ? 'Pregunta principal' : 'Exposicion de Beddome';

            html += '<div class="search-result">';
            html +=
                '<a href="' +
                item.url +
                '" data-result-index="' +
                i +
                '" data-question="' +
                item.number +
                '">';
            html += '<div class="search-result-header">';
            html += '<span class="result-number">Pregunta ' + item.number + '</span>';
            html += '<span class="result-type">' + typeLabel + '</span>';
            html += '</div>';
            html +=
                '<div class="result-question">' +
                UnifiedSearch.highlightText(item.question, query) +
                '</div>';
            html +=
                '<div class="result-answer">' +
                UnifiedSearch.highlightText(item.answer, query) +
                '</div>';

            if (item.verse) {
                html +=
                    '<div class="result-verse"><em>' +
                    UnifiedSearch.highlightText(item.verse, query) +
                    '</em> - ';
                html += UnifiedSearch.highlightText(item.reference, query) + '</div>';
            }

            html += '</a>';
            html += '</div>';
        }

        container.innerHTML = html;

        // Track result clicks
        var links = container.querySelectorAll('a[data-result-index]');
        for (var j = 0; j < links.length; j++) {
            links[j].addEventListener('click', function () {
                trackEvent('search_result_click', {
                    search_term: query,
                    result_position: parseInt(this.dataset.resultIndex) + 1,
                    question_number: parseInt(this.dataset.question),
                });
            });
        }
    }

    // Clear results
    function clearResults() {
        var container = document.getElementById('search-results');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Show status message
    function showStatus(message) {
        var status = document.getElementById('search-status');
        if (status) {
            status.textContent = message;
        }
    }

    // Debounce function
    function debounce(func, wait) {
        var timeout;
        return function () {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    // Initialize search
    function initSearch() {
        var input = document.getElementById('search-input');
        var clearBtn = document.getElementById('clear-search');

        if (!input) return;

        // Load index
        loadSearchIndex();

        // Search on input
        var debouncedSearch = debounce(function () {
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
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', initSearch);
})();
