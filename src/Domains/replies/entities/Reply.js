class Reply {
  constructor(payload) {
    const {
      id, content, date, username, is_delete: isDelete,
    } = payload;

    this.id = id;
    this.content = (isDelete) ? '**balasan telah dihapus**' : content;
    this.date = date;
    this.username = username;
  }
}

module.exports = Reply;
