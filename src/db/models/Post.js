// This is a temporary schema for the Post model. We will replace this with a more complex schema in a following sprint.
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    }
});

const Post = mongoose.model('Post', postSchema);
export default Post;