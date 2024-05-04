import { removeItem, spamItem, reportItem, approveItem } from '../../src/services/communityQueueService.js';
import { Post } from '../../src/db/models/Post.js';
import { Comment } from '../../src/db/models/Comment.js';
import { Community } from '../../src/db/models/Community.js';

jest.mock('../../src/db/models/Post.js');
jest.mock('../../src/db/models/Comment.js');
jest.mock('../../src/db/models/Community.js');

describe('removeItem', () => {
    it('should return error for invalid input parameters', async () => {
      const result = await removeItem(123, 'post', 'user1');
      expect(result).toEqual({ err: { status: 400, message: 'Invalid input parameters' } });
    });
  
    it('should return error for invalid item type', async () => {
      const result = await removeItem('123', 'invalid', 'user1');
      expect(result).toEqual({ err: { status: 400, message: 'Invalid item type' } });
    });
  
    it('should return error if post not found', async () => {
      Post.findById.mockResolvedValue(null);
      const result = await removeItem('123', 'post', 'user1');
      expect(result).toEqual({ err: { status: 404, message: 'Post not found' } });
    });
  
    it('should return error if post already removed', async () => {
      Post.findById.mockResolvedValue({ moderator_details: { removed_flag: true } });
      const result = await removeItem('123', 'post', 'user1');
      expect(result).toEqual({ err: { status: 400, message: 'Post already removed' } });
    });
  
    it('should return error if comment not found', async () => {
      Comment.findById.mockResolvedValue(null);
      const result = await removeItem('123', 'comment', 'user1');
      expect(result).toEqual({ err: { status: 404, message: 'Comment not found' } });
    });
  
    it('should return error if comment already removed', async () => {
      Comment.findById.mockResolvedValue({ moderator_details: { removed_flag: true } });
      const result = await removeItem('123', 'comment', 'user1');
      expect(result).toEqual({ err: { status: 400, message: 'Comment already removed' } });
    });
  
    it('should return error for invalid removal reason', async () => {
      Post.findById.mockResolvedValue({ moderator_details: { removed_flag: false } });
      Community.findOne.mockResolvedValue(null);
      const result = await removeItem('123', 'post', 'user1', 'invalid');
      expect(result).toEqual({ err: { status: 400, message: 'Invalid removal reason' } });
    });
  
    it('should remove post successfully', async () => {
      Post.findById.mockResolvedValue({ moderator_details: { removed_flag: false } });
      Post.findByIdAndUpdate.mockResolvedValue(true);
      const result = await removeItem('123', 'post', 'user1');
      expect(result).toEqual({ message: 'Item removed successfully' });
    });
  
    it('should remove comment successfully', async () => {
      Comment.findById.mockResolvedValue({ moderator_details: { removed_flag: false } });
      Comment.findByIdAndUpdate.mockResolvedValue(true);
      const result = await removeItem('123', 'comment', 'user1');
      expect(result).toEqual({ message: 'Item removed successfully' });
    });
  
    it('should return error for unexpected error', async () => {
        Post.findById.mockRejectedValue(new Error('Unexpected error'));
        const result = await removeItem('123', 'post', 'user1');
        expect(result.err).toHaveProperty('status');
        expect(result.err).toHaveProperty('message');
      });
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  describe('reportItem', () => {
    it('should return error for invalid input parameters', async () => {
      const result = await reportItem(123, 'post', 'user1');
      expect(result).toEqual({ err: { status: 400, message: 'Invalid input parameters' } });
    });
  
    it('should return error for invalid item type', async () => {
      const result = await reportItem('123', 'invalid', 'user1');
      expect(result).toEqual({ err: { status: 400, message: 'Invalid item type' } });
    });
  
    it('should return error if post not found', async () => {
      Post.findById.mockResolvedValue(null);
      const result = await reportItem('123', 'post', 'user1');
      expect(result).toEqual({ err: { status: 404, message: 'Post not found' } });
    });
  
    it('should return error if post already reported', async () => {
      Post.findById.mockResolvedValue({ moderator_details: { reported_flag: true } });
      const result = await reportItem('123', 'post', 'user1');
      expect(result).toEqual({ err: { status: 400, message: 'Post already reported' } });
    });
  
    it('should return error if comment not found', async () => {
      Comment.findById.mockResolvedValue(null);
      const result = await reportItem('123', 'comment', 'user1');
      expect(result).toEqual({ err: { status: 404, message: 'Comment not found' } });
    });
  
    it('should return error if comment already reported', async () => {
      Comment.findById.mockResolvedValue({ moderator_details: { reported_flag: true } });
      const result = await reportItem('123', 'comment', 'user1');
      expect(result).toEqual({ err: { status: 400, message: 'Comment already reported' } });
    });
  
    it('should report post successfully', async () => {
      Post.findById.mockResolvedValue({ moderator_details: { reported_flag: false } });
      Post.findByIdAndUpdate.mockResolvedValue(true);
      const result = await reportItem('123', 'post', 'user1');
      expect(result).toEqual({ message: 'Item reported successfully' });
    });
  
    it('should report comment successfully', async () => {
      Comment.findById.mockResolvedValue({ moderator_details: { reported_flag: false } });
      Comment.findByIdAndUpdate.mockResolvedValue(true);
      const result = await reportItem('123', 'comment', 'user1');
      expect(result).toEqual({ message: 'Item reported successfully' });
    });
  
    it('should return error for unexpected error', async () => {
      Post.findById.mockRejectedValue(new Error('Unexpected error'));
      const result = await reportItem('123', 'post', 'user1');
      expect(result.err).toHaveProperty('status');
      expect(result.err).toHaveProperty('message');
    });
  });