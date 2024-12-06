const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/comments', { useNewUrlParser: true, useUnifiedTopology: true });

const CommentSchema = new mongoose.Schema({
  text: String,
  likes: { type: Number, default: 0 },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
});

const Comment = mongoose.model('Comment', CommentSchema);

app.get('/api/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ parentId: null }).populate('replies');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { text } = req.body;
    const newComment = new Comment({ text });
    await newComment.save();
    const comments = await Comment.find({ parentId: null }).populate('replies');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error posting comment', error: error.message });
  }
});

app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Comment ID' });
    }
    await Comment.findByIdAndUpdate(id, { $inc: { likes: 1 } });
    const comments = await Comment.find({ parentId: null }).populate('replies');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error liking comment', error: error.message });
  }
});

app.post('/api/comments/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const newReply = new Comment({ text, parentId: id });
    await newReply.save();
    await Comment.findByIdAndUpdate(id, { $push: { replies: newReply._id } });
    const comments = await Comment.find({ parentId: null }).populate('replies');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error posting reply', error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
