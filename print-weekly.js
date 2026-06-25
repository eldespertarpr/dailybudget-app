/* DailyBudget print weekly report v1
   Añade un resumen semanal imprimible por categoría sin tocar cálculos.
*/
(function () {
    var STORAGE_KEY = 'daily_budget_pro_v5';

    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function money(cents) {
        var value = (Number(cents || 0) / 100);
        return value.toLocaleString('es-PR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        });
    }

    function parseState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.expenses)) return null;
            return parsed;
        } catch (err) {
            console.error('DailyBudget: no se pudo leer el estado para imprimir', err);
            return null;
        }
    }

    function startOfLocalDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function getLastSevenDaysRange() {
        var end = startOfLocalDay(new Date());
        end.setHours(23, 59, 59, 999);

        var start = startOfLocalDay(new Date());
        start.setDate(start.getDate() - 6);

        return { start: start, end: end };
    }

    function formatDate(date) {
        return date.toLocaleDateString('es-PR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function formatDateTime(value) {
        if (!value) return '';
        try {
            return new Date(value).toLocaleDateString('es-PR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (err) {
            return '';
        }
    }

    function getWeeklyExpenses(state) {
        var range = getLastSevenDaysRange();
        return state.expenses
            .filter(function (expense) {
                if (!expense || !expense.timestamp) return false;
                var d = new Date(expense.timestamp);
                return d >= range.start && d <= range.end;
            })
            .sort(function (a, b) {
                return new Date(a.timestamp) - new Date(b.timestamp);
            });
    }

    function summarizeByCategory(expenses) {
        var totals = {};
        expenses.forEach(function (expense) {
            var category = expense.category || 'Otros';
            totals[category] = (totals[category] || 0) + Number(expense.amount || 0);
        });

        return Object.keys(totals)
            .map(function (category) {
                return { category: category, total: totals[category] };
            })
            .sort(function (a, b) {
                return b.total - a.total;
            });
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function buildRows(items) {
        return items.map(function (item) {
            return '<tr>' +
                '<td>' + escapeHtml(item.date || '') + '</td>' +
                '<td>' + escapeHtml(item.category || '') + '</td>' +
                '<td>' + escapeHtml(item.name || '') + '</td>' +
                '<td class="amount">' + money(item.amount) + '</td>' +
            '</tr>';
        }).join('');
    }

    function buildCategoryRows(items) {
        return items.map(function (item) {
            return '<tr>' +
                '<td>' + escapeHtml(item.category) + '</td>' +
                '<td class="amount">' + money(item.total) + '</td>' +
            '</tr>';
        }).join('');
    }

    function openPrintWindow(html) {
        var win = window.open('', '_blank');
        if (!win) {
            alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para DailyBudget e inténtalo de nuevo.');
            return;
        }

        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();

        setTimeout(function () {
            win.print();
        }, 350);
    }

    function printWeeklyReport() {
        var state = parseState();
        if (!state) {
            alert('No hay datos suficientes para imprimir.');
            return;
        }

        var range = getLastSevenDaysRange();
        var expenses = getWeeklyExpenses(state);
        var categories = summarizeByCategory(expenses);
        var total = expenses.reduce(function (acc, expense) {
            return acc + Number(expense.amount || 0);
        }, 0);
        var average = Math.round(total / 7);
        var topCategory = categories.length ? categories[0] : null;

        var detailRows = buildRows(expenses.map(function (expense) {
            return {
                date: formatDateTime(expense.timestamp) || ('Día ' + (expense.dayIndex || '')),
                category: expense.category || 'Otros',
                name: expense.name || 'Gasto',
                amount: expense.amount || 0
            };
        }));

        var categoryRows = buildCategoryRows(categories);
        var generatedAt = new Date().toLocaleString('es-PR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        var html = '<!doctype html>' +
        '<html lang="es"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<title>Resumen semanal - DailyBudget</title>' +
        '<style>' +
        'body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:0;background:#fff;padding:28px;}' +
        '.page{max-width:820px;margin:0 auto;}' +
        '.header{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #e2e8f0;padding-bottom:14px;margin-bottom:18px;}' +
        'h1{font-size:24px;margin:0 0 6px;font-weight:800;}' +
        'h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#475569;margin:24px 0 8px;}' +
        '.muted{color:#64748b;font-size:12px;line-height:1.45;}' +
        '.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0;}' +
        '.card{border:1px solid #e2e8f0;border-radius:12px;padding:12px;}' +
        '.label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:700;}' +
        '.value{font-size:18px;font-weight:800;margin-top:4px;}' +
        'table{width:100%;border-collapse:collapse;font-size:12px;}' +
        'th{text-align:left;background:#f8fafc;color:#475569;text-transform:uppercase;font-size:10px;letter-spacing:.08em;padding:9px;border-bottom:1px solid #e2e8f0;}' +
        'td{padding:9px;border-bottom:1px solid #e2e8f0;vertical-align:top;}' +
        '.amount{text-align:right;font-weight:700;white-space:nowrap;}' +
        '.empty{border:1px dashed #cbd5e1;border-radius:12px;padding:18px;text-align:center;color:#64748b;font-size:13px;}' +
        '.note{margin-top:22px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px;}' +
        '.actions{margin:18px 0 0;display:flex;gap:10px;}' +
        'button{background:#0f172a;color:white;border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;}' +
        '@media print{body{padding:0}.actions{display:none}.page{max-width:none}.cards{grid-template-columns:repeat(4,1fr)}@page{margin:16mm}}' +
        '@media(max-width:720px){body{padding:18px}.header{display:block}.cards{grid-template-columns:repeat(2,1fr)}}' +
        '</style></head><body><div class="page">' +
        '<div class="header"><div>' +
        '<h1>Resumen semanal</h1>' +
        '<div class="muted">DailyBudget · ' + escapeHtml(state.periodName || 'Periodo') + '</div>' +
        '<div class="muted">' + escapeHtml(formatDate(range.start)) + ' – ' + escapeHtml(formatDate(range.end)) + '</div>' +
        '</div><div class="muted">Generado: ' + escapeHtml(generatedAt) + '</div></div>' +
        '<div class="cards">' +
        '<div class="card"><div class="label">Total gastado</div><div class="value">' + money(total) + '</div></div>' +
        '<div class="card"><div class="label">Promedio diario</div><div class="value">' + money(average) + '</div></div>' +
        '<div class="card"><div class="label">Transacciones</div><div class="value">' + expenses.length + '</div></div>' +
        '<div class="card"><div class="label">Mayor categoría</div><div class="value" style="font-size:14px">' + escapeHtml(topCategory ? topCategory.category : '—') + '</div></div>' +
        '</div>' +
        '<h2>Gastos por categoría</h2>' +
        (categories.length ? '<table><thead><tr><th>Categoría</th><th class="amount">Total</th></tr></thead><tbody>' + categoryRows + '</tbody></table>' : '<div class="empty">No hay gastos registrados en los últimos 7 días.</div>') +
        '<h2>Detalle de gastos</h2>' +
        (expenses.length ? '<table><thead><tr><th>Fecha</th><th>Categoría</th><th>Concepto</th><th class="amount">Cantidad</th></tr></thead><tbody>' + detailRows + '</tbody></table>' : '<div class="empty">Todavía no hay gastos para imprimir en esta semana.</div>') +
        '<div class="note">Nota: este resumen incluye los gastos registrados en “Registrar gasto”. Los pagos o metas en “Dinero que no debes tocar” no se duplican aquí.</div>' +
        '<div class="actions"><button onclick="window.print()">Imprimir / Guardar PDF</button><button onclick="window.close()" style="background:#64748b">Cerrar</button></div>' +
        '</div></body></html>';

        openPrintWindow(html);
    }

    function addPrintButton() {
        if (document.getElementById('btn-print-weekly')) return;

        var summary = document.getElementById('weekly-summary-area');
        if (!summary) return;

        var btn = document.createElement('button');
        btn.id = 'btn-print-weekly';
        btn.type = 'button';
        btn.className = 'action-button w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-2xl shadow-sm text-sm';
        btn.textContent = 'Imprimir semana';
        btn.addEventListener('click', printWeeklyReport);

        summary.insertAdjacentElement('afterend', btn);
    }

    function init() {
        addPrintButton();
        setTimeout(addPrintButton, 400);
        setTimeout(addPrintButton, 1200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('load', init);
})();
