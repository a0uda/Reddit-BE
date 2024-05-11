import { Post } from '../../src/db/models/Post.js'
import { scheduledPost } from '../../src/db/models/scheduledPosts.js'
import { postScheduledPost, getScheduledPosts, editScheduledPost, submitScheduledPost } from '../../src/services/communityScheduledPostsService.js'

jest.mock('../../src/db/models/Post.js')
jest.mock('../../src/db/models/scheduledPosts.js')

describe('postScheduledPost', () => {
  it('should return an error if finding the scheduled post fails', async () => {
    scheduledPost.findById.mockRejectedValue(new Error('Find error'));
    const result = await postScheduledPost('post1');
    expect(result).toEqual({ err: { status: 500, message: 'Find error' } });
  });

  it('should return an error if saving the post fails', async () => {
    scheduledPost.findById.mockResolvedValue({ _doc: { scheduling_details: { repetition_option: 'none' } } });
    Post.mockImplementation(() => {
      return { save: jest.fn().mockRejectedValue(new Error('Save error')) };
    });
    const result = await postScheduledPost('post1');
    expect(result).toEqual({ err: { status: 500, message: 'Save error' } });
  });

  it('should return an error if deleting the scheduled post fails', async () => {
    scheduledPost.findById.mockResolvedValue({ _doc: { scheduling_details: { repetition_option: 'none' } } });
    Post.mockImplementation(() => {
      return { save: jest.fn().mockResolvedValue({ title: 'Post1' }) };
    });
    scheduledPost.deleteOne.mockRejectedValue(new Error('Delete error'));
    const result = await postScheduledPost('post1');
    expect(result).toEqual({ err: { status: 500, message: 'Delete error' } });
  });

  it('should return a success message if the post is posted successfully', async () => {
    scheduledPost.findById.mockResolvedValue({ _doc: { scheduling_details: { repetition_option: 'none' } } });
    Post.mockImplementation(() => {
      return { save: jest.fn().mockResolvedValue({ title: 'Post1', created_at: Date.now() }) };
    });
    scheduledPost.deleteOne.mockResolvedValue({});
    const result = await postScheduledPost('post1');
    expect(result.successMessage).toContain('Post with title Post1 posted successfully on');
  });
});

describe('getScheduledPosts', () => {
  const mockPosts = [
    { scheduling_details: { repetition_option: 'none' } },
    { scheduling_details: { repetition_option: 'daily' } },
    { scheduling_details: { repetition_option: 'weekly' } },
    { scheduling_details: { repetition_option: 'none' } },
  ];

  beforeEach(() => {
    scheduledPost.find.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockImplementation(() => mockPosts),
    }));
  });

  it('should return recurring and non-recurring posts', async () => {
    const result = await getScheduledPosts('community1');
    expect(result).toEqual({
      recurring_posts: [
        { scheduling_details: { repetition_option: 'daily' } },
        { scheduling_details: { repetition_option: 'weekly' } },
      ],
      non_recurring_posts: [
        { scheduling_details: { repetition_option: 'none' } },
        { scheduling_details: { repetition_option: 'none' } },
      ],
    });
  });

  it('should return an empty array for recurring and non-recurring posts if no posts are found', async () => {
    scheduledPost.find.mockReset();
    scheduledPost.find.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockImplementation(() => []),
    }));
    const result = await getScheduledPosts('community1');
    expect(result).toEqual({
      recurring_posts: [],
      non_recurring_posts: [],
    });
  });
});