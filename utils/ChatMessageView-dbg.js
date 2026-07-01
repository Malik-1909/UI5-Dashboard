sap.ui.define([
    "ui5/vizframe/app/utils/ChatTextFormat"
], function (ChatTextFormat) {
    "use strict";

    /**
     * @param {sap.m.VBox} oVBox chatMessages container
     * @param {string} sText plain user text
     * @param {{ HBox: typeof sap.m.HBox, FormattedText: typeof sap.m.FormattedText }} mControls
     */
    function appendUserMessage(oVBox, sText, mControls) {
        var HBox = mControls.HBox;
        var FormattedText = mControls.FormattedText;
        var oRow = new HBox({ justifyContent: "End" }).addStyleClass("chatRow");
        var oBubble = new FormattedText({
            htmlText: ChatTextFormat.escapeHtml(sText).replace(/\n/g, "<br>")
        }).addStyleClass("chatBubble chatBubbleUser");
        oRow.addItem(oBubble);
        oVBox.addItem(oRow);
    }

    /**
     * @param {sap.m.VBox} oVBox chatMessages container
     * @param {string} sHtml bot HTML (FormattedText)
     * @param {{ HBox: typeof sap.m.HBox, FormattedText: typeof sap.m.FormattedText }} mControls
     */
    function appendBotHtml(oVBox, sHtml, mControls) {
        var HBox = mControls.HBox;
        var FormattedText = mControls.FormattedText;
        var oRow = new HBox({ justifyContent: "Start" }).addStyleClass("chatRow");
        var oBubble = new FormattedText({ htmlText: sHtml }).addStyleClass("chatBubble chatBubbleBot");
        oRow.addItem(oBubble);
        oVBox.addItem(oRow);
    }

    /**
     * @param {sap.m.VBox} oVBox chatMessages container
     * @param {{ HBox: typeof sap.m.HBox, FormattedText: typeof sap.m.FormattedText }} mControls
     */
    function appendTyping(oVBox, mControls) {
        var HBox = mControls.HBox;
        var FormattedText = mControls.FormattedText;
        var oRow = new HBox({ justifyContent: "Start" }).addStyleClass("chatRow chatTypingRow");
        var oBubble = new FormattedText({ htmlText: "<span class='chatDots'><span></span></span>" })
            .addStyleClass("chatBubble chatBubbleBot chatTypingBubble");
        oRow.addItem(oBubble);
        oVBox.addItem(oRow);
    }

    /**
     * @param {sap.m.VBox} oVBox chatMessages container
     */
    function removeTyping(oVBox) {
        var aItems = oVBox.getItems();
        var i;
        for (i = aItems.length - 1; i >= 0; i--) {
            if (aItems[i].hasStyleClass("chatTypingRow")) {
                oVBox.removeItem(aItems[i]);
                aItems[i].destroy();
                break;
            }
        }
    }

    return {
        appendUserMessage: appendUserMessage,
        appendBotHtml: appendBotHtml,
        appendTyping: appendTyping,
        removeTyping: removeTyping
    };
});
