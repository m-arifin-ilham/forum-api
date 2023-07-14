const CommentRepository = require('../../../Domains/comments/CommentRepository');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentUseCase = require('../CommentUseCase');

describe('CommentUseCase', () => {
  describe('AddComment', () => {
    it('should orchestrating the add comment action correctly', async () => {
      // Arrange
      const useCasePayload = {
        content: 'comment content',
      };

      const userId = 'user-123';
      const threadId = 'thread-123';

      const mockAddedComment = new AddedComment({
        id: 'comment-123',
        content: useCasePayload.content,
        owner: userId,
      });

      /** creating dependency of use case */
      const mockCommentRepository = new CommentRepository();
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockCommentRepository.addComment = jest.fn()
        .mockImplementation(() => Promise.resolve(mockAddedComment));
      mockThreadRepository.verifyAvailabilityThread = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const commentUseCase = new CommentUseCase({
        commentRepository: mockCommentRepository,
        threadRepository: mockThreadRepository,
      });

      // Action
      const addedComment = await commentUseCase.addComment(threadId, userId, useCasePayload);

      // Assert
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: useCasePayload.content,
        owner: userId,
      }));
      expect(mockThreadRepository.verifyAvailabilityThread).toBeCalledWith(threadId);
      expect(mockCommentRepository.addComment).toBeCalledWith(threadId, userId, new AddComment({
        content: useCasePayload.content,
      }));
    });
  });

  describe('DeleteComment', () => {
    it('should orchestrating the delete comment action correctly', async () => {
      // Arrange
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      const userId = 'user-123';

      /** creating dependency of use case */
      const mockCommentRepository = new CommentRepository();
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.verifyAvailabilityThread = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockCommentRepository.verifyAvailabilityComment = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockCommentRepository.verifyCommentOwner = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockCommentRepository.deleteComment = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const commentUseCase = new CommentUseCase({
        commentRepository: mockCommentRepository,
        threadRepository: mockThreadRepository,
      });

      // Action
      await commentUseCase.deleteComment(commentId, threadId, userId);

      // Assert
      expect(mockThreadRepository.verifyAvailabilityThread)
        .toHaveBeenCalledWith(threadId);
      expect(mockCommentRepository.verifyAvailabilityComment)
        .toHaveBeenCalledWith(commentId, threadId);
      expect(mockCommentRepository.verifyCommentOwner)
        .toHaveBeenCalledWith(commentId, userId);
      expect(mockCommentRepository.deleteComment)
        .toHaveBeenCalledWith(commentId);
    });
  });
});
