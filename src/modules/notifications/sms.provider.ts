export type SmsSendInput = {
  to: string;
  message: string;
};

export type SmsSendResult = {
  providerMessageId?: string;
};

export interface SmsProvider {
  send(input: SmsSendInput): Promise<SmsSendResult>;
}

export class MockSmsProvider implements SmsProvider {
  async send(input: SmsSendInput): Promise<SmsSendResult> {
    // eslint-disable-next-line no-console
    console.log(`[mock-sms] to=${input.to} message=${input.message}`);
    return { providerMessageId: `mock-${Date.now()}` };
  }
}

