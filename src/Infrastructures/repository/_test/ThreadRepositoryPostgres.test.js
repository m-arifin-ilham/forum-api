const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist add thread with owner id and return added thread correctly', async () => {
      // Arrange
      const addThread = new AddThread({
        title: 'thread title',
        body: 'thread body',
      });
      const userId = 'user-123';
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
      await UsersTableTestHelper.addUser({ id: userId });

      // Action
      await threadRepositoryPostgres.addThread(userId, addThread);

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(1);
    });

    it('should return added thread correctly', async () => {
      // Arrange
      const addThread = new AddThread({
        title: 'thread title',
        body: 'thread body',
      });
      const userId = 'user-123';
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
      await UsersTableTestHelper.addUser({ id: userId });

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(userId, addThread);

      // Assert
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: 'thread title',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyAvailabilityThread function', () => {
    it('should throw NotFoundError if thread id not available', async () => {
      // Arrange
      const threadRepository = new ThreadRepositoryPostgres(pool, {});
      const threadId = 'thread-123';

      // Action and Assert
      await expect(threadRepository.verifyAvailabilityThread(threadId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError if thread id available', async () => {
      // Arrange
      const threadRepository = new ThreadRepositoryPostgres(pool, {});
      const threadId = 'thread-123';
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });

      // Action and Assert
      await expect(threadRepository.verifyAvailabilityThread(threadId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('getThreadById function', () => {
    it('should return detailed thread in thread table correctly', async () => {
      // Arrange
      const threadRepository = new ThreadRepositoryPostgres(pool, {});
      const threadId = 'thread-123';

      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: 'user-123' });
      const threadHelper = await ThreadsTableTestHelper.findThreadsById(threadId);

      // Action
      const thread = await threadRepository.getThreadById(threadId);

      // Assert
      expect(thread).toEqual([{
        id: threadHelper[0].id,
        title: threadHelper[0].title,
        body: threadHelper[0].body,
        date: threadHelper[0].date,
        owner: threadHelper[0].owner,
      }]);
    });
  });
});
