sap.ui.define([], function () {
    "use strict";

    /**
     * POST /api/chat – returns parsed JSON body (same shape as before: { reply?, error? }).
     */
    function postChat(mPayload) {
        return fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mPayload)
        }).then(function (res) {
            return res.json();
        });
    }

    return {
        postChat: postChat
    };
});
