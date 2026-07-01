sap.ui.define([
    "ui5/vizframe/app/utils/ChatRouteConfig"
], function (ChatRouteConfig) {
    "use strict";

    function userExplicitlyRequestedNavigation(sUserText) {
        var sText = (sUserText || "").trim();
        if (!sText) {
            return false;
        }
        return /\b(geh|gehe)\s+zu(r|m)?\b/i.test(sText)
            || /\bnavigier(?:e)?\s+zu(r|m)?\b/i.test(sText)
            || /\bwechsle\s+zu(r|m)?\b/i.test(sText)
            || /\b(bring|bringt)\s+mich\s+(zu(r|m)?|auf)\b/i.test(sText);
    }

    function tryNavigateFromReply(mOptions) {
        var sReply = mOptions && mOptions.reply;
        if (!sReply || !sReply.trim()) {
            return { handled: false };
        }

        var oIntent;
        try {
            oIntent = JSON.parse(sReply.trim());
        } catch (e) {
            return { handled: false };
        }

        if (oIntent.action !== "navigate" || !oIntent.route) {
            return { handled: false };
        }

        if (!userExplicitlyRequestedNavigation(mOptions.lastUserMessage)) {
            return {
                handled: true,
                shouldNavigate: false,
                hintHtml: "Für einen Seitenwechsel bitte ausdrücklich z. B. <strong>Gehe zu …</strong> oder <strong>Navigiere zu …</strong> schreiben.",
                hintText: "Für einen Seitenwechsel bitte ausdrücklich z. B. Gehe zu ... oder Navigiere zu ... schreiben."
            };
        }

        var sLabel = ChatRouteConfig.getRouteLabel(oIntent.route);
        return {
            handled: true,
            shouldNavigate: true,
            route: oIntent.route,
            label: sLabel
        };
    }

    return {
        userExplicitlyRequestedNavigation: userExplicitlyRequestedNavigation,
        tryNavigateFromReply: tryNavigateFromReply
    };
});
