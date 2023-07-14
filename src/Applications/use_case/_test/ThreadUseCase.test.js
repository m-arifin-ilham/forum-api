const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const UserRepository = require('../../../Domains/users/UserRepository');
const ThreadUseCase = require('../ThreadUseCase');
const Comment = require('../../../Domains/comments/entities/Comment');
const Reply = require('../../../Domains/replies/entities/Reply');
const Thread = require('../../../Domains/threads/entities/Thread');

describe('ThreadUseCase', () => {
  describe('AddThread', () => {
    it('should orchestrating the add thread action correctly', async () => {
      // Arrange
      const useCasePayload = {
        title: 'thread title',
        body: 'thread body',
      };

      const userId = 'user-123';

      const mockAddedThread = new AddedThread({
        id: 'thread-123',
        title: useCasePayload.title,
        owner: userId,
      });

      /** creating dependency of use case */
      const mockReplyRepository = new ReplyRepository();
      const mockCommentRepository = new CommentRepository();
      const mockThreadRepository = new ThreadRepository();
      const mockUserRepository = new UserRepository();

      /** mocking needed function */
      mockThreadRepository.addThread = jest.fn(() => Promise.resolve(mockAddedThread));

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({
        replyRepository: mockReplyRepository,
        commentRepository: mockCommentRepository,
        threadRepository: mockThreadRepository,
        userRepository: mockUserRepository,
      });

      // Action
      const addedThread = await threadUseCase.addThread(userId, useCasePayload);

      // Assert
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: useCasePayload.title,
        owner: userId,
      }));
      expect(mockThreadRepository.addThread).toBeCalledWith(userId, new AddThread({
        title: useCasePayload.title,
        body: useCasePayload.body,
      }));
    });
  });

  describe('ShowDetailThread', () => {
    it('should orchestrating the show detail of a thread action correctly', async () => {
      // Arrange
      const threadId = 'thread-AqVg2b9JyQXR6wSQ2TmH4';

      /** thread, comments and replies */
      const thread = {
        id: 'thread-h_2FkLZhtgBKY2kh4CC02',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        owner: 'dicoding',
      };
      const firstComment = {
        id: 'comment-_pby2_tmXV6bcvcdev8xk',
        owner: 'johndoe',
        date: '2021-08-08T07:22:33.555Z',
        content: 'sebuah comment',
        is_delete: false,
      };
      const firstReply = {
        id: 'reply-BErOXUSefjwWGW1Z10Ihk',
        content: 'sebuah balasan',
        date: '2021-08-08T07:59:48.766Z',
        owner: 'johndoe',
        is_delete: true,
      };
      const secondReply = {
        id: 'reply-xNBtm9HPR-492AeiimpfN',
        content: 'sebuah balasan',
        date: '2021-08-08T08:07:01.522Z',
        owner: 'dicoding',
        is_delete: false,
      };
      const secondComment = {
        id: 'comment-yksuCoxM2s4MMrZJO-qVD',
        owner: 'dicoding',
        date: '2021-08-08T07:26:21.338Z',
        content: 'sebuah comment',
        is_delete: true,
      };

      /** creating dependency of use case */
      const mockReplyRepository = new ReplyRepository();
      const mockCommentRepository = new CommentRepository();
      const mockThreadRepository = new ThreadRepository();
      const mockUserRepository = new UserRepository();

      /** mocking needed function */
      mockThreadRepository.verifyAvailabilityThread = jest.fn()
        .mockImplementation(() => Promise.resolve());
      mockCommentRepository.getCommentsByThreadId = jest.fn()
        .mockImplementation(() => Promise.resolve([firstComment, secondComment]));
      mockUserRepository.getUsernameById = jest.fn()
        .mockImplementation((usernameId) => Promise.resolve(usernameId));
      mockReplyRepository.getRepliesByCommentId = jest.fn()
        .mockImplementation((commentId) => {
          if (commentId === 'comment-_pby2_tmXV6bcvcdev8xk') return Promise.resolve([firstReply, secondReply]);
          if (commentId === 'comment-yksuCoxM2s4MMrZJO-qVD') return Promise.resolve([]);
          return Promise.resolve();
        });
      mockThreadRepository.getThreadById = jest.fn()
        .mockImplementation(() => Promise.resolve([thread]));

      /** creating use case instance */
      const threadUseCase = new ThreadUseCase({
        replyRepository: mockReplyRepository,
        commentRepository: mockCommentRepository,
        threadRepository: mockThreadRepository,
        userRepository: mockUserRepository,
      });

      // Action
      const threadDetail = await threadUseCase.showDetailThread(threadId);

      // Assert
      expect(threadDetail).toEqual(new Thread({
        id: 'thread-h_2FkLZhtgBKY2kh4CC02',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comments: [
          new Comment({
            id: 'comment-_pby2_tmXV6bcvcdev8xk',
            username: 'johndoe',
            date: '2021-08-08T07:22:33.555Z',
            replies: [
              new Reply({
                id: 'reply-BErOXUSefjwWGW1Z10Ihk',
                content: '**balasan telah dihapus**',
                date: '2021-08-08T07:59:48.766Z',
                username: 'johndoe',
                is_delete: true,
              }),
              new Reply({
                id: 'reply-xNBtm9HPR-492AeiimpfN',
                content: 'sebuah balasan',
                date: '2021-08-08T08:07:01.522Z',
                username: 'dicoding',
                is_delete: false,
              }),
            ],
            content: 'sebuah comment',
            is_delete: false,
          }),
          new Comment({
            id: 'comment-yksuCoxM2s4MMrZJO-qVD',
            username: 'dicoding',
            date: '2021-08-08T07:26:21.338Z',
            replies: [],
            content: '**komentar telah dihapus**',
            is_delete: true,
          }),
        ],
      }));
      expect(mockThreadRepository.verifyAvailabilityThread).toBeCalledWith(threadId);
      expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
      expect(mockReplyRepository.getRepliesByCommentId).toBeCalledTimes(2);
      expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-_pby2_tmXV6bcvcdev8xk');
      expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-yksuCoxM2s4MMrZJO-qVD');
      expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
      expect(mockUserRepository.getUsernameById).toBeCalledTimes(5);
      expect(mockUserRepository.getUsernameById).toBeCalledWith('dicoding');
      expect(mockUserRepository.getUsernameById).toBeCalledWith('johndoe');
    });
  });
});
