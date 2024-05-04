import { getCommunityPostsAndComments, changeCommunityPostsAndComments } from '../../src/services/communitySettingsService.js';
import { Community } from '../../src/db/models/Community.js';
import { CommunityPostsAndComments } from '../../src/db/models/communityPostsAndComments.js';

describe('getCommunityPostsAndComments', () => {
    it('should return posts and comments for a valid community name', async () => {
        // Mock the Community model's findOne method
        const mockPostsAndComments = {
            posts: {
                post_type_options: 'Any',
                allow_crossposting_of_posts: true,
                archive_posts: false,
                enable_spoiler_tag: true,
                allow_image_uploads_and_links_to_image_hosting_sites: true,
                allow_multiple_images_per_post: true,
                allow_polls: true,
                spam_filter_strength: {
                    posts: 'Low',
                    links: 'Low',
                    comments: 'Low (default)',
                },
            },
            comments: {
                suggested_sort: 'None (Recommended)',
                collapse_deleted_and_removed_comments: true,
                minutes_to_hide_comment_scores: 0,
                media_in_comments: {
                    gifs_from_giphy: true,
                    collectible_expressions: true,
                    images: true,
                    gifs: true,
                },
            },
        };

        const mockCommunity = {
            name: 'SampleCommunity',
            posts_and_comments: mockPostsAndComments,
        };

        // Create a mock query object that simulates the Mongoose Query object
        const mockQuery = {
            // Mock the 'populate' method to return the mock query object, enabling method chaining
            populate: jest.fn().mockReturnThis(),
            // Mock the 'exec' method to return a Promise that resolves to the mock community object
            // getCommunityPostsAndComments() is responsible for accessing the posts_and_comments property of the community object returned from exec().
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        // Replace the 'findOne' method on the Community model with a mock function
        // This mock function returns the mock query object when called
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        // Call the function with a valid community name
        const communityName = 'SampleCommunity';
        const result = await getCommunityPostsAndComments(communityName);

        // Check if Community.findOne was called with the correct argument
        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });

        // Check if the result contains the expected posts and comments
        expect(result).toEqual({ posts_and_comments: mockPostsAndComments });

        // Check if the 'populate' method was called with the correct argument
        expect(mockQuery.populate).toHaveBeenCalledWith('posts_and_comments');
    });

    it('should return an error object when a database error occurs during query execution', async () => {
        // Mock the Community model's findOne method to throw an error
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockRejectedValue(new Error('Database error')),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        
        // Call the function with a valid community name
        const communityName = 'SampleCommunity';

        // Use a try-catch block to catch the error returned by the function
        try {
            const result = await getCommunityPostsAndComments(communityName);
        } catch (result) {
            // Check if the result contains an error object
            expect(result.err).toBeDefined();
            expect(result.err.status).toBe(500);
            expect(result.err.message).toBeDefined();
        }

        // Check if Community.findOne was called with the correct argument
        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });

        // Check if the 'populate' method was called with the correct argument
        expect(mockQuery.populate).toHaveBeenCalledWith('posts_and_comments');
    });

    it('should return an error object when an unexpected error occurs during the population of posts_and_comments', async () => {
        // Mock the Community model's findOne method to throw an error
        const mockQuery = {
            populate: jest.fn().mockImplementation(() => {
                throw new Error('Unexpected error');
            }),
            exec: jest.fn().mockReturnThis(),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        
        // Call the function with a valid community name
        const communityName = 'SampleCommunity';

        // Use a try-catch block to catch the error returned by the function
        try {
            const result = await getCommunityPostsAndComments(communityName);
        } catch (result) {
            // Check if the result contains an error object
            expect(result.err).toBeDefined();
            expect(result.err.status).toBe(500);
            expect(result.err.message).toBeDefined();
        }

        // Check if Community.findOne was called with the correct argument
        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });

        // Check if the 'populate' method was called
        expect(mockQuery.populate).toHaveBeenCalled();
    });

    it('should return an error object when community_name is not a string', async () => {
        const communityName = 123;
        const response = await getCommunityPostsAndComments(communityName);

        expect(response).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when the community does not exist', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(null),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'nonexistent_community';
        const response = await getCommunityPostsAndComments(communityName);

        expect(response).toEqual({ err: { status: 404, message: 'Community not found' } });
    });

    it('should return an error object when the community has an invalid posts_and_comments ID', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue({ posts_and_comments: 'invalid_id' }),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'SampleCommunity';
        const response = await getCommunityPostsAndComments(communityName);

        expect(response).toEqual({ err: { status: 500, message: 'Invalid posts_and_comments ID' } });
    });
});

