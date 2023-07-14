const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AddReply = require('../../../Domains/replies/entities/AddReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const pool = require('../../database/postgres/pool');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist add reply with comment id and user id and return added reply correctly', async () => {
      // Arrange
      const addComment = new AddReply({
        content: 'reply content',
      });
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepository = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, owner: userId, threadId });

      // Action
      await replyRepository.addReply(commentId, userId, addComment);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
    });

    it('should return added reply correctly', async () => {
      // Arrange
      const addComment = new AddReply({
        content: 'reply content',
      });
      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const fakeIdGenerator = () => '123'; // stub!
      const replyRepository = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, owner: userId, threadId });

      // Action
      const addedReply = await replyRepository.addReply(commentId, userId, addComment);

      // Assert
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'reply content',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyAvailabilityReply function', () => {
    it('should throw NotFoundError if reply id not available', async () => {
      // Arrange
      const replyRepository = new ReplyRepositoryPostgres(pool, {});
      const replyId = 'reply-123';
      const commentId = 'comment-123';
      const threadId = 'thread-123';

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: commentId, owner: 'user-123', threadId });

      // Action and Assert
      await expect(replyRepository.verifyAvailabilityReply(replyId, commentId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if reply id not matched with corresponding comment id', async () => {
      // Arrange
      const replyRepository = new ReplyRepositoryPostgres(pool, {});
      const replyId = 'reply-123';
      const commentId = 'comment-123';
      const threadId = 'thread-123';

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: commentId, owner: 'user-123', threadId });
      await CommentsTableTestHelper.addComment({ id: 'comment-456', owner: 'user-123', threadId });
      await RepliesTableTestHelper.addReply({ id: replyId, commentId: 'comment-456', owner: 'user-123' });

      // Action and Assert
      await expect(replyRepository.verifyAvailabilityReply(replyId, commentId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError if reply id available and matched with comment id', async () => {
      // Arrange
      const replyRepository = new ReplyRepositoryPostgres(pool, {});
      const replyId = 'reply-123';
      const commentId = 'comment-123';
      const threadId = 'thread-123';

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: replyId, commentId, owner: 'user-123' });

      // Action and Assert
      await expect(replyRepository.verifyAvailabilityReply(replyId, commentId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw AuthorizationError if user id not matched with reply owner', async () => {
      // Arrange
      const replyRepository = new ReplyRepositoryPostgres(pool, {});
      const replyId = 'reply-123';
      const userId = 'user-123';

      await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'dicoding-456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userId });
      await RepliesTableTestHelper.addReply({ id: replyId, commentId: 'comment-123', owner: 'user-456' });

      // Action and Assert
      await expect(replyRepository.verifyReplyOwner(replyId, userId))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw AuthorizationError if user id matched with reply owner', async () => {
      // Arrange
      const replyRepository = new ReplyRepositoryPostgres(pool, {});
      const replyId = 'reply-123';
      const userId = 'user-123';

      await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: userId });
      await RepliesTableTestHelper.addReply({ id: replyId, commentId: 'comment-123', owner: userId });

      // Action and Assert
      await expect(replyRepository.verifyReplyOwner(replyId, userId))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('deleteReply function', () => {
    it('should soft delete reply by turning is_delete column in database into true', async () => {
      // Arrange
      const replyRepository = new ReplyRepositoryPostgres(pool, {});
      const replyId = 'reply-123';

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({ id: replyId, commentId: 'comment-123', owner: 'user-123' });
      const replyBefore = await RepliesTableTestHelper.findRepliesById(replyId);

      // Action
      await replyRepository.deleteReply(replyId);

      // Assert
      const replyAfter = await RepliesTableTestHelper.findRepliesById(replyId);
      expect(replyAfter[0].id).toEqual(replyBefore[0].id);
      expect(replyAfter[0].content).toEqual(replyBefore[0].content);
      expect(replyAfter[0].date).toEqual(replyBefore[0].date);
      expect(replyAfter[0].owner).toEqual(replyBefore[0].owner);
      expect(replyAfter[0].is_delete).toEqual(true);
      expect(replyAfter[0].comment_id).toEqual(replyBefore[0].comment_id);
    });
  });

  describe('getRepliesByCommentId function', () => {
    it('should return replies with the specific comment id correctly', async () => {
      // Arrange
      const replyRepository = new ReplyRepositoryPostgres(pool, {});
      const commentId = 'comment-123';
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'dicoding-456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-456' });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId: 'thread-123', owner: 'user-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId,
        owner: 'user-123',
        date: new Date().toISOString(),
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-456',
        commentId,
        owner: 'user-456',
        date: new Date().toISOString(),
      });
      const firstReply = await RepliesTableTestHelper.findRepliesById('reply-123');
      const secondReply = await RepliesTableTestHelper.findRepliesById('reply-456');

      // Action
      const replies = await replyRepository.getRepliesByCommentId(commentId);

      // Assert
      expect(replies).toHaveLength(2);
      expect(replies[0]).toEqual({
        id: firstReply[0].id,
        content: firstReply[0].content,
        date: firstReply[0].date,
        owner: firstReply[0].owner,
        is_delete: firstReply[0].is_delete,
      });
      expect(replies[1]).toEqual({
        id: secondReply[0].id,
        content: secondReply[0].content,
        date: secondReply[0].date,
        owner: secondReply[0].owner,
        is_delete: secondReply[0].is_delete,
      });
    });
  });
});
