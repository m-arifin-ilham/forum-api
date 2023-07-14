const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const pool = require('../../database/postgres/pool');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist add comment with thread id and owner id and return added comment correctly', async () => {
      // Arrange
      const addComment = new AddComment({
        content: 'comment content',
      });
      const userId = 'user-123';
      const threadId = 'thread-123';
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId });

      // Action
      await commentRepository.addComment(threadId, userId, addComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      // Arrange
      const addComment = new AddComment({
        content: 'comment content',
      });
      const userId = 'user-123';
      const threadId = 'thread-123';
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId });

      // Action
      const addedComment = await commentRepository.addComment(threadId, userId, addComment);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'comment content',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyAvailabilityComment function', () => {
    it('should throw NotFoundError if comment id not available', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, {});
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-123' });

      // Action and Assert
      await expect(commentRepository.verifyAvailabilityComment(commentId, threadId))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if comment id not matched with corresponding thread id', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, {});
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId: 'thread-456', owner: 'user-123' });

      // Action and Assert
      await expect(commentRepository.verifyAvailabilityComment(commentId, threadId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError if comment id available and matched with thread id', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, {});
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: 'user-123' });

      // Action and Assert
      await expect(commentRepository.verifyAvailabilityComment(commentId, threadId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw AuthorizationError if user id not matched with comment owner', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, {});
      const commentId = 'comment-123';
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'dicoding-456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: userId });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId: 'thread-123', owner: 'user-456' });

      // Action and Assert
      await expect(commentRepository.verifyCommentOwner(commentId, userId))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw AuthorizationError if user id matched with comment owner', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, {});
      const commentId = 'comment-123';
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'dicoding-456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-456' });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId: 'thread-123', owner: userId });

      // Action and Assert
      await expect(commentRepository.verifyCommentOwner(commentId, userId))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment by turning is_delete column in database into true', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, {});
      const commentId = 'comment-123';
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'dicoding-456' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-456' });
      await CommentsTableTestHelper.addComment({ id: commentId, threadId: 'thread-123', owner: 'user-123' });
      const commentsBefore = await CommentsTableTestHelper.findCommentsById(commentId);

      // Action
      await commentRepository.deleteComment(commentId);

      // Assert
      const commentsAfter = await CommentsTableTestHelper.findCommentsById(commentId);
      expect(commentsAfter[0].id).toEqual(commentsBefore[0].id);
      expect(commentsAfter[0].owner).toEqual(commentsBefore[0].owner);
      expect(commentsAfter[0].date).toEqual(commentsBefore[0].date);
      expect(commentsAfter[0].content).toEqual(commentsBefore[0].content);
      expect(commentsAfter[0].is_delete).toEqual(true);
      expect(commentsAfter[0].thread_id).toEqual(commentsBefore[0].thread_id);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments with the specific thread id correctly', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, {});
      const threadId = 'thread-123';
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'dicoding-456' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-456' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId,
        owner: 'user-123',
        date: new Date().toISOString(),
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        threadId,
        owner: 'user-456',
        date: new Date().toISOString(),
      });
      const firstComment = await CommentsTableTestHelper.findCommentsById('comment-123');
      const secondComment = await CommentsTableTestHelper.findCommentsById('comment-456');

      // Action
      const comments = await commentRepository.getCommentsByThreadId(threadId);

      // Assert
      expect(comments).toHaveLength(2);
      expect(comments[0]).toEqual({
        id: firstComment[0].id,
        owner: firstComment[0].owner,
        date: firstComment[0].date,
        content: firstComment[0].content,
        is_delete: firstComment[0].is_delete,
      });
      expect(comments[1]).toEqual({
        id: secondComment[0].id,
        owner: secondComment[0].owner,
        date: secondComment[0].date,
        content: secondComment[0].content,
        is_delete: secondComment[0].is_delete,
      });
    });
  });
});
