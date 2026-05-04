sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/Button",
    "sap/m/HBox",
    "sap/m/FormattedText",
    "ui5/vizframe/app/utils/StaticChatMock"
], function (Controller, Fragment, Button, HBox, FormattedText, StaticChatMock) {
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
                    context:  this._buildContext()
                })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                that._hideTyping();
                if (data.error) {
                    // escape so FormattedText renders it correctly
                    that._addBotMsg("<strong>Hinweis:</strong> " + that._escapeHtml(String(data.error)));
                    return;
                }
                that._handleReply(data.reply || "", sText);
            })
            .catch(function (err) {
                that._hideTyping();
                that._addBotMsg("<strong>Verbindungsfehler:</strong> " + that._escapeHtml(err.message));
            });
        },

        /** Nur bei ausdrücklichem Navigationsbefehl im Nutzertext Router auslösen (nicht bei halluziniertem JSON). */
        _userExplicitlyRequestedNavigation: function (sUserText) {
            var s = (sUserText || "").trim();
            if (!s) {
                return false;
            }
            return /\b(geh|gehe)\s+zu(r|m)?\b/i.test(s)
                || /\bnavigier(?:e)?\s+zu(r|m)?\b/i.test(s)
                || /\bwechsle\s+zu(r|m)?\b/i.test(s)
                || /\b(bring|bringt)\s+mich\s+(zu(r|m)?|auf)\b/i.test(s);
        },

        _handleReply: function (sReply, sLastUserMessage) {
            if (!sReply || !sReply.trim()) {
                this._addBotMsg("Keine Antwort erhalten – bitte erneut versuchen.");
                return;
            }
            // Check for navigation intent JSON from the model
            try {
                var oIntent = JSON.parse(sReply.trim());
                if (oIntent.action === "navigate" && oIntent.route) {
                    if (!this._userExplicitlyRequestedNavigation(sLastUserMessage)) {
                        var sHint = "Für einen Seitenwechsel bitte ausdrücklich z. B. "
                            + "<strong>Gehe zu …</strong> oder <strong>Navigiere zu …</strong> schreiben.";
                        this._chatHistory.push({ role: "bot", text: sHint.replace(/<[^>]+>/g, "") });
                        this._addBotMsg(sHint);
                        return;
                    }
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
            var oChatMessages = this._chatById("chatMessages");
            if (!oChatMessages || oChatMessages.bIsDestroyed) { return; }

            var oRow = new HBox({ justifyContent: "End" }).addStyleClass("chatRow");
            var oBubble = new FormattedText({
                htmlText: this._escapeHtml(sText).replace(/\n/g, "<br>")
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
        },

        // ── Helpers ──────────────────────────────────────────────────────────

        /** Welche Modellpfade für den Chat-Kontext je Route mitgeschickt werden. */
        _contextModelKeysForRoute: function (sRoute) {
            var r = (sRoute || "main").split("/")[0] || "main";
            var m = {
                "":        ["RtrHeadcountFunnel", "R2RByAccountType", "S2POrdersByMonth", "D2OOutputTrend", "L2CConversionFunnel"],
                main:      ["RtrHeadcountFunnel", "R2RByAccountType", "S2POrdersByMonth", "D2OOutputTrend", "L2CConversionFunnel"],
                r2r:       ["R2RKpiTable", "R2RByAccountType", "R2RProcessFunnel", "R2RCloseCycle", "R2RJournalEntries"],
                rtr:       ["RtrKpiTable", "RtrHeadcountFunnel", "RtrByDepartment", "RtrAttritionTrend"],
                s2p:       ["S2PKpiTable", "S2POrdersByMonth", "S2PProcessFunnel", "S2PSpendByCategory", "S2PInvoiceCycle"],
                d2o:       ["D2OKpiTable", "D2OOutputTrend", "D2OProcessFunnel", "D2OCapacityUtil"],
                l2c:       ["L2CKpiTable", "L2CConversionFunnel", "L2CRevenueByStage", "L2CDSO", "L2COrdersByMonth"],
                project:   []
            };
            return m[r] || m.main;
        },

        _buildContext: function () {
            try {
                var oComp = this.getOwnerComponent();
                var sRaw  = (window.location.hash || "").replace(/^#/, "").replace(/^\//, "") || "main";
                var sRoute = (sRaw.split("/")[0] || "main").trim() || "main";
                var mNames  = {
                    "":        "Startseite",
                    main:      "Startseite",
                    r2r:       "Record to Report",
                    rtr:       "Recruit to Retire",
                    s2p:       "Source to Pay",
                    d2o:       "Design to Operate",
                    l2c:       "Lead to Cash",
                    project:   "Projektseite"
                };
                var sPage = mNames[sRoute] || sRoute;
                var aParts = ["Aktuell angezeigte Seite: " + sPage];

                var oSales = oComp.getModel("sales");
                if (oSales && typeof oSales.getData === "function") {
                    var oData = oSales.getData();
                    if (oData && typeof oData === "object") {
                        var aKeys = this._contextModelKeysForRoute(sRoute);
                        var oSlice = {};
                        var i;
                        for (i = 0; i < aKeys.length; i++) {
                            var k = aKeys[i];
                            if (oData[k] != null) {
                                oSlice[k] = oData[k];
                            }
                        }
                        if (Object.keys(oSlice).length) {
                            var sJson = JSON.stringify(oSlice);
                            var nMax = 14000;
                            if (sJson.length > nMax) {
                                sJson = sJson.slice(0, nMax) + "…(gekürzt)";
                            }
                            aParts.push("");
                            aParts.push("KPI-Daten aus der App (Mock oder Live, wie im Diagramm – für Zahlenfragen diese Werte verwenden):");
                            aParts.push(sJson);
                        }
                    }
                }
                return aParts.join("\n");
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
