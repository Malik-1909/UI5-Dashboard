sap.ui.define([], function () {
    "use strict";

    function escapeHtml(sText) {
        return String(sText || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function markdownToSimpleHtml(sText) {
        return String(sText || "")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
    }

    return {
        escapeHtml: escapeHtml,
        markdownToSimpleHtml: markdownToSimpleHtml
    };
});
