sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/Button",
    "sap/m/HBox",
    "sap/m/FormattedText",
    "ui5/vizframe/app/utils/StaticChatMock",
    "ui5/vizframe/app/utils/ChatContextBuilder",
    "ui5/vizframe/app/utils/ChatNavigationGuard",
    "ui5/vizframe/app/utils/ChatTextFormat"
], function (
    Controller,
    Fragment,
    Button,
    HBox,
    FormattedText,
    StaticChatMock,
    ChatContextBuilder,
    ChatNavigationGuard,
    ChatTextFormat
) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.App", {

        // ── Lifecycle ────────────────────────────────────────────────────────

        onInit: function () {
            this._chatHistory  = [];   // { role: "user"|"bot", text: "..." }
            this._pPopover     = null;
            this._oChatPopover = null;
            this._oFabBtn      = null;
        },

        onAfterRendering: function () {
            this._mountFab();
        },

        /**
         * Controls aus Fragment.byId laden (this.byId findet Fragment-Kinder oft nicht).
         */
        _chatById: function (sId) {
            var oView = this.getView();
            if (!oView) { return null; }
            var oCtrl = Fragment.byId(oView.getId(), sId);
            return oCtrl || this.byId(sId);
        },

        /**
         * Von Header / Burger-Menü: Chat öffnen (anker unten rechts, Popover nach oben).
         */
        openChatFromNavigation: function () {
            if (!this._oFabBtn) { this._mountFab(); }
            var that = this;
            this._ensureChatPopover().then(function (oPopover) {
                if (!oPopover.isOpen()) {
                    oPopover.openBy(that._oFabBtn);
                }
                setTimeout(function () {
                    var oInput = that._chatById("chatInput");
                    if (oInput) { oInput.focus(); }
                }, 350);
            });
        },

        // ── Floating Action Button ───────────────────────────────────────────

        _mountFab: function () {
            var oHost = document.getElementById("chatFabHost");
            if (!oHost) {
                oHost = document.createElement("div");
                oHost.id = "chatFabHost";
                document.body.appendChild(oHost);
            }

            if (this._oFabBtn && !this._oFabBtn.bIsDestroyed) {
                return;
            }

            if (this._oFabBtn) {
                this._oFabBtn.destroy();
                this._oFabBtn = null;
            }

            this._oFabBtn = new Button({
                icon:           "sap-icon://message-popup",
                type:           "Emphasized",
                tooltip:        "KI Assistent",
                accessibleName: "KI Assistent: Chat öffnen oder schließen",
                press:          this._onFabPress.bind(this)
            });
            this._oFabBtn.addStyleClass("chatFabBtn chatFabAi");
            this._oFabBtn.placeAt(oHost);
        },

        _ensureChatPopover: function () {
            if (this._oChatPopover && this._oChatPopover.bIsDestroyed) {
                this._oChatPopover = null;
                this._pPopover = null;
            }

            if (this._pPopover) { return this._pPopover; }

            var that  = this;
            var oView = this.getView();

            this._pPopover = Fragment.load({
                id:         oView.getId(),
                name:       "ui5.vizframe.app.fragment.Chatbot",
                controller: this
            }).then(function (oPopover) {
                oView.addDependent(oPopover);
                that._oChatPopover = oPopover;

                var oInput = that._chatById("chatInput");
                var oSend  = that._chatById("chatSendBtn");
                if (oInput) {
                    oInput.attachBrowserEvent("keydown", function (oEv) {
                        if (oEv.key === "Enter") { that._sendMessage(); }
                    });
                }
                if (oSend) {
                    oSend.attachPress(that._sendMessage.bind(that));
                }

                var oComp = that.getOwnerComponent();
                var sGh = oComp && oComp.isRunningOnGitHubPages && oComp.isRunningOnGitHubPages()
                    ? "Auf GitHub Pages nutze ich Demo-Daten und eine <strong>Offline-Simulation</strong> (kein API-Key). Lokal mit <code>npm run start</code> ist die echte KI aktiv.<br><br>"
                    : "";
                that._addBotMsg(
                    "Hallo! Ich bin dein KI-Assistent für dieses Dashboard.<br>" +
                    sGh +
                    "Frag zu den Prozessen, Kacheln oder KPIs. Für einen Seitenwechsel z. B. <em>„Navigiere zu R2R“</em> oder <em>„Gehe zur Startseite“</em>."
                );

                return oPopover;
            });

            return this._pPopover;
        },

        _onFabPress: function () {
            var that = this;
            if (!this._oFabBtn) { this._mountFab(); }
            this._ensureChatPopover().then(function (oPopover) {
                if (oPopover.isOpen()) {
                    oPopover.close();
                } else {
                    oPopover.openBy(that._oFabBtn);
                    setTimeout(function () {
                        var oInput = that._chatById("chatInput");
                        if (oInput) { oInput.focus(); }
                    }, 300);
                }
            });
        },

        // ── Messaging ────────────────────────────────────────────────────────

        _sendMessage: function () {
            var oInput = this._chatById("chatInput");
            if (!oInput || oInput.bIsDestroyed) {
                return;
            }
            var sText = (oInput.getValue() || "").trim();
            if (!sText) { return; }

            oInput.setValue("");
            this._addUserMsg(sText);
            this._chatHistory.push({ role: "user", text: sText });
            this._showTyping();
            this._callApi(sText);
        },

        _callApi: function (sText) {
            var that = this;
            var oComp = this.getOwnerComponent();
            if (oComp && oComp.isRunningOnGitHubPages && oComp.isRunningOnGitHubPages()) {
                that._hideTyping();
                that._handleReply(StaticChatMock.getReply(sText), sText);
                return;
            }
            fetch("/api/chat", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    messages: this._chatHistory,
                    context:  ChatContextBuilder.buildContext(this.getOwnerComponent())
                })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                that._hideTyping();
                if (data.error) {
                    // escape so FormattedText renders it correctly
                    that._addBotMsg("<strong>Hinweis:</strong> " + ChatTextFormat.escapeHtml(String(data.error)));
                    return;
                }
                that._handleReply(data.reply || "", sText);
            })
            .catch(function (err) {
                that._hideTyping();
                that._addBotMsg("<strong>Verbindungsfehler:</strong> " + ChatTextFormat.escapeHtml(err.message));
            });
        },

        _handleReply: function (sReply, sLastUserMessage) {
            if (!sReply || !sReply.trim()) {
                this._addBotMsg("Keine Antwort erhalten – bitte erneut versuchen.");
                return;
            }

            var oNavResult = ChatNavigationGuard.tryNavigateFromReply({
                reply: sReply,
                lastUserMessage: sLastUserMessage
            });
            if (oNavResult.handled) {
                if (!oNavResult.shouldNavigate) {
                    this._chatHistory.push({ role: "bot", text: oNavResult.hintText });
                    this._addBotMsg(oNavResult.hintHtml);
                    return;
                }

                this._addBotMsg("Navigiere zu <strong>" + oNavResult.label + "</strong> ...");
                this._chatHistory.push({ role: "bot", text: "Navigation: " + oNavResult.label });
                if (this._oChatPopover) {
                    this._oChatPopover.close();
                }
                this.getOwnerComponent().getRouter().navTo(oNavResult.route);
                return;
            }

            this._chatHistory.push({ role: "bot", text: sReply });
            this._addBotMsg(ChatTextFormat.markdownToSimpleHtml(sReply));
        },

        // ── Message Rendering ────────────────────────────────────────────────

        _addUserMsg: function (sText) {
            var oChatMessages = this._chatById("chatMessages");
            if (!oChatMessages || oChatMessages.bIsDestroyed) { return; }

            var oRow = new HBox({ justifyContent: "End" }).addStyleClass("chatRow");
            var oBubble = new FormattedText({
                htmlText: ChatTextFormat.escapeHtml(sText).replace(/\n/g, "<br>")
            }).addStyleClass("chatBubble chatBubbleUser");
            oRow.addItem(oBubble);
            oChatMessages.addItem(oRow);
            this._scrollToBottom();
        },

        _addBotMsg: function (sHtml) {
            var oChatMessages = this._chatById("chatMessages");
            if (!oChatMessages || oChatMessages.bIsDestroyed) { return; }

            var oRow = new HBox({ justifyContent: "Start" }).addStyleClass("chatRow");
            var oBubble = new FormattedText({ htmlText: sHtml }).addStyleClass("chatBubble chatBubbleBot");
            oRow.addItem(oBubble);
            oChatMessages.addItem(oRow);
            this._scrollToBottom();
        },

        _showTyping: function () {
            var oChatMessages = this._chatById("chatMessages");
            if (!oChatMessages || oChatMessages.bIsDestroyed) { return; }

            var oRow = new HBox({ justifyContent: "Start" }).addStyleClass("chatRow chatTypingRow");
            var oBubble = new FormattedText({ htmlText: "<span class='chatDots'><span></span></span>" })
                .addStyleClass("chatBubble chatBubbleBot chatTypingBubble");
            oRow.addItem(oBubble);
            oChatMessages.addItem(oRow);
            this._scrollToBottom();
        },

        _hideTyping: function () {
            var oChatMessages = this._chatById("chatMessages");
            if (!oChatMessages || oChatMessages.bIsDestroyed) { return; }
            var aItems = oChatMessages.getItems();
            for (var i = aItems.length - 1; i >= 0; i--) {
                if (aItems[i].hasStyleClass("chatTypingRow")) {
                    oChatMessages.removeItem(aItems[i]);
                    aItems[i].destroy();
                    break;
                }
            }
        },

        _scrollToBottom: function () {
            var that = this;
            setTimeout(function () {
                var oScroll = that._chatById("chatScroll");
                if (oScroll && !oScroll.bIsDestroyed) { oScroll.scrollTo(0, 99999, 150); }
            }, 60);
        }
    });
});
