import { getRemovedItems } from '../src/services/communityQueue.js';
import { Post } from '../src/db/models/Post.js';
import { Comment } from '../src/db/models/Comment.js';

describe('getRemovedItems', () => {
    it('should return an error when input parameters are invalid', async () => {
        const result = await getRemovedItems(123, 'newest first', 'posts');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid input parameters' } });
    });

    it('should return an error when time filter is invalid', async () => {
        const result = await getRemovedItems('community', 'invalid filter', 'posts');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid time filter' } });
    });

    it('should return an error when posts or comments value is invalid', async () => {
        const result = await getRemovedItems('community', 'newest first', 'invalid value');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid posts or comments value' } });
    });

    it('should return removed posts sorted by creation date', async () => {
        // Mock the Post model's find method
        // We're creating an array of mock posts that we want our mocked Post.find method to return.
        const mockPosts = [
            { created_at: new Date('2022-01-01'), moderator_details: { removed_flag: true, spammed_flag: false } },
            { created_at: new Date('2022-01-03'), moderator_details: { removed_flag: false, spammed_flag: true } },
            { created_at: new Date('2022-01-02'), moderator_details: { removed_flag: true, spammed_flag: true } },
        ];
        // Here we're replacing the real Post.find method with a jest mock function.
        // This mock function returns an object with a sort method, which in turn returns a promise that resolves to our mock posts.
        // This way, when our function under test calls Post.find().sort(), it will receive the mock posts.
        Post.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockPosts)
        });
        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Posts';
        const result = await getRemovedItems(communityName, timeFilter, postsOrComments);

        // Here we're asserting that Post.find was called with the expected query object.
        expect(Post.find).toHaveBeenCalledWith({
            $or: [
                { 'moderator_details.removed_flag': true },
                { 'moderator_details.spammed_flag': true }
            ],
            community_name: communityName
        });

        // Check if the result contains the expected posts, sorted by creation date
        // We're sorting the mock posts by creation date and asserting that the result equals this sorted array.
        const expectedItems = mockPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual(expectedItems);
    });

    it('should return removed comments sorted by creation date', async () => {
        // Mock the Comment model's find method
        const mockComments = [
            { created_at: new Date('2022-01-04'), moderator_details: { removed_flag: false, spammed_flag: true } },
            { created_at: new Date('2022-01-05'), moderator_details: { removed_flag: true, spammed_flag: false } },
            { created_at: new Date('2022-01-06'), moderator_details: { removed_flag: true, spammed_flag: true } },
        ];
        Comment.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockComments)
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Comments';
        const result = await getRemovedItems(communityName, timeFilter, postsOrComments);

        // Check if Comment.find was called with the correct arguments
        console.log(Comment.find.mock.calls);
        expect(Comment.find).toHaveBeenCalledWith({
            $or: [
                { 'moderator_details.removed_flag': true },
                { 'moderator_details.spammed_flag': true }
            ],
            community_name: communityName
        });

        // Check if the result contains the expected comments, sorted by creation date
        const expectedItems = mockComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual(expectedItems);
    });

    it('should return removed posts and comments sorted by creation date', async () => {
        // Mock the Post model's find method
        const mockPosts = [
            { created_at: new Date('2022-01-01'), moderator_details: { removed_flag: true, spammed_flag: false } },
            { created_at: new Date('2022-01-03'), moderator_details: { removed_flag: false, spammed_flag: true } },
            { created_at: new Date('2022-01-02'), moderator_details: { removed_flag: true, spammed_flag: true } },
        ];
        Post.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockPosts)
        });

        // Mock the Comment model's find method
        const mockComments = [
            { created_at: new Date('2022-01-04'), moderator_details: { removed_flag: false, spammed_flag: true } },
            { created_at: new Date('2022-01-05'), moderator_details: { removed_flag: true, spammed_flag: false } },
            { created_at: new Date('2022-01-06'), moderator_details: { removed_flag: true, spammed_flag: true } },
        ];
        Comment.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockComments)
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Posts and Comments';
        const result = await getRemovedItems(communityName, timeFilter, postsOrComments);

        // Check if Post.find and Comment.find were called with the correct arguments
        const expectedQuery = {
            $or: [
                { 'moderator_details.removed_flag': true },
                { 'moderator_details.spammed_flag': true }
            ],
            community_name: communityName
        };
        expect(Post.find).toHaveBeenCalledWith(expectedQuery);
        expect(Comment.find).toHaveBeenCalledWith(expectedQuery);

        // Check if the result contains the expected posts and comments, sorted by creation date
        const expectedItems = [...mockPosts, ...mockComments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual(expectedItems);
    });

    it('should handle errors when fetching posts', async () => {
        // Mock the Post model's find method to throw an error
        Post.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Error fetching posts'))
        });

        // Mock the Comment model's find method to throw an error
        Comment.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Error fetching comments'))
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'posts'; // Corrected value

        try {
            // Call the function and expect an error
            const result = await getRemovedItems(communityName, timeFilter, postsOrComments);
        } catch (result) {
            // Check if the result contains an error object
            expect(result).toHaveProperty('err');
            expect(result.err).toHaveProperty('status', 500);
            expect(result.err.message).toBeDefined();
        }

        expect(Post.find).toHaveBeenCalled();
        expect(Comment.find).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching comments', async () => {
        // Mock the Post model's find method to throw an error
        Post.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Error fetching posts'))
        });

        // Mock the Comment model's find method to throw an error
        Comment.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Error fetching comments'))
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'comments'; // Corrected value

        try {
            // Call the function and expect an error
            const result = await getRemovedItems(communityName, timeFilter, postsOrComments);
        } catch (result) {
            // Check if the result contains an error object
            expect(result).toHaveProperty('err');
            expect(result.err).toHaveProperty('status', 500);
            expect(result.err.message).toBeDefined();
        }

        expect(Post.find).not.toHaveBeenCalled();
        expect(Comment.find).toHaveBeenCalled();
    });

    it('should handle errors when fetching posts and comments', async () => {
        // Mock the Post model's find method to throw an error
        Post.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Error fetching posts'))
        });

        // Mock the Comment model's find method to throw an error
        Comment.find = jest.fn().mockReturnValue({
            sort: jest.fn().mockRejectedValue(new Error('Error fetching comments'))
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'posts and comments'; // Corrected value

        try {
            // Call the function and expect an error
            const result = await getRemovedItems(communityName, timeFilter, postsOrComments);
        } catch (result) {
            // Check if the result contains an error object
            expect(result).toHaveProperty('err');
            expect(result.err).toHaveProperty('status', 500);
            expect(result.err.message).toBeDefined();
        }

        expect(Post.find).toHaveBeenCalled();
        expect(Comment.find).not.toHaveBeenCalled();
    });
});