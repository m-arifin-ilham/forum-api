const AddComment = require('../../Domains/comments/entities/AddComment');

class CommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async addComment(threadId, userId, useCasePayload) {
    const addComment = new AddComment(useCasePayload);
    await this._threadRepository.verifyAvailabilityThread(threadId);
    return this._commentRepository.addComment(threadId, userId, addComment);
  }

  async deleteComment(commentId, threadId, userId) {
    await this._threadRepository.verifyAvailabilityThread(threadId);
    await this._commentRepository.verifyAvailabilityComment(commentId, threadId);
    await this._commentRepository.verifyCommentOwner(commentId, userId);
    await this._commentRepository.deleteComment(commentId);
  }
}

module.exports = CommentUseCase;
