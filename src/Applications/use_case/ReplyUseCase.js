const AddReply = require('../../Domains/replies/entities/AddReply');

class ReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async addReply(commentId, threadId, userId, useCasePayload) {
    const addReply = new AddReply(useCasePayload);
    await this._threadRepository.verifyAvailabilityThread(threadId);
    await this._commentRepository.verifyAvailabilityComment(commentId, threadId);
    return this._replyRepository.addReply(commentId, userId, addReply);
  }

  async deleteReply(replyId, commentId, threadId, userId) {
    await this._threadRepository.verifyAvailabilityThread(threadId);
    await this._commentRepository.verifyAvailabilityComment(commentId, threadId);
    await this._replyRepository.verifyAvailabilityReply(replyId, commentId);
    await this._replyRepository.verifyReplyOwner(replyId, userId);
    await this._replyRepository.deleteReply(replyId);
  }
}

module.exports = ReplyUseCase;
