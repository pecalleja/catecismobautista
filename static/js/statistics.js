/**
 * Statistics Page - Charts and Visualizations
 */
(function () {
    'use strict';

    // Get theme colors from CSS variables
    function getThemeColors() {
        var style = getComputedStyle(document.documentElement);
        return {
            primary: style.getPropertyValue('--color-primary').trim() || '#2c5282',
            accent: style.getPropertyValue('--color-accent').trim() || '#805ad5',
            text: style.getPropertyValue('--color-text').trim() || '#1a1a1a',
            textMuted: style.getPropertyValue('--color-text-muted').trim() || '#666',
            border: style.getPropertyValue('--color-border').trim() || '#e2e8f0',
            bg: style.getPropertyValue('--color-bg').trim() || '#fefefe',
        };
    }

    // Store chart instances for theme switching
    var charts = {};

    // Initialize Top References Chart
    function initTopReferencesChart(data) {
        var ctx = document.getElementById('top-references-chart');
        if (!ctx || !data.top_references) return;

        var colors = getThemeColors();
        var labels = data.top_references.map(function (r) {
            return r.reference;
        });
        var counts = data.top_references.map(function (r) {
            return r.count;
        });

        if (charts.topReferences) {
            charts.topReferences.destroy();
        }

        charts.topReferences = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Citas',
                        data: counts,
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: colors.textMuted },
                    },
                    y: {
                        ticks: { color: colors.text },
                    },
                },
            },
        });
    }

    // Initialize Complexity Chart
    function initComplexityChart(data) {
        var ctx = document.getElementById('complexity-chart');
        if (!ctx || !data.questions_by_subquestion_count) return;

        var colors = getThemeColors();
        var top10 = data.questions_by_subquestion_count.slice(0, 10);
        var labels = top10.map(function (q) {
            return 'P' + q.number;
        });
        var counts = top10.map(function (q) {
            return q.subquestion_count;
        });

        if (charts.complexity) {
            charts.complexity.destroy();
        }

        charts.complexity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Subpreguntas',
                        data: counts,
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: colors.textMuted },
                    },
                    x: {
                        ticks: { color: colors.text },
                    },
                },
            },
        });
    }

    // Initialize Word Cloud
    function initWordCloud(data) {
        var container = document.getElementById('wordcloud');
        if (!container || !data.word_cloud_data || typeof WordCloud === 'undefined') return;

        var colors = getThemeColors();
        var colorPalette = [colors.primary, colors.accent, colors.text];

        // Clear previous content
        container.innerHTML = '';

        WordCloud(container, {
            list: data.word_cloud_data,
            gridSize: 8,
            weightFactor: function (size) {
                return Math.pow(size, 0.8) * 0.4;
            },
            fontFamily: 'Georgia, serif',
            color: function () {
                return colorPalette[Math.floor(Math.random() * colorPalette.length)];
            },
            rotateRatio: 0.3,
            rotationSteps: 2,
            backgroundColor: 'transparent',
            drawOutOfBound: false,
        });
    }

    // Generate color palette
    function generateColorPalette(count, baseColor) {
        var colors = [];
        for (var i = 0; i < count; i++) {
            var opacity = 1 - i * 0.07;
            colors.push(adjustColorOpacity(baseColor, opacity));
        }
        return colors;
    }

    function adjustColorOpacity(hex, opacity) {
        // Handle if hex doesn't start with #
        if (hex.charAt(0) !== '#') {
            return 'rgba(44, 82, 130, ' + opacity + ')';
        }
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
    }

    // Initialize Bible Coverage Charts
    function initBibleCharts(data) {
        var colors = getThemeColors();

        // Old Testament
        var otCtx = document.getElementById('ot-chart');
        if (otCtx && data.book_coverage.old_testament) {
            var otEntries = Object.entries(data.book_coverage.old_testament);
            otEntries.sort(function (a, b) {
                return b[1] - a[1];
            });
            var otData = otEntries.slice(0, 8);

            if (charts.ot) {
                charts.ot.destroy();
            }

            charts.ot = new Chart(otCtx, {
                type: 'doughnut',
                data: {
                    labels: otData.map(function (d) {
                        return d[0];
                    }),
                    datasets: [
                        {
                            data: otData.map(function (d) {
                                return d[1];
                            }),
                            backgroundColor: generateColorPalette(otData.length, colors.primary),
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: colors.text, font: { size: 11 } },
                        },
                    },
                },
            });
        }

        // New Testament
        var ntCtx = document.getElementById('nt-chart');
        if (ntCtx && data.book_coverage.new_testament) {
            var ntEntries = Object.entries(data.book_coverage.new_testament);
            ntEntries.sort(function (a, b) {
                return b[1] - a[1];
            });
            var ntData = ntEntries.slice(0, 8);

            if (charts.nt) {
                charts.nt.destroy();
            }

            charts.nt = new Chart(ntCtx, {
                type: 'doughnut',
                data: {
                    labels: ntData.map(function (d) {
                        return d[0];
                    }),
                    datasets: [
                        {
                            data: ntData.map(function (d) {
                                return d[1];
                            }),
                            backgroundColor: generateColorPalette(ntData.length, colors.accent),
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: colors.text, font: { size: 11 } },
                        },
                    },
                },
            });
        }
    }

    // Initialize all charts
    function init() {
        if (!window.STATS_DATA) {
            console.error('Statistics data not loaded');
            return;
        }

        var data = window.STATS_DATA;

        initTopReferencesChart(data);
        initComplexityChart(data);
        initWordCloud(data);
        initBibleCharts(data);
    }

    // Handle theme changes - reinitialize charts
    function observeThemeChanges() {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'data-theme') {
                    // Reinitialize charts with new colors after a small delay
                    setTimeout(init, 100);
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        init();
        observeThemeChanges();
    });
})();
