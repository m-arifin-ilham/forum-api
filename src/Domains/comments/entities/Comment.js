class Comment {
  constructor(payload) {
    const {
      id, username, date, replies, content, is_delete: isDelete,
    } = payload;

    this.id = id;
    this.username = username;
    this.date = date;
    this.replies = replies;
    this.content = (isDelete) ? '**komentar telah dihapus**' : content;
  }
}

module.exports = Comment;
