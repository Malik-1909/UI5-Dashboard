sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/Button",
    "sap/m/HBox",
    "sap/m/FormattedText",
    "sap/m/MessageToast"
], function (Controller, Fragment, Button, HBox, FormattedText, MessageToast) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.App", {

        // ── Lifecycle ────────────────────────────────────────────────────────

        onInit: function () {
            this._chatHistory  = [];   // { role: "user"|"bot", text: "..." }
            this._fabMounted   = false;
            this._pPopover     = null;
            this._oChatPopover = null;
        },

        onAfterRendering: function () {
            this._mountFab();
        },

        // ── Floating Action Button ───────────────────────────────────────────

        _mountFab: function () {
            if (this._fabMounted) { return; }
            this._fabMounted = true;

            // Create a fixed-position host div outside the UI5 render tree
            var oHost = document.createElement("div");
            oHost.id = "chatFabHost";
            document.body.appendChild(oHost);

            this._oFabBtn = new Button({
                icon:    "sap-icon://discussion",
                type:    "Emphasized",
                tooltip: "KI Assistent",
                press:   this._onFabPress.bind(this)
            });
            this._oFabBtn.addStyleClass("chatFabBtn");
            this._oFabBtn.placeAt("chatFabHost");
        },

        _onFabPress: function () {
            var that  = this;
            var oView = this.getView();

            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id:         oView.getId(),
                    name:       "ui5.vizframe.app.fragment.Chatbot",
                    controller: this
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    that._oChatPopover = oPopover;

                    // Wire input "Enter" key + send button
                    that.byId("chatInput").attachBrowserEvent("keydown", function (oEv) {
                        if (oEv.key === "Enter") { that._sendMessage(); }
                    });
                    that.byId("chatSendBtn").attachPress(that._sendMessage.bind(that));

                    // Initial greeting
                    that._addBotMsg(
                        "Hallo! Ich bin dein KI-Assistent 👋<br>" +
                        "Ich beantworte KPI-Fragen und navigiere dich durch die App.<br>" +
                        "Zum Beispiel: <em>\"Zeige R2R\"</em> oder <em>\"Was ist Lead to Cash?\"</em>"
                    );

                    return oPopover;
                });
            }

            this._pPopover.then(function (oPopover) {
                if (oPopover.isOpen()) {
                    oPopover.close();
                } else {
                    oPopover.openBy(that._oFabBtn);
                    // Focus input after open
                    setTimeout(function () {
                        var oInput = that.byId("chatInput");
                        if (oInput) { oInput.focus(); }
                    }, 300);
                }
            });
        },

        // ── Messaging ────────────────────────────────────────────────────────

        _sendMessage: function () {
            var oInput = this.byId("chatInput");
            var sText  = (oInput.getValue() || "").trim();
            if (!sText) { return; }

            oInput.setValue("");
            this._addUserMsg(sText);
            this._chatHistory.push({ role: "user", text: sText });
            this._showTyping();
            this._callApi(sText);
        },

        _callApi: function (sText) {
            var that = this;
            fetch("/api/chat", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    messages: this._chatHistory,
                    context:  this._buildContext()
                })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                that._hideTyping();
                if (data.error) {
                    // escape so FormattedText renders it correctly
                    that._addBotMsg("⚠️ " + that._escapeHtml(String(data.error)));
                    return;
                }
                that._handleReply(data.reply || "");
            })
            .catch(function (err) {
                that._hideTyping();
                that._addBotMsg("⚠️ Verbindungsfehler: " + that._escapeHtml(err.message));
            });
        },

        _handleReply: function (sReply) {
            if (!sReply || !sReply.trim()) {
                this._addBotMsg("Keine Antwort erhalten – bitte erneut versuchen.");
                return;
            }
            // Check for navigation intent JSON from the model
            try {
                var oIntent = JSON.parse(sReply.trim());
                if (oIntent.action === "navigate" && oIntent.route) {
                    var mLabels = {
                        main:    "Startseite",
                        r2r:     "Record to Report",
                        rtr:     "Recruit to Retire",
                        s2p:     "Source to Pay",
                        d2o:     "Design to Operate",
                        l2c:     "Lead to Cash",
                        project: "Projekt"
                    };
                    var sLabel = mLabels[oIntent.route] || oIntent.route;
                    this._addBotMsg("Navigiere zu <strong>" + sLabel + "</strong> ...");
                    this._chatHistory.push({ role: "bot", text: "Navigation: " + sLabel });

                    if (this._oChatPopover) { this._oChatPopover.close(); }
                    setTimeout(function () {
                        sap.ui.getCore().getComponent("ui5.vizframe.app")
                            || (this.getOwnerComponent().getRouter().navTo(oIntent.route));
                    }.bind(this), 400);
                    this.getOwnerComponent().getRouter().navTo(oIntent.route);
                    return;
                }
            } catch (e) {
                // Plain text reply — fall through
            }

            this._chatHistory.push({ role: "bot", text: sReply });
            // Convert markdown + newlines; trust AI HTML (FormattedText sanitises anyway)
            var sHtml = sReply
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.+?)\*/g, "<em>$1</em>")
                .replace(/\n/g, "<br>");
            this._addBotMsg(sHtml);
        },

        // ── Message Rendering ────────────────────────────────────────────────

        _addUserMsg: function (sText) {
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) { return; }

            var oRow = new HBox({ justifyContent: "End" }).addStyleClass("chatRow");
            var oBubble = new FormattedText({
                htmlText: this._escapeHtml(sText).replace(/\n/g, "<br>")
            }).addStyleClass("chatBubble chatBubbleUser");
            oRow.addItem(oBubble);
            oChatMessages.addItem(oRow);
            this._scrollToBottom();
        },

        _addBotMsg: function (sHtml) {
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) { return; }

            var oRow = new HBox({ justifyContent: "Start" }).addStyleClass("chatRow");
            var oBubble = new FormattedText({ htmlText: sHtml }).addStyleClass("chatBubble chatBubbleBot");
            oRow.addItem(oBubble);
            oChatMessages.addItem(oRow);
            this._scrollToBottom();
        },

        _showTyping: function () {
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) { return; }

            var oRow = new HBox({ justifyContent: "Start" }).addStyleClass("chatRow chatTypingRow");
            var oBubble = new FormattedText({ htmlText: "<span class='chatDots'><span></span></span>" })
                .addStyleClass("chatBubble chatBubbleBot chatTypingBubble");
            oRow.addItem(oBubble);
            oChatMessages.addItem(oRow);
            this._scrollToBottom();
        },

        _hideTyping: function () {
            var oChatMessages = this.byId("chatMessages");
            if (!oChatMessages) { return; }
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
                var oScroll = that.byId("chatScroll");
                if (oScroll) { oScroll.scrollTo(0, 99999, 150); }
            }, 60);
        },

        // ── Helpers ──────────────────────────────────────────────────────────

        _buildContext: function () {
            try {
                var oRouter = this.getOwnerComponent().getRouter();
                var sHash   = window.location.hash.replace("#", "") || "main";
                var mNames  = {
                    "":        "Startseite",
                    "main":    "Startseite",
                    "r2r":     "Record to Report",
                    "rtr":     "Recruit to Retire",
                    "s2p":     "Source to Pay",
                    "d2o":     "Design to Operate",
                    "l2c":     "Lead to Cash",
                    "project": "Projektseite"
                };
                return "Aktuell angezeigte Seite: " + (mNames[sHash] || sHash);
            } catch (e) {
                return "";
            }
        },

        _escapeHtml: function (s) {
            return s
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
    });
});
