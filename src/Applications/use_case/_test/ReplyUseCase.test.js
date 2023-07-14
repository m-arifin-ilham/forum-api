const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const AddReply = require('../../../Domains/replies/entities/AddReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ReplyUseCase = require('../ReplyUseCase');

describe('ReplyUseCase', () => {
  describe('AddReply', () => {
    it('should orchestrating the add reply action correctly', async () => {
      // Arrange
      const useCasePayload = {
        content: 'reply content',
      };

      const userId = 'user-123';
      const threadId = 'thread-123';
      const commentId = 'comment-123';

      const mockAddedReply = new AddedReply({
        id: 'reply-123',
        content: useCasePayload.content,
        owner: userId,
      });

      /** creating dependency of use case */
      const mockReplyRepository = new ReplyRepository();
      const mockCommentRepository = new CommentRepository();
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockReplyRepository.addReply = jest.fn()
        .mockImplementation(() => Promise.resolve(mockAddedReply));
      mockCommentRepository.verifyAvailabilityComment = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockThreadRepository.verifyAvailabilityThread = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const replyUseCase = new ReplyUseCase({
        replyRepository: mockReplyRepository,
        commentRepository: mockCommentRepository,
        threadRepository: mockThreadRepository,
      });

      // Action
      const addedReply = await replyUseCase.addReply(commentId, threadId, userId, useCasePayload);

      // Assert
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: useCasePayload.content,
        owner: userId,
      }));
      expect(mockThreadRepository.verifyAvailabilityThread).toBeCalledWith(threadId);
      expect(mockCommentRepository.verifyAvailabilityComment).toBeCalledWith(commentId, threadId);
      expect(mockReplyRepository.addReply).toBeCalledWith(commentId, userId, new AddReply({
        content: useCasePayload.content,
      }));
    });
  });

  describe('DeleteReply', () => {
    it('should orchestrating the delete reply action correctly', async () => {
      // Arrange
      const replyId = 'reply-123';
      const commentId = 'comment-123';
      const threadId = 'thread-123';
      const userId = 'user-123';

      /** creating dependency of use case */
      const mockReplyRepository = new ReplyRepository();
      const mockCommentRepository = new CommentRepository();
      const mockThreadRepository = new ThreadRepository();

      /** mocking needed function */
      mockThreadRepository.verifyAvailabilityThread = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockCommentRepository.verifyAvailabilityComment = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockReplyRepository.verifyAvailabilityReply = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockReplyRepository.verifyReplyOwner = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockReplyRepository.deleteReply = jest.fn()
        .mockImplementation(() => Promise.resolve());

      /** creating use case instance */
      const replyUseCase = new ReplyUseCase({
        replyRepository: mockReplyRepository,
        commentRepository: mockCommentRepository,
        threadRepository: mockThreadRepository,
      });

      // Action
      await replyUseCase.deleteReply(replyId, commentId, threadId, userId);

      // Assert
      expect(mockThreadRepository.verifyAvailabilityThread)
        .toHaveBeenCalledWith(threadId);
      expect(mockCommentRepository.verifyAvailabilityComment)
        .toHaveBeenCalledWith(commentId, threadId);
      expect(mockReplyRepository.verifyAvailabilityReply)
        .toHaveBeenCalledWith(replyId, commentId);
      expect(mockReplyRepository.verifyReplyOwner)
        .toHaveBeenCalledWith(replyId, userId);
      expect(mockReplyRepository.deleteReply)
        .toHaveBeenCalledWith(replyId);
    });
  });
});
