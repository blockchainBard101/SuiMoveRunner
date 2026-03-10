"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
class BaseController {
    state;
    webview;
    constructor(state, webview) {
        this.state = state;
        this.webview = webview;
    }
    postMessage(command, data) {
        this.webview.postMessage({ command, ...data });
    }
    setStatus(message) {
        this.postMessage("set-status", { message });
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=BaseController.js.map