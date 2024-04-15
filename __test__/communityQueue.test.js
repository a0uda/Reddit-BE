import { getRemovedItems, getReportedItems, getUnmoderatedItems, removeItem, spamItem, reportItem, approveItem } from '../src/services/communityQueueService.js';
import { Post } from '../src/db/models/Post.js';
import { Comment } from '../src/db/models/Comment.js';
import { Community } from '../src/db/models/Community.js';

//////////////////////////////////////////////////////////////////////// Getting Queue Items //////////////////////////////////////////////////////////////////////////
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
                'moderator_details.approved_date': { $lt: 'moderator_details.removed_date' }
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
                'moderator_details.approved_date': { $lt: 'moderator_details.spammed_date' }
            },
            {
                // Case 5: The item went from reported to removed.
                'moderator_details.removed_flag': true,

                'moderator_details.approved_flag': false,
                'moderator_details.spammed_flag': false,
                'moderator_details.reported_flag': true,
                'moderator_details.reported_date': { $lt: 'moderator_details.removed_date' }
            }
        ]
    };

    const mockPosts = [
        // Case 1: The item went from unmoderated to removed.
        { created_at: new Date('2022-01-01'), moderator_details: { removed_flag: true, spammed_flag: false, approved_flag: false, reported_flag: false } },

        // Case 2: The item went from approved to removed.
        { created_at: new Date('2022-01-02'), moderator_details: { removed_flag: true, spammed_flag: false, approved_flag: true, reported_flag: false, approved_date: new Date('2022-01-01'), removed_date: new Date('2022-01-02') } },

        // Case 3: The item went from unmoderated to spammed.
        { created_at: new Date('2022-01-03'), moderator_details: { removed_flag: false, spammed_flag: true, approved_flag: false, reported_flag: false } },

        // Case 4: The item went from approved to spammed.
        { created_at: new Date('2022-01-04'), moderator_details: { removed_flag: false, spammed_flag: true, approved_flag: true, reported_flag: false, approved_date: new Date('2022-01-03'), spammed_date: new Date('2022-01-04') } },

        // Case 5: The item went from reported to removed.
        { created_at: new Date('2022-01-05'), moderator_details: { removed_flag: true, spammed_flag: false, approved_flag: false, reported_flag: true, reported_date: new Date('2022-01-04'), removed_date: new Date('2022-01-05') } },
    ];

    const mockComments = [
        // Case 1: The item went from unmoderated to removed.
        { created_at: new Date('2022-02-01'), moderator_details: { removed_flag: true, spammed_flag: false, approved_flag: false, reported_flag: false } },

        // Case 2: The item went from approved to removed.
        { created_at: new Date('2022-02-02'), moderator_details: { removed_flag: true, spammed_flag: false, approved_flag: true, reported_flag: false, approved_date: new Date('2022-02-01'), removed_date: new Date('2022-02-02') } },

        // Case 3: The item went from unmoderated to spammed.
        { created_at: new Date('2022-02-03'), moderator_details: { removed_flag: false, spammed_flag: true, approved_flag: false, reported_flag: false } },

        // Case 4: The item went from approved to spammed.
        { created_at: new Date('2022-02-04'), moderator_details: { removed_flag: false, spammed_flag: true, approved_flag: true, reported_flag: false, approved_date: new Date('2022-02-03'), spammed_date: new Date('2022-02-04') } },
    ];

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
        console.log(Comment.find.mock.calls);
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
        expect(Comment.find).not.toHaveBeenCalled();
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
                'moderator_details.approved_date': { $lt: 'moderator_details.reported_date' }
            }
        ]
    };

    const mockPosts = [
        // Case 1: The item went from unmoderated to reported.
        { created_at: new Date('2022-01-01'), moderator_details: { reported_flag: true, approved_flag: false, removed_flag: false } },

        // Case 2: The item went from approved to reported.
        { created_at: new Date('2022-01-02'), moderator_details: { reported_flag: true, approved_flag: true, removed_flag: false, approved_date: new Date('2022-01-01'), reported_date: new Date('2022-01-02') } },
    ];

    const mockComments = [
        // Case 1: The item went from unmoderated to reported.
        { created_at: new Date('2022-02-01'), moderator_details: { reported_flag: true, approved_flag: false, removed_flag: false } },

        // Case 2: The item went from approved to reported.
        { created_at: new Date('2022-02-02'), moderator_details: { reported_flag: true, approved_flag: true, removed_flag: false, approved_date: new Date('2022-02-01'), reported_date: new Date('2022-02-02') } },
    ];

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
        console.log(Comment.find.mock.calls);
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
        expect(Comment.find).not.toHaveBeenCalled();
    });
});

// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('getUnmoderatedItems', () => {
    const mockPosts = [
        {
            created_at: new Date('2022-01-01'),
            moderator_details: {
                removed_flag: false,
                spammed_flag: false,
                approved_flag: false
            }
        },
        {
            created_at: new Date('2022-01-03'),
            moderator_details: {
                removed_flag: false,
                spammed_flag: false,
                approved_flag: false
            }
        },
        {
            created_at: new Date('2022-01-02'),
            moderator_details: {
                removed_flag: true,
                spammed_flag: true,
                approved_flag: false
            }
        },
    ];

    const mockComments = [
        {
            created_at: new Date('2022-01-06'),
            moderator_details: {
                removed_flag: false,
                spammed_flag: false,
                approved_flag: false
            }
        },
        {
            created_at: new Date('2022-01-08'),
            moderator_details: {
                removed_flag: false,
                spammed_flag: false,
                approved_flag: false
            }
        },
        {
            created_at: new Date('2022-01-01'),
            moderator_details: {
                removed_flag: true,
                spammed_flag: true,
                approved_flag: false
            }
        },
    ];
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
            $and: [
                { 'moderator_details.approved_flag': false },
                { 'moderator_details.removed_flag': false },
                { 'moderator_details.spammed_flag': false }
            ],
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
        console.log(Comment.find.mock.calls);
        // Here we're asserting that Post.find was called with the expected query object.
        expect(Post.find).toHaveBeenCalledWith({
            $and: [
                { 'moderator_details.approved_flag': false },
                { 'moderator_details.removed_flag': false },
                { 'moderator_details.spammed_flag': false }
            ],
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
        const expectedQuery = {
            $and: [
                { 'moderator_details.approved_flag': false },
                { 'moderator_details.removed_flag': false },
                { 'moderator_details.spammed_flag': false }
            ],
            community_name: communityName
        };
        expect(Post.find).toHaveBeenCalledWith(expectedQuery);
        expect(Comment.find).toHaveBeenCalledWith(expectedQuery);

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
        expect(Comment.find).not.toHaveBeenCalled();
    });
});

//////////////////////////////////////////////////////////////////////////// Buttons/Actions ////////////////////////////////////////////////////////////////////////////
describe('removeItem', () => {
    it('should return an error when input parameters are invalid', async () => {
        const result = await removeItem(123, 'post');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message');
    });

    it('should return an error when item type is invalid', async () => {
        const result = await removeItem('123', 'invalid');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message');
    });

    it('should return an error when post is not found', async () => {
        Post.findById = jest.fn().mockResolvedValue(null);
        const result = await removeItem('123', 'post');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 404);
        expect(result.err).toHaveProperty('message');
    });

    it('should return an error when comment is not found', async () => {
        Comment.findById = jest.fn().mockResolvedValue(null);
        const result = await removeItem('123', 'comment');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 404);
        expect(result.err).toHaveProperty('message');
    });

    it('should return an error when removal reason is invalid', async () => {
        // Mock the Post model's findById method to return a valid post
        Post.findById = jest.fn().mockResolvedValue({ _id: '123', title: 'Test Post' });

        // Mock the Community model's findOne method to return null
        Community.findOne = jest.fn().mockResolvedValue(null);

        const result = await removeItem('123', 'post', 'user', 'invalid');

        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message', 'Invalid removal reason');
    });

    it('should remove a post if item type is "post"', async () => {
        const item_id = 'samplePostId';
        const removed_by = 'moderatorId';
        const removed_removal_reason = null;

        // Mock the findById method to return a post
        Post.findById = jest.fn().mockResolvedValue({ _id: item_id });

        Post.findByIdAndUpdate = jest.fn();

        await removeItem(item_id, 'post', removed_by, removed_removal_reason);

        expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(item_id, {
            'moderator_details.removed_flag': true,
            'moderator_details.removed_by': removed_by,
            'moderator_details.removed_date': expect.any(Date),
            'moderator_details.removed_removal_reason': removed_removal_reason,
        });
    });

    it('should remove a comment if item type is "comment"', async () => {
        const item_id = 'sampleCommentId';
        const removed_by = 'moderatorId';
        const removed_removal_reason = null;

        // Mock the findById method to return a comment
        Comment.findById = jest.fn().mockResolvedValue({ _id: item_id });

        Comment.findByIdAndUpdate = jest.fn();

        await removeItem(item_id, 'comment', removed_by, removed_removal_reason);

        expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(item_id, {
            'moderator_details.removed_flag': true,
            'moderator_details.removed_by': removed_by,
            'moderator_details.removed_date': expect.any(Date),
            'moderator_details.removed_removal_reason': removed_removal_reason
        });
    });

    it('should handle errors when removing an item', async () => {
        const itemId = 'itemId';
        const itemType = 'post';
        const removedBy = 'user';
        const removedRemovalReason = null;

        // Mock the Post model's findByIdAndUpdate method to throw an error
        Post.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Error removing item'));

        const result = await removeItem(itemId, itemType, removedBy, removedRemovalReason);

        // Check if the result contains an error object
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 500);
        expect(result.err).toHaveProperty('message');
    });
});

describe('spamItem', () => {
    it('should return an error when input parameters are invalid', async () => {
        const result = await spamItem(123, 'post', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message', 'Invalid input parameters');
    });

    it('should return an error when item type is invalid', async () => {
        const result = await spamItem('123', 'invalid', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message', 'Invalid item type');
    });

    it('should return an error when post is not found', async () => {
        Post.findById = jest.fn().mockResolvedValue(null);
        const result = await spamItem('123', 'post', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 404);
        expect(result.err).toHaveProperty('message', 'Post not found');
    });

    it('should return an error when comment is not found', async () => {
        Comment.findById = jest.fn().mockResolvedValue(null);
        const result = await spamItem('123', 'comment', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 404);
        expect(result.err).toHaveProperty('message', 'Comment not found');
    });

    it('should return an error when removal reason is invalid', async () => {
        Post.findById = jest.fn().mockResolvedValue({ _id: '123', title: 'Test Post' });
        Community.findOne = jest.fn().mockResolvedValue(null);
        const result = await spamItem('123', 'post', 'user', 'invalid');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message', 'Invalid removal reason');
    });

    it('should mark a post as spam if item type is "post"', async () => {
        const item_id = 'samplePostId';
        const spammed_by = 'moderatorId';
        const spammed_removal_reason = null;
        Post.findById = jest.fn().mockResolvedValue({ _id: item_id });
        Post.findByIdAndUpdate = jest.fn();
        await spamItem(item_id, 'post', spammed_by, spammed_removal_reason);
        expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(item_id, {
            'moderator_details.spammed_flag': true,
            'moderator_details.spammed_by': spammed_by,
            'moderator_details.spammed_date': expect.any(Date),
            'moderator_details.spammed_removal_reason': spammed_removal_reason,
        });
    });

    it('should mark a comment as spam if item type is "comment"', async () => {
        const item_id = 'sampleCommentId';
        const spammed_by = 'moderatorId';
        const spammed_removal_reason = null;
        Comment.findById = jest.fn().mockResolvedValue({ _id: item_id });
        Comment.findByIdAndUpdate = jest.fn();
        await spamItem(item_id, 'comment', spammed_by, spammed_removal_reason);
        expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(item_id, {
            'moderator_details.spammed_flag': true,
            'moderator_details.spammed_by': spammed_by,
            'moderator_details.spammed_date': expect.any(Date),
            'moderator_details.spammed_removal_reason': spammed_removal_reason
        });
    });

    it('should handle errors when marking an item as spam', async () => {
        const itemId = 'itemId';
        const itemType = 'post';
        const spammedBy = 'user';
        const spammedRemovalReason = null;
        Post.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Error marking item as spam'));
        const result = await spamItem(itemId, itemType, spammedBy, spammedRemovalReason);
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 500);
        expect(result.err).toHaveProperty('message');
    });
});

describe('reportItem', () => {
    it('should return an error when input parameters are invalid', async () => {
        const result = await reportItem(123, 'post', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message', 'Invalid input parameters');
    });

    it('should return an error when item type is invalid', async () => {
        const result = await reportItem('123', 'invalid', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message', 'Invalid item type');
    });

    it('should return an error when post is not found', async () => {
        Post.findById = jest.fn().mockResolvedValue(null);
        const result = await reportItem('123', 'post', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 404);
        expect(result.err).toHaveProperty('message', 'Post not found');
    });

    it('should return an error when comment is not found', async () => {
        Comment.findById = jest.fn().mockResolvedValue(null);
        const result = await reportItem('123', 'comment', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 404);
        expect(result.err).toHaveProperty('message', 'Comment not found');
    });

    it('should mark a post as reported if item type is "post"', async () => {
        const item_id = 'samplePostId';
        const reported_by = 'moderatorId';
        const reported_removal_reason = null;
        Post.findById = jest.fn().mockResolvedValue({ _id: item_id });
        Post.findByIdAndUpdate = jest.fn();
        await reportItem(item_id, 'post', reported_by, reported_removal_reason);
        expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(item_id, {
            'moderator_details.reported_flag': true,
            'moderator_details.reported_by': reported_by,
            'moderator_details.reported_date': expect.any(Date),
        });
    });

    it('should mark a comment as reported if item type is "comment"', async () => {
        const item_id = 'sampleCommentId';
        const reported_by = 'moderatorId';
        const reported_removal_reason = null;
        Comment.findById = jest.fn().mockResolvedValue({ _id: item_id });
        Comment.findByIdAndUpdate = jest.fn();
        await reportItem(item_id, 'comment', reported_by, reported_removal_reason);
        expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(item_id, {
            'moderator_details.reported_flag': true,
            'moderator_details.reported_by': reported_by,
            'moderator_details.reported_date': expect.any(Date),
        });
    });

    it('should handle errors when marking an item as reported', async () => {
        const itemId = 'itemId';
        const itemType = 'post';
        const reportedBy = 'user';
        const reportedRemovalReason = null;
        Post.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Error marking item as reported'));
        const result = await reportItem(itemId, itemType, reportedBy, reportedRemovalReason);
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 500);
        expect(result.err).toHaveProperty('message');
    });
});

describe('approveItem', () => {
    it('should return an error when input parameters are invalid', async () => {
        const result = await approveItem(123, 'post', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message', 'Invalid input parameters');
    });

    it('should return an error when item type is invalid', async () => {
        const result = await approveItem('123', 'invalid', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 400);
        expect(result.err).toHaveProperty('message', 'Invalid item type');
    });

    it('should return an error when post is not found', async () => {
        Post.findById = jest.fn().mockResolvedValue(null);
        const result = await approveItem('123', 'post', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 404);
        expect(result.err).toHaveProperty('message', 'Post not found');
    });

    it('should return an error when comment is not found', async () => {
        Comment.findById = jest.fn().mockResolvedValue(null);
        const result = await approveItem('123', 'comment', 'user');
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 404);
        expect(result.err).toHaveProperty('message', 'Comment not found');
    });

    it('should approve a post if item type is "post"', async () => {
        const item_id = 'samplePostId';
        const approved_by = 'moderatorId';
        Post.findById = jest.fn().mockResolvedValue({ _id: item_id });
        Post.findByIdAndUpdate = jest.fn();
        await approveItem(item_id, 'post', approved_by);
        expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(item_id, {
            'moderator_details.approved_flag': true,
            'moderator_details.approved_by': approved_by,
            'moderator_details.approved_date': expect.any(Date),
        });
    });

    it('should approve a comment if item type is "comment"', async () => {
        const item_id = 'sampleCommentId';
        const approved_by = 'moderatorId';
        Comment.findById = jest.fn().mockResolvedValue({ _id: item_id });
        Comment.findByIdAndUpdate = jest.fn();
        await approveItem(item_id, 'comment', approved_by);
        expect(Comment.findByIdAndUpdate).toHaveBeenCalledWith(item_id, {
            'moderator_details.approved_flag': true,
            'moderator_details.approved_by': approved_by,
            'moderator_details.approved_date': expect.any(Date),
        });
    });

    it('should handle errors when approving an item', async () => {
        const itemId = 'itemId';
        const itemType = 'post';
        const approvedBy = 'user';
        Post.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('Error approving item'));
        const result = await approveItem(itemId, itemType, approvedBy);
        expect(result).toHaveProperty('err');
        expect(result.err).toHaveProperty('status', 500);
        expect(result.err).toHaveProperty('message');
    });
});