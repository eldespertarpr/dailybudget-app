/* DailyBudget persistence guard v1 */
(function () {
    var STORAGE_KEY = 'daily_budget_pro_v5';
    var BACKUP_KEY = STORAGE_KEY + '_backup';
    var LAST_GOOD_KEY = STORAGE_KEY + '_last_good';
    var RESET_FLAG_KEY = STORAGE_KEY + '_user_reset';

    function isValidState(raw) {
        try {
            if (!raw) return false;
            var parsed = JSON.parse(raw);
            return (
                parsed &&
                typeof parsed === 'object' &&
                typeof parsed.isInitialized === 'boolean' &&
                Array.isArray(parsed.expenses)
            );
        } catch (err) {
            return false;
        }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            console.error('DailyBudget: no se pudo guardar', key, err);
        }
    }

    function safeRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (err) {
            console.error('DailyBudget: no se pudo borrar', key, err);
        }
    }

    function copyPrimaryToBackups() {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!isValidState(raw)) return false;

        safeSet(BACKUP_KEY, raw);
        safeSet(LAST_GOOD_KEY, raw);
        safeRemove(RESET_FLAG_KEY);
        return true;
    }

    function restoreBeforeAppLoads() {
        var primary = localStorage.getItem(STORAGE_KEY);
        var backup = localStorage.getItem(BACKUP_KEY);
        var lastGood = localStorage.getItem(LAST_GOOD_KEY);
        var userReset = localStorage.getItem(RESET_FLAG_KEY);

        if (primary) {
            if (isValidState(primary)) {
                copyPrimaryToBackups();
                return;
            }

            safeSet(STORAGE_KEY + '_corrupt_backup_' + Date.now(), primary);

            if (isValidState(backup)) {
                safeSet(STORAGE_KEY, backup);
                return;
            }

            if (isValidState(lastGood)) {
                safeSet(STORAGE_KEY, lastGood);
                return;
            }

            return;
        }

        if (userReset) return;

        if (isValidState(backup)) {
            safeSet(STORAGE_KEY, backup);
            return;
        }

        if (isValidState(lastGood)) {
            safeSet(STORAGE_KEY, lastGood);
        }
    }

    function wrapGlobalFunctions() {
        try {
            if (typeof save === 'function' && !save.__dailyBudgetGuarded) {
                var originalSave = save;

                save = function () {
                    var result = originalSave.apply(this, arguments);
                    copyPrimaryToBackups();
                    return result;
                };

                save.__dailyBudgetGuarded = true;
            }
        } catch (err) {
            console.error('DailyBudget: no se pudo proteger save()', err);
        }

        try {
            if (typeof resetApp === 'function' && !resetApp.__dailyBudgetGuarded) {
                var originalResetApp = resetApp;

                resetApp = function () {
                    var result = originalResetApp.apply(this, arguments);
                    safeRemove(BACKUP_KEY);
                    safeRemove(LAST_GOOD_KEY);
                    safeSet(RESET_FLAG_KEY, String(Date.now()));
                    return result;
                };

                resetApp.__dailyBudgetGuarded = true;
            }
        } catch (err) {
            console.error('DailyBudget: no se pudo proteger resetApp()', err);
        }
    }

    restoreBeforeAppLoads();
    wrapGlobalFunctions();

    window.addEventListener('DOMContentLoaded', function () {
        wrapGlobalFunctions();
        copyPrimaryToBackups();
    });

    window.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            copyPrimaryToBackups();
        }
    });
})();
