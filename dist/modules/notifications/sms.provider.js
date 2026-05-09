"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSmsProvider = void 0;
class MockSmsProvider {
    async send(input) {
        // eslint-disable-next-line no-console
        console.log(`[mock-sms] to=${input.to} message=${input.message}`);
        return { providerMessageId: `mock-${Date.now()}` };
    }
}
exports.MockSmsProvider = MockSmsProvider;
