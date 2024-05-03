import { getRemovedItems, getReportedItems, getUnmoderatedItems } from '../src/services/communityQueueService.js';
import { Post } from '../src/db/models/Post.js';
import { Comment } from '../src/db/models/Comment.js';

const mockPosts = [];
const mockComments = [];

describe('getRemovedItems', () => {
    let expectedQuery = {
        // Approved, Removed, Spammed, Reported.
        $or: [
            {
                // Cas 1: The item went from unmoderated to removed.
                'moderator_details.removed_flag': true,

                'moderator_details.approved_flag': false,
                'moderator_details.spammed_flag': false,
                'moderator_details.reported_flag': false
            },
            {
                // Case 2: The item went from approved to removed.
                'moderator_details.removed_flag': true,
                'moderator_details.approved_flag': true,
                'moderator_details.spammed_flag': false,
                'moderator_details.reported_flag': false,
                $expr: { $lt: ["$moderator_details.approved_date", "$moderator_details.removed_date"] }
            },
            {
                // Case 3: The item went from unmoderated to spammed.
                'moderator_details.spammed_flag': true,

                'moderator_details.approved_flag': false,
                'moderator_details.removed_flag': false,
                'moderator_details.reported_flag': false
            },
            {
                // Case 4: The item went from approved to spammed.
                'moderator_details.spammed_flag': true,

                'moderator_details.approved_flag': true,
                'moderator_details.removed_flag': false,
                'moderator_details.reported_flag': false,
                $expr: { $lt: ["$moderator_details.approved_date", "$moderator_details.spammed_date"] }
            },
            {
                // Case 5: The item went from reported to removed.
                'moderator_details.removed_flag': true,

                'moderator_details.approved_flag': false,
                'moderator_details.spammed_flag': false,
                'moderator_details.reported_flag': true,
                $expr: { $lt: ["$moderator_details.reported_date", "$moderator_details.removed_date"] }
            }
        ]
    };

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
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected posts, sorted by creation date
        // We're sorting the mock posts by creation date and asserting that the result equals this sorted array.
        const expectedItems = mockPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ removedItems: expectedItems });
    });

    it('should return removed comments sorted by creation date', async () => {

        Comment.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockComments)
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Comments';
        const result = await getRemovedItems(communityName, timeFilter, postsOrComments);

        // Check if Comment.find was called with the correct arguments
        // console.log(Comment.find.mock.calls);
        expect(Comment.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected comments, sorted by creation date
        const expectedItems = mockComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ removedItems: expectedItems });
    });

    it('should return removed posts and comments sorted by creation date', async () => {

        Post.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockPosts)
        });

        Comment.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockComments)
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Posts and Comments';
        const result = await getRemovedItems(communityName, timeFilter, postsOrComments);

        // Check if Post.find and Comment.find were called with the correct arguments
        expect(Post.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        expect(Comment.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected posts and comments, sorted by creation date
        const expectedItems = [...mockPosts, ...mockComments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ removedItems: expectedItems });
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
        expect(Comment.find).toHaveBeenCalled();
    });
});


// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('getReportedItems', () => {
    let expectedQuery = {
        // No need to check for the spammed flag as a post could never be spammed and reported.
        $or: [
            {
                // Case 1: The item went from unmoderated to reported.
                'moderator_details.reported_flag': true,

                'moderator_details.approved_flag': false,
                'moderator_details.removed_flag': false,
            },
            {
                // Case 2: The item went from approved to reported.
                'moderator_details.reported_flag': true,

                'moderator_details.approved_flag': true,
                'moderator_details.removed_flag': false,
                $expr: { $lt: ["$moderator_details.approved_date", "$moderator_details.reported_date"] }

            }
        ]
    };

    it('should return an error when input parameters are invalid', async () => {
        const result = await getReportedItems(123, 'newest first', 'posts');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid input parameters' } });
    });

    it('should return an error when time filter is invalid', async () => {
        const result = await getReportedItems('community', 'invalid filter', 'posts');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid time filter' } });
    });

    it('should return an error when posts or comments value is invalid', async () => {
        const result = await getReportedItems('community', 'newest first', 'invalid value');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid posts or comments value' } });
    });

    it('should return reported posts sorted by creation date', async () => {

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
        const result = await getReportedItems(communityName, timeFilter, postsOrComments);

        // Here we're asserting that Post.find was called with the expected query object.
        expect(Post.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected posts, sorted by creation date
        // We're sorting the mock posts by creation date and asserting that the result equals this sorted array.
        const expectedItems = mockPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ reportedItems: expectedItems });
    });

    it('should return reported comments sorted by creation date', async () => {

        Comment.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockComments)
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Comments';
        const result = await getReportedItems(communityName, timeFilter, postsOrComments);

        // Check if Comment.find was called with the correct arguments
        // console.log(Comment.find.mock.calls);
        expect(Comment.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected comments, sorted by creation date
        const expectedItems = mockComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ reportedItems: expectedItems });
    });

    it('should return reported posts and comments sorted by creation date', async () => {

        Post.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockPosts)
        });

        Comment.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockComments)
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Posts and Comments';
        const result = await getReportedItems(communityName, timeFilter, postsOrComments);

        // Check if Post.find and Comment.find were called with the correct arguments
        expect(Post.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        expect(Comment.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected posts and comments, sorted by creation date
        const expectedItems = [...mockPosts, ...mockComments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ reportedItems: expectedItems });
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
            const result = await getReportedItems(communityName, timeFilter, postsOrComments);
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
            const result = await getReportedItems(communityName, timeFilter, postsOrComments);
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
            const result = await getReportedItems(communityName, timeFilter, postsOrComments);
        } catch (result) {
            // Check if the result contains an error object
            expect(result).toHaveProperty('err');
            expect(result.err).toHaveProperty('status', 500);
            expect(result.err.message).toBeDefined();
        }

        expect(Post.find).toHaveBeenCalled();
        expect(Comment.find).toHaveBeenCalled();
    });
});

// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('getUnmoderatedItems', () => {
    let expectedQuery = {
        $and: [
            { 'moderator_details.approved_flag': false },
            { 'moderator_details.removed_flag': false },
            { 'moderator_details.spammed_flag': false },
            { 'moderator_details.reported_flag': false }
        ]
    };

    it('should return an error when input parameters are invalid', async () => {
        const result = await getUnmoderatedItems(123, 'newest first', 'posts');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid input parameters' } });
    });

    it('should return an error when time filter is invalid', async () => {
        const result = await getUnmoderatedItems('community', 'invalid filter', 'posts');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid time filter' } });
    });

    it('should return an error when posts or comments value is invalid', async () => {
        const result = await getUnmoderatedItems('community', 'newest first', 'invalid value');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid posts or comments value' } });
    });

    it('should return unmoderated posts sorted by creation date', async () => {
        // Mock the Post model's find method
        // We're creating an array of mock posts that we want our mocked Post.find method to return.

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
        const result = await getUnmoderatedItems(communityName, timeFilter, postsOrComments);

        // Here we're asserting that Post.find was called with the expected query object.
        expect(Post.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected posts, sorted by creation date
        // We're sorting the mock posts by creation date and asserting that the result equals this sorted array.
        const expectedItems = mockPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ unmoderatedItems: expectedItems });
    });

    it('should return unmoderated comments sorted by creation date', async () => {
        // Mock the Comment model's find method
        Comment.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockComments)
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Comments';
        const result = await getUnmoderatedItems(communityName, timeFilter, postsOrComments);

        // Check if Comment.find was called with the correct arguments
        // console.log(Comment.find.mock.calls);
        // Here we're asserting that Post.find was called with the expected query object.
        expect(Post.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected comments, sorted by creation date
        const expectedItems = mockComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ unmoderatedItems: expectedItems });
    });

    it('should return unmoderated posts and comments sorted by creation date', async () => {
        // Mock the Post model's find method
        Post.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockPosts)
        });

        // Mock the Comment model's find method
        Comment.find = jest.fn().mockReturnValue({
            sort: () => Promise.resolve(mockComments)
        });

        // Call the function with valid parameters
        const communityName = 'SampleCommunity';
        const timeFilter = 'Newest First';
        const postsOrComments = 'Posts and Comments';
        const result = await getUnmoderatedItems(communityName, timeFilter, postsOrComments);

        // Check if Post.find and Comment.find were called with the correct arguments
        expect(Post.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        expect(Comment.find).toHaveBeenCalledWith({
            ...expectedQuery,
            community_name: communityName
        });

        // Check if the result contains the expected posts and comments, sorted by creation date
        const expectedItems = [...mockPosts, ...mockComments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        expect(result).toEqual({ unmoderatedItems: expectedItems });
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
            const result = await getUnmoderatedItems(communityName, timeFilter, postsOrComments);
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
            const result = await getUnmoderatedItems(communityName, timeFilter, postsOrComments);
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
            const result = await getUnmoderatedItems(communityName, timeFilter, postsOrComments);
        } catch (result) {
            // Check if the result contains an error object
            expect(result).toHaveProperty('err');
            expect(result.err).toHaveProperty('status', 500);
            expect(result.err.message).toBeDefined();
        }

        expect(Post.find).toHaveBeenCalled();
        expect(Comment.find).toHaveBeenCalled();
    });
});