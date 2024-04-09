import { getCommunityPostsCommentsSettings, changeCommunityPostsCommentsSettings } from '../src/services/communities.js';
import { Community } from '../src/db/models/Community.js';
import { CommunityPostsAndComments } from '../src/db/models/communityPostsAndComments.js';

describe('getCommunityPostsCommentsSettings', () => {
    it('should return posts and comments settings for a valid community name', async () => {
        const mockPostsAndCommentsSettings = {
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
            posts_and_comments: mockPostsAndCommentsSettings,
        };

        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'SampleCommunity';
        const result = await getCommunityPostsCommentsSettings(communityName);

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(result).toEqual({ posts_and_comments: mockPostsAndCommentsSettings });
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
            const result = await getCommunityPostsCommentsSettings(communityName);
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
            const result = await getCommunityPostsCommentsSettings(communityName);
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
});

describe('changeCommunityPostsCommentsSettings', () => {
    it('should update and return the posts and comments settings for a valid community name', async () => {
        const mockPostsAndCommentsSettings = {
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

        const updatedPostsAndCommentsSettings = {
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
            posts_and_comments: mockPostsAndCommentsSettings._id,
        };

        const mockPostsAndCommentsSettingsInstance = {
            ...mockPostsAndCommentsSettings,
            save: jest.fn().mockResolvedValue({
                ...mockPostsAndCommentsSettings,
                ...updatedPostsAndCommentsSettings,
            }),
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityPostsAndComments.findById = jest.fn().mockResolvedValue(mockPostsAndCommentsSettingsInstance);

        const communityName = 'SampleCommunity';
        const result = await changeCommunityPostsCommentsSettings(communityName, updatedPostsAndCommentsSettings);

        const { save, ...resultData } = result.updated_posts_and_comments;

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(CommunityPostsAndComments.findById).toHaveBeenCalledWith(mockCommunity.posts_and_comments);
        expect(resultData).toEqual({ ...mockPostsAndCommentsSettings, ...updatedPostsAndCommentsSettings });
        expect(mockPostsAndCommentsSettingsInstance.save).toHaveBeenCalled();
    });

    it('should return an error object when a database error occurs during query execution', async () => {
        Community.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

        const communityName = 'SampleCommunity';
        const postsCommentsSettings = {};

        try {
            const result = await changeCommunityPostsCommentsSettings(communityName, postsCommentsSettings);
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
        const postsCommentsSettings = {};

        try {
            const result = await changeCommunityPostsCommentsSettings(communityName, postsCommentsSettings);
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
});