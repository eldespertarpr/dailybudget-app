/* DailyBudget sales polish v2
   Mejoras de confianza y guía para versión en venta.
   No toca cálculos ni estructura principal.
*/
(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function addPrivacyNote() {
        if (document.getElementById('dailybudget-privacy-note')) return;

        var main = document.getElementById('main-section');
        var setup = document.getElementById('setup-section');
        var target = main && !main.classList.contains('hidden') ? main : setup;
        if (!target) return;

        var note = document.createElement('div');
        note.id = 'dailybudget-privacy-note';
        note.className = 'bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm';
        note.innerHTML = '<strong>Privacidad:</strong> tus datos se guardan en este dispositivo. DailyBudget no se conecta a tu banco ni envía tu información.';

        if (target === main) {
            var status = document.getElementById('status-card');
            if (status) status.insertAdjacentElement('beforebegin', note);
            else target.insertAdjacentElement('afterbegin', note);
        } else {
            target.appendChild(note);
        }
    }

    function addProtectedHelp() {
        if (document.getElementById('dailybudget-protected-help')) return;
        var card = document.getElementById('protected-plan-card');
        if (!card) return;

        var help = document.createElement('div');
        help.id = 'dailybudget-protected-help';
        help.className = 'bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs text-slate-500 leading-relaxed';
        help.innerHTML = '<strong class="text-slate-700">Regla simple:</strong> pagos fijos y metas van aquí. Gastos del día van en “Registrar gasto”. No registres el mismo pago en ambos lugares.';

        var details = document.getElementById('protected-list');
        if (details && details.parentElement) {
            details.parentElement.insertAdjacentElement('beforebegin', help);
        } else {
            card.appendChild(help);
        }
    }

    function addReportHelp() {
        if (document.getElementById('dailybudget-report-help')) return;
        var btn = document.getElementById('btn-print-weekly');
        if (!btn) return;

        var help = document.createElement('p');
        help.id = 'dailybudget-report-help';
        help.className = 'text-[11px] text-slate-400 text-center -mt-1 px-4 leading-relaxed';
        help.textContent = 'El reporte usa el periodo que configuraste, ya sea semanal, quincenal, bisemanal o mensual.';
        btn.insertAdjacentElement('afterend', help);
    }

    function patchResetConfirmation() {
        if (window.__dailyBudgetResetConfirmPatched) return;
        window.__dailyBudgetResetConfirmPatched = true;

        document.addEventListener('click', function (event) {
            var btn = event.target && event.target.closest ? event.target.closest('#btn-reset-app') : null;
            if (!btn) return;

            var message = 'Esto borrará el plan actual de este dispositivo.\n\nAntes de continuar, usa Respaldo si quieres conservar tus datos.\n\n¿Seguro que quieres crear un nuevo plan?';
            if (!window.confirm(message)) {
                event.preventDefault();
                event.stopImmediatePropagation();
                return false;
            }
        }, true);
    }

    function enhanceGuide() {
        if (document.getElementById('dailybudget-guide-sales-help')) return;

        var guideBody = $('#guide-modal .px-6.py-5');
        if (!guideBody) return;

        var block = document.createElement('div');
        block.id = 'dailybudget-guide-sales-help';
        block.className = 'space-y-4 bg-slate-50 border border-slate-100 rounded-2xl p-4';
        block.innerHTML = '' +
            '<div class="space-y-1">' +
                '<h3 class="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">💡 Idea principal</h3>' +
                '<p class="text-sm text-slate-600 leading-relaxed">Tu banco te dice cuánto tienes. DailyBudget te dice cuánto puedes usar hoy.</p>' +
            '</div>' +
            '<div class="space-y-1">' +
                '<h3 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Cómo empezar</h3>' +
                '<p class="text-sm text-slate-600 leading-relaxed">Escribe el balance real de tu cuenta y los días hasta tu próximo pago. Luego toca “Calcular mi presupuesto diario”.</p>' +
            '</div>' +
            '<div class="space-y-1">' +
                '<h3 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Dinero que no debes tocar</h3>' +
                '<p class="text-sm text-slate-600 leading-relaxed">Aquí van pagos pendientes, metas o dinero reservado que todavía está en tu cuenta, pero que no debes gastar. Cuando ese pago salga del banco, márcalo como pagado. No lo registres también como gasto diario.</p>' +
            '</div>' +
            '<div class="space-y-1">' +
                '<h3 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Registrar gasto</h3>' +
                '<p class="text-sm text-slate-600 leading-relaxed">Usa esta parte para compras del día: comida, gasolina, supermercado, farmacia, café, mascotas o gastos pequeños.</p>' +
            '</div>' +
            '<div class="space-y-1">' +
                '<h3 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Imprimir periodo</h3>' +
                '<p class="text-sm text-slate-600 leading-relaxed">El reporte usa el periodo que configuraste. Funciona para pagos semanales, quincenales, bisemanales o mensuales.</p>' +
            '</div>' +
            '<div class="space-y-1">' +
                '<h3 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Respaldo</h3>' +
                '<p class="text-sm text-slate-600 leading-relaxed">Toca “Respaldo” para guardar un archivo de tus datos. Usa “Restaurar respaldo” cuando quieras cargar un archivo guardado.</p>' +
            '</div>';

        guideBody.insertAdjacentElement('afterbegin', block);
    }

    function cleanOldGuideText() {
        var guideBody = $('#guide-modal .px-6.py-5');
        if (!guideBody || guideBody.dataset.currentLabelsCleaned === '1') return;

        var walker = document.createTreeWalker(guideBody, NodeFilter.SHOW_TEXT, null);
        var nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach(function (node) {
            node.nodeValue = node.nodeValue
                .replace(/Comenzar Plan/g, 'Calcular mi presupuesto diario')
                .replace(/Exportar/g, 'Respaldo')
                .replace(/exportar/g, 'guardar respaldo')
                .replace(/Importar datos desde archivo/g, 'Restaurar respaldo')
                .replace(/Importar/g, 'Restaurar respaldo')
                .replace(/importar/g, 'restaurar respaldo');
        });

        guideBody.dataset.currentLabelsCleaned = '1';
    }

    function polishBackupButton() {
        var exportBtn = document.getElementById('btn-export');
        if (exportBtn) exportBtn.title = 'Guardar respaldo de tus datos';

        var resetBtn = document.getElementById('btn-reset-app');
        if (resetBtn) resetBtn.title = 'Crear un nuevo plan borra el plan actual de este dispositivo';
    }

    function applySalesPolish() {
        addPrivacyNote();
        addProtectedHelp();
        addReportHelp();
        enhanceGuide();
        cleanOldGuideText();
        polishBackupButton();
    }

    patchResetConfirmation();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applySalesPolish);
    } else {
        applySalesPolish();
    }

    window.addEventListener('load', function () {
        applySalesPolish();
        setTimeout(applySalesPolish, 400);
        setTimeout(applySalesPolish, 1200);
        setTimeout(applySalesPolish, 2200);
    });
})();
