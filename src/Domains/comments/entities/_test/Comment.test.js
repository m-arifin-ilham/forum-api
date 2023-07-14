const Comment = require('../Comment');

describe('a Comment entities', () => {
  it('should create comment object correctly', () => {
    // Arrange
    const payload = {
      id: 'comment-q_0uToswNf6i24RDYZJI3',
      username: 'dicoding',
      date: '2021-08-08T07:59:18.982Z',
      replies: [],
      content: 'sebuah comment',
      is_delete: false,
    };

    // Action
    const comment = new Comment(payload);

    // Assert
    expect(comment.id).toEqual(payload.id);
    expect(comment.username).toEqual(payload.username);
    expect(comment.date).toEqual(payload.date);
    expect(comment.replies).toEqual(payload.replies);
    expect(comment.content).toEqual(payload.content);
  });

  it('should create comment object with appropriate content message if comment has been deleted', () => {
    // Arrange
    const payload = {
      id: 'comment-q_0uToswNf6i24RDYZJI3',
      username: 'dicoding',
      date: '2021-08-08T07:59:18.982Z',
      replies: [],
      content: 'sebuah comment',
      is_delete: true,
    };

    // Action
    const comment = new Comment(payload);

    // Assert
    expect(comment.id).toEqual(payload.id);
    expect(comment.username).toEqual(payload.username);
    expect(comment.date).toEqual(payload.date);
    expect(comment.replies).toEqual(payload.replies);
    expect(comment.content).toEqual('**komentar telah dihapus**');
  });
});