describe('changeCommunityPostsAndComments', () => {
    it('should update and return the posts and comments for a valid community name', async () => {
        const mockPostsAndComments = {
            _id: '123',
            posts: {
                post_type_options: 'Any',
                allow_crossposting_of_posts: true,
                archive_posts: false,
                enable_spoiler_tag: true,
                allow_image_uploads_and_links_to_image_hosting_sites: true,
                allow_multiple_images_per_post: true,
                allow_polls: true,
                spam_filter_strength: {
                    posts: 'Low',
                    links: 'Low',
                    comments: 'Low (default)',
                },
            },
            comments: {
                suggested_sort: 'None (Recommended)',
                collapse_deleted_and_removed_comments: true,
                minutes_to_hide_comment_scores: 0,
                media_in_comments: {
                    gifs_from_giphy: true,
                    collectible_expressions: true,
                    images: true,
                    gifs: true,
                },
            },
        };

        const updatedPostsAndComments = {
            posts: {
                post_type_options: 'Links Only',
                allow_crossposting_of_posts: false,
                archive_posts: true,
                enable_spoiler_tag: false,
                allow_image_uploads_and_links_to_image_hosting_sites: false,
                allow_multiple_images_per_post: false,
                allow_polls: false,
                spam_filter_strength: {
                    posts: 'High (default)',
                    links: 'High (default)',
                    comments: 'High',
                },
            },
            comments: {
                suggested_sort: 'Best',
                collapse_deleted_and_removed_comments: false,
                minutes_to_hide_comment_scores: 10,
                media_in_comments: {
                    gifs_from_giphy: false,
                    collectible_expressions: false,
                    images: false,
                    gifs: false,
                },
            },
        };

        const mockCommunity = {
            name: 'SampleCommunity',
            posts_and_comments: mockPostsAndComments._id,
        };

        const mockPostsAndCommentsInstance = {
            ...mockPostsAndComments,
            save: jest.fn().mockResolvedValue({
                ...mockPostsAndComments,
                ...updatedPostsAndComments,
            }),
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityPostsAndComments.findById = jest.fn().mockResolvedValue(mockPostsAndCommentsInstance);

        const communityName = 'SampleCommunity';
        const result = await changeCommunityPostsAndComments(communityName, updatedPostsAndComments);

        // Exclude the save function from the result object
        const { save, ...resultData } = result.updated_posts_and_comments;

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(CommunityPostsAndComments.findById).toHaveBeenCalledWith(mockCommunity.posts_and_comments);
        expect(resultData).toEqual({ ...mockPostsAndComments, ...updatedPostsAndComments });
        expect(mockPostsAndCommentsInstance.save).toHaveBeenCalled();
    });

    it('should return an error object when a database error occurs during query execution', async () => {
        Community.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

        const communityName = 'SampleCommunity';
        const PostsAndComments = {};
 
        try {
            const result = await changeCommunityPostsAndComments(communityName, PostsAndComments);
        } catch (result) {
            const { err, ...resultData } = result;
            expect(err).toBeDefined();
            expect(err.status).toBe(500);
            expect(err.message).toBeDefined();
            expect(resultData).toEqual({});
        }

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
    });

    it('should return an error object when an unexpected error occurs during the update of posts_and_comments', async () => {
        const mockCommunity = {
            name: 'SampleCommunity',
            posts_and_comments: '123',
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityPostsAndComments.findById = jest.fn().mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const communityName = 'SampleCommunity';
        const PostsAndComments = {};

        try {
            const result = await changeCommunityPostsAndComments(communityName, PostsAndComments);
        } catch (result) {
            const { err, ...resultData } = result;
            expect(err).toBeDefined();
            expect(err.status).toBe(500);
            expect(err.message).toBeDefined();
            expect(resultData).toEqual({});
        }

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(CommunityPostsAndComments.findById).toHaveBeenCalledWith(mockCommunity.posts_and_comments);
    });

    it('should return an error object when community_name is not a string', async () => {
        const communityName = 123;
        const PostsAndComments = {};

        const result = await changeCommunityPostsAndComments(communityName, PostsAndComments);

        expect(result).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when posts_and_comments is not an object', async () => {
        const communityName = 'SampleCommunity';
        const PostsAndComments = 'not an object';

        const result = await changeCommunityPostsAndComments(communityName, PostsAndComments);

        expect(result).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when the community does not exist', async () => {
        Community.findOne = jest.fn().mockResolvedValue(null);

        const communityName = 'nonexistent_community';
        const PostsAndComments = {};

        const result = await changeCommunityPostsAndComments(communityName, PostsAndComments);


        expect(result).toEqual({ err: { status: 404, message: 'Community not found' } });
        expect(Community.findOne).toHaveBeenCalledWith({ name: 'nonexistent_community' });
    });

    it('should return an error object when the community has an invalid posts_and_comments ID', async () => {
        const mockCommunity = {
            name: 'SampleCommunity',
            posts_and_comments: 'invalid ID',
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityPostsAndComments.findById = jest.fn().mockResolvedValue(null);

        const communityName = 'SampleCommunity';
        const PostsAndComments = {};
        const result = await changeCommunityPostsAndComments(communityName, PostsAndComments);

        expect(result).toEqual({ err: { status: 404, message: 'Posts and comments not found' } });
        expect(Community.findOne).toHaveBeenCalledWith({ name: 'SampleCommunity' });
        expect(CommunityPostsAndComments.findById).toHaveBeenCalledWith('invalid ID');
    });
});