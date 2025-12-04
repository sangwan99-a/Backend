import { ChatService } from '../src/chat.service';

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
  });

  it('should add a message', () => {
    const message = chatService.addMessage('Test message');
    expect(message.content).toBe('Test message');
    expect(chatService.getMessages()).toHaveLength(1);
  });

  it('should retrieve messages', () => {
    chatService.addMessage('Message 1');
    chatService.addMessage('Message 2');
    const messages = chatService.getMessages();
    expect(messages).toHaveLength(2);
  });
});