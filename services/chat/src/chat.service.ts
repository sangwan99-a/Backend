export class ChatService {
  private messages: { id: string; content: string; timestamp: string }[] = [];

  getMessages() {
    return this.messages;
  }

  addMessage(content: string) {
    const message = { id: (this.messages.length + 1).toString(), content, timestamp: new Date().toISOString() };
    this.messages.push(message);
    return message;
  }
}