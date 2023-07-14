const Reply = require('../Reply');

describe('a Reply entities', () => {
  it('should create reply object correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-BErOXUSefjwWGW1Z10Ihk',
      content: 'reply content',
      date: '2021-08-08T07:59:48.766Z',
      username: 'johndoe',
      is_delete: false,
    };

    // Action
    const reply = new Reply(payload);

    // Assert
    expect(reply.id).toEqual(payload.id);
    expect(reply.content).toEqual(payload.content);
    expect(reply.date).toEqual(payload.date);
    expect(reply.username).toEqual(payload.username);
  });

  it('should create reply object with appropriate content message if reply has been deleted', () => {
    // Arrange
    const payload = {
      id: 'reply-BErOXUSefjwWGW1Z10Ihk',
      content: 'reply content',
      date: '2021-08-08T07:59:48.766Z',
      username: 'johndoe',
      is_delete: true,
    };

    // Action
    const reply = new Reply(payload);

    // Assert
    expect(reply.id).toEqual(payload.id);
    expect(reply.content).toEqual('**balasan telah dihapus**');
    expect(reply.date).toEqual(payload.date);
    expect(reply.username).toEqual(payload.username);
  });
});
