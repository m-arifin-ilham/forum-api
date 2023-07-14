const AddThread = require('../../Domains/threads/entities/AddThread');
const Comment = require('../../Domains/comments/entities/Comment');
const Reply = require('../../Domains/replies/entities/Reply');
const Thread = require('../../Domains/threads/entities/Thread');

class ThreadUseCase {
  constructor({
    replyRepository, commentRepository, threadRepository, userRepository,
  }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
    this._userRepository = userRepository;

    this.addingUsername = this.addingUsername.bind(this);
  }

  async addThread(userId, useCasePayload) {
    const addThread = new AddThread(useCasePayload);
    return this._threadRepository.addThread(userId, addThread);
  }

  async showDetailThread(threadId) {
    await this._threadRepository.verifyAvailabilityThread(threadId);

    const rawComments = await this._commentRepository.getCommentsByThreadId(threadId);
    const adjustedRawComments = await this.addingUsername(rawComments);

    const comments = await Promise.all(adjustedRawComments.map(async (comment) => {
      const rawReplies = await this._replyRepository.getRepliesByCommentId(comment.id);
      const adjustedRawReplies = await this.addingUsername(rawReplies);
      return new Comment({
        ...comment,
        replies: await Promise.all(adjustedRawReplies.map(async (reply) => new Reply(reply))),
      });
    }));

    const thread = await this._threadRepository.getThreadById(threadId);
    const adjustedThread = await this.addingUsername(thread);
    return new Thread({ ...adjustedThread[0], comments });
  }

  async addingUsername(array) {
    if (array.length !== 0) {
      const adjustedArray = await Promise.all(array.map(async (object) => ({
        ...object,
        username: await this._userRepository.getUsernameById(object.owner),
      })));
      return adjustedArray;
    }
    return [];
  }
}

module.exports = ThreadUseCase;
