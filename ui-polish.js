/* DailyBudget UI polish v2
   Reorganiza textos y orden visual sin tocar cálculos ni estado.
*/
(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function setText(selector, text) {
        var el = $(selector);
        if (el) el.textContent = text;
    }

    function setLabelForInput(inputId, text) {
        var input = document.getElementById(inputId);
        if (!input) return;
        var wrap = input.closest('.space-y-2');
        var label = wrap ? wrap.querySelector('label') : null;
        if (label) label.textContent = text;
    }

    function appendInOrder(parent, ids) {
        if (!parent) return;
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) parent.appendChild(el);
        });
    }

    function addSetupHelp() {
        var balanceInput = document.getElementById('init-total-balance');
        if (balanceInput && !document.getElementById('dailybudget-balance-help')) {
            var help = document.createElement('p');
            help.id = 'dailybudget-balance-help';
            help.className = 'text-[11px] text-slate-400 ml-1 leading-relaxed';
            help.textContent = 'Escribe el dinero que tienes para este periodo. Luego puedes separar pagos y metas.';
            balanceInput.insertAdjacentElement('afterend', help);
        }

        var daysInput = document.getElementById('init-total-days');
        if (daysInput && !document.getElementById('dailybudget-days-help')) {
            var daysHelp = document.createElement('p');
            daysHelp.id = 'dailybudget-days-help';
            daysHelp.className = 'text-[11px] text-slate-400 ml-1 leading-relaxed';
            daysHelp.textContent = 'Ejemplo: si cobras en 10 días, escribe 10.';
            daysInput.insertAdjacentElement('afterend', daysHelp);
        }
    }

    function addFinishHelp() {
        var btn = document.getElementById('btn-finish-day');
        if (!btn || document.getElementById('dailybudget-finish-help')) return;

        var help = document.createElement('p');
        help.id = 'dailybudget-finish-help';
        help.className = 'text-center text-[11px] text-slate-400 -mt-2 px-4 leading-relaxed';
        help.textContent = 'Al terminar el día, el sobrante se reparte entre los días que quedan.';
        btn.insertAdjacentElement('afterend', help);
    }

    function addSectionIntro() {
        var inputArea = document.getElementById('input-area');
        if (inputArea && !document.getElementById('dailybudget-main-flow-label')) {
            var label = document.createElement('div');
            label.id = 'dailybudget-main-flow-label';
            label.className = 'text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-2 -mb-1';
            label.textContent = 'Uso diario';
            inputArea.insertAdjacentElement('beforebegin', label);
        }
    }

    function polishText() {
        var exportBtn = document.getElementById('btn-export');
        if (exportBtn) exportBtn.textContent = 'Respaldo';

        setText('#setup-section h2', 'Comienza tu plan');
        var setupP = $('#setup-section h2 + p');
        if (setupP) setupP.textContent = 'Calcula cuánto puedes gastar cada día.';

        setLabelForInput('init-total-balance', 'Dinero disponible ($)');
        setLabelForInput('init-total-days', 'Días hasta tu próximo pago');

        var startBtn = $('#setup-section button[onclick="initializeBudget()"]');
        if (startBtn) startBtn.textContent = 'Calcular mi presupuesto diario';

        var importBtn = document.getElementById('btn-import');
        if (importBtn) importBtn.textContent = 'Restaurar respaldo';

        var availableLabel = $('#status-card .text-center p');
        if (availableLabel) availableLabel.textContent = 'Puedes gastar hoy';
        var availableHelp = $('#display-daily-available + p');
        if (availableHelp) availableHelp.textContent = 'Tu número principal antes de gastar.';

        var inputTitle = $('#input-area h3');
        if (inputTitle) inputTitle.textContent = 'Registrar gasto';

        var safeTitle = $('#safe-spend-card h3');
        if (safeTitle) safeTitle.textContent = 'Opciones de gasto';
        var safeText = $('#safe-spend-card h3 + p');
        if (safeText) safeText.textContent = 'Mira cuánto puedes gastar si quieres ir más seguro o más flexible.';

        var protectedTitle = $('#protected-plan-card h3');
        if (protectedTitle) protectedTitle.textContent = 'Dinero que no debes tocar';
        var protectedText = $('#protected-plan-card h3 + p');
        if (protectedText) protectedText.textContent = 'Separa pagos, metas o dinero reservado antes de calcular tu gasto diario.';

        var historyTitle = $('#history-section h3');
        if (historyTitle) historyTitle.textContent = 'Historial';

        var summaryTitle = $('#weekly-summary-area h3');
        if (summaryTitle) summaryTitle.textContent = 'Resumen del periodo';
    }

    function createMoreInfoBlock(main) {
        if (!main || document.getElementById('dailybudget-more-info-title')) return;
        var title = document.createElement('div');
        title.id = 'dailybudget-more-info-title';
        title.className = 'text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-2 pt-1';
        title.textContent = 'Más información';
        var protectedCard = document.getElementById('protected-plan-card');
        if (protectedCard) protectedCard.insertAdjacentElement('beforebegin', title);
    }

    function reorderMainScreen() {
        var main = document.getElementById('main-section');
        if (!main) return;

        addSectionIntro();
        addFinishHelp();
        createMoreInfoBlock(main);

        // Orden pensado para venta: privacidad → número principal → uso diario → detalles → reporte.
        appendInOrder(main, [
            'dailybudget-privacy-note',
            'status-card',
            'completed-card',
            'dailybudget-main-flow-label',
            'input-area',
            'btn-finish-day',
            'dailybudget-finish-help',
            'day-status-card',
            'safe-spend-card',
            'dailybudget-more-info-title',
            'protected-plan-card',
            'weekly-summary-area',
            'btn-print-weekly',
            'dailybudget-report-help'
        ]);

        var expenseList = document.getElementById('expense-list');
        if (expenseList && expenseList.parentElement) {
            main.appendChild(expenseList.parentElement);
        }

        var history = document.getElementById('history-section');
        if (history) main.appendChild(history);
    }

    function softenSecondaryCards() {
        var safe = document.getElementById('safe-spend-card');
        if (safe && !safe.dataset.uiPolished) {
            safe.dataset.uiPolished = '1';
            safe.classList.add('opacity-95');
        }

        var summary = document.getElementById('weekly-summary-area');
        if (summary && !summary.dataset.uiPolished) {
            summary.dataset.uiPolished = '1';
            summary.classList.add('opacity-95');
        }
    }

    function applyPolish() {
        polishText();
        addSetupHelp();
        reorderMainScreen();
        softenSecondaryCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPolish);
    } else {
        applyPolish();
    }

    window.addEventListener('load', function () {
        applyPolish();
        setTimeout(applyPolish, 300);
        setTimeout(applyPolish, 1200);
        setTimeout(applyPolish, 2200);
    });
})();
