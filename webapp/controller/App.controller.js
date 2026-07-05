sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/Button",
    "sap/m/HBox",
    "sap/m/FormattedText",
    "ui5/vizframe/app/utils/StaticChatMock",
    "ui5/vizframe/app/utils/ChatContextBuilder",
    "ui5/vizframe/app/utils/ChatNavigationGuard",
    "ui5/vizframe/app/utils/ChatTextFormat",
    "ui5/vizframe/app/utils/ChatApi",
    "ui5/vizframe/app/utils/ChatMessageView"
], function (
    Controller,
    Fragment,
    Button,
    HBox,
    FormattedText,
    StaticChatMock,
    ChatContextBuilder,
    ChatNavigationGuard,
    ChatTextFormat,
    ChatApi,
    ChatMessageView
) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.App", {

        _getI18nBundle: function () {
            var oComp = this.getOwnerComponent();
            var oModel = oComp && oComp.getModel("i18n");
            return oModel && oModel.getResourceBundle();
        },

        _getI18nText: function (sKey, aArgs) {
            var oBundle = this._getI18nBundle();
            return oBundle ? oBundle.getText(sKey, aArgs) : sKey;
        },

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

        _chatMessageControls: function () {
            return { HBox: HBox, FormattedText: FormattedText };
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
                tooltip:        this._getI18nText("chat.fabTooltip"),
                accessibleName: this._getI18nText("chat.fabAccessible"),
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
                    ? that._getI18nText("chat.welcomeGhPages")
                    : "";
                that._addBotMsg(
                    that._getI18nText("chat.welcome") + "<br>" +
                    sGh +
                    that._getI18nText("chat.welcomeHint")
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
            ChatApi.postChat({
                messages: this._chatHistory,
                context:  ChatContextBuilder.buildContext(this.getOwnerComponent())
            })
            .then(function (data) {
                that._hideTyping();
                if (data.error) {
                    // escape so FormattedText renders it correctly
                    that._addBotMsg("<strong>" + that._getI18nText("chat.note") + "</strong> " + ChatTextFormat.escapeHtml(String(data.error)));
                    return;
                }
                that._handleReply(data.reply || "", sText);
            })
            .catch(function (err) {
                that._hideTyping();
                that._addBotMsg("<strong>" + that._getI18nText("chat.connectionError") + "</strong> " + ChatTextFormat.escapeHtml(err.message));
            });
        },

        _handleReply: function (sReply, sLastUserMessage) {
            if (!sReply || !sReply.trim()) {
                this._addBotMsg(this._getI18nText("chat.noReply"));
                return;
            }

            var oNavResult = ChatNavigationGuard.tryNavigateFromReply({
                reply: sReply,
                lastUserMessage: sLastUserMessage,
                bundle: this._getI18nBundle()
            });
            if (oNavResult.handled) {
                if (!oNavResult.shouldNavigate) {
                    this._chatHistory.push({ role: "bot", text: this._getI18nText("chat.navHintText") });
                    this._addBotMsg(this._getI18nText("chat.navHint"));
                    return;
                }

                this._addBotMsg(this._getI18nText("chat.navigating", [oNavResult.label]));
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

            ChatMessageView.appendUserMessage(oChatMessages, sText, this._chatMessageControls());
            this._scrollToBottom();
        },

        _addBotMsg: function (sHtml) {
            var oChatMessages = this._chatById("chatMessages");
            if (!oChatMessages || oChatMessages.bIsDestroyed) { return; }

            ChatMessageView.appendBotHtml(oChatMessages, sHtml, this._chatMessageControls());
            this._scrollToBottom();
        },

        _showTyping: function () {
            var oChatMessages = this._chatById("chatMessages");
            if (!oChatMessages || oChatMessages.bIsDestroyed) { return; }

            ChatMessageView.appendTyping(oChatMessages, this._chatMessageControls());
            this._scrollToBottom();
        },

        _hideTyping: function () {
            var oChatMessages = this._chatById("chatMessages");
            if (!oChatMessages || oChatMessages.bIsDestroyed) { return; }
            ChatMessageView.removeTyping(oChatMessages);
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
