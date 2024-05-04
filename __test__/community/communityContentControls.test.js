import { getCommunityContentControls, changeCommunityContentControls } from '../../src/services/communitySettingsService.js';
import { Community } from '../../src/db/models/Community.js';
import { CommunityContentControls } from '../../src/db/models/communityContentControls.js';

describe('getCommunityContentControls', () => {
    it('should return content controls for a valid community name', async () => {
        // Mock the Community model's findOne method
        const mockContentControls = {
            providing_members_with_posting_guidlines: {
                flag: true,
                guidline_text: 'Sample guideline text',
            },
            require_words_in_post_title: {
                flag: false,
                add_required_words: ['Sample', 'Required'],
            },
            ban_words_from_post_title: {
                flag: true,
                add_banned_words: ['Banned', 'Words'],
            },
            ban_words_from_post_body: {
                flag: true,
                add_banned_words: 'Banned words from post body',
            },
            require_or_ban_links_from_specific_domains: {
                flag: true,
                restriction_type: 'Required domains',
                require_or_block_link_posts_with_these_domains: 'Required domain',
            },
            restrict_how_often_the_same_link_can_be_posted: {
                flag: true,
                number_of_days: 7,
            },
        };

        const mockCommunity = {
            name: 'SampleCommunity',
            content_controls: mockContentControls,
        };

        // Create a mock query object that simulates the Mongoose Query object
        const mockQuery = {
            // Mock the 'populate' method to return the mock query object, enabling method chaining
            populate: jest.fn().mockReturnThis(),
            // Mock the 'exec' method to return a Promise that resolves to the mock community object
            // getCommunityContentControls() is responsible for accessing the content_controls property of the community object returned from exec().
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        // Replace the 'findOne' method on the Community model with a mock function
        // This mock function returns the mock query object when called
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        // Call the function with a valid community name
        const communityName = 'SampleCommunity';
        const result = await getCommunityContentControls(communityName);

        // Check if Community.findOne was called with the correct argument
        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });

        // Check if the result contains the expected content controls
        expect(result).toEqual({ content_controls: mockContentControls });

        // Check if the 'populate' method was called with the correct argument
        expect(mockQuery.populate).toHaveBeenCalledWith('content_controls');
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
            const result = await getCommunityContentControls(communityName);
        } catch (result) {
            // Check if the result contains an error object
            expect(result.err).toBeDefined();
            expect(result.err.status).toBe(500);
            expect(result.err.message).toBeDefined();
        }

        // Check if Community.findOne was called with the correct argument
        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });

        // Check if the 'populate' method was called with the correct argument
        expect(mockQuery.populate).toHaveBeenCalledWith('content_controls');
    });

    it('should return an error object when an unexpected error occurs during the population of content_controls', async () => {
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
            const result = await getCommunityContentControls(communityName);
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
        const response = await getCommunityContentControls(communityName);

        expect(response).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when the community does not exist', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(null),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'nonexistent_community';
        const response = await getCommunityContentControls(communityName);

        expect(response).toEqual({ err: { status: 404, message: 'Community not found' } });
    });

    it('should return an error object when the community has an invalid content_controls ID', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue({ content_controls: 'invalid_id' }),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'SampleCommunity';
        const response = await getCommunityContentControls(communityName);

        expect(response).toEqual({ err: { status: 500, message: 'Invalid content_controls ID' } });
    });
});

describe('changeCommunityContentControls', () => {
    it('should update and return the content controls for a valid community name', async () => {
        const mockContentControls = {
            providing_members_with_posting_guidlines: {
                flag: true,
                guidline_text: 'Sample guideline text',
            },
            require_words_in_post_title: {
                flag: false,
                add_required_words: ['Sample', 'Required'],
            },
            ban_words_from_post_title: {
                flag: true,
                add_banned_words: ['Banned', 'Words'],
            },
            ban_words_from_post_body: {
                flag: true,
                add_banned_words: 'Banned words from post body',
            },
            require_or_ban_links_from_specific_domains: {
                flag: true,
                restriction_type: 'Required domains',
                require_or_block_link_posts_with_these_domains: 'Required domain',
            },
            restrict_how_often_the_same_link_can_be_posted: {
                flag: true,
                number_of_days: 7,
            },
        };

        const updatedContentControls = {
            providing_members_with_posting_guidlines: {
                flag: false,
                guidline_text: 'Updated guideline text',
            },
            require_words_in_post_title: {
                flag: true,
                add_required_words: ['Updated', 'Required'],
            },
            ban_words_from_post_title: {
                flag: false,
                add_banned_words: ['UpdatedBanned', 'Words'],
            },
            ban_words_from_post_body: {
                flag: false,
                add_banned_words: 'Updated banned words from post body',
            },
            require_or_ban_links_from_specific_domains: {
                flag: false,
                restriction_type: 'Blocked domains',
                require_or_block_link_posts_with_these_domains: 'Updated blocked domain',
            },
            restrict_how_often_the_same_link_can_be_posted: {
                flag: false,
                number_of_days: 14,
            },
        };

        const mockCommunity = {
            name: 'SampleCommunity',
            content_controls: mockContentControls._id,
        };

        const mockContentControlsInstance = {
            ...mockContentControls,
            save: jest.fn().mockResolvedValue({
                ...mockContentControls,
                ...updatedContentControls,
            }),
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityContentControls.findById = jest.fn().mockResolvedValue(mockContentControlsInstance);

        const communityName = 'SampleCommunity';
        const result = await changeCommunityContentControls(communityName, updatedContentControls);

        // Exclude the save function from the result object
        const { save, ...resultData } = result.updated_content_controls;

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(CommunityContentControls.findById).toHaveBeenCalledWith(mockCommunity.content_controls);
        expect(resultData).toEqual({ ...mockContentControls, ...updatedContentControls });
        expect(mockContentControlsInstance.save).toHaveBeenCalled();
    });

    it('should return an error object when a database error occurs during query execution', async () => {
        Community.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

        const communityName = 'SampleCommunity';
        const ContentControls = {};

        try {
            const result = await changeCommunityContentControls(communityName, ContentControls);
        } catch (result) {
            const { err, ...resultData } = result;
            expect(err).toBeDefined();
            expect(err.status).toBe(500);
            expect(err.message).toBeDefined();
            expect(resultData).toEqual({});
        }

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
    });

    it('should return an error object when an unexpected error occurs during the update of content_controls', async () => {
        const mockCommunity = {
            name: 'SampleCommunity',
            content_controls: '123',
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityContentControls.findById = jest.fn().mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const communityName = 'SampleCommunity';
        const ContentControls = {};

        try {
            const result = await changeCommunityContentControls(communityName, ContentControls);
        } catch (result) {
            const { err, ...resultData } = result;
            expect(err).toBeDefined();
            expect(err.status).toBe(500);
            expect(err.message).toBeDefined();
            expect(resultData).toEqual({});
        }

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(CommunityContentControls.findById).toHaveBeenCalledWith(mockCommunity.content_controls);
    });

    it('should return an error object when community_name is not a string', async () => {
        const communityName = 123;
        const ContentControls = {};

        const result = await changeCommunityContentControls(communityName, ContentControls);

        expect(result).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when content_controls is not an object', async () => {
        const communityName = 'SampleCommunity';
        const ContentControls = 'not an object';

        const result = await changeCommunityContentControls(communityName, ContentControls);

        expect(result).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when the community does not exist', async () => {
        Community.findOne = jest.fn().mockResolvedValue(null);

        const communityName = 'nonexistent_community';
        const ContentControls = {};

        const result = await changeCommunityContentControls(communityName, ContentControls);


        expect(result).toEqual({ err: { status: 404, message: 'Community not found' } });
        expect(Community.findOne).toHaveBeenCalledWith({ name: 'nonexistent_community' });
    });

    it('should return an error object when the community has an invalid content_controls ID', async () => {
        const mockCommunity = {
            name: 'SampleCommunity',
            content_controls: 'invalid ID',
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityContentControls.findById = jest.fn().mockResolvedValue(null);

        const communityName = 'SampleCommunity';
        const ContentControls = {};
        const result = await changeCommunityContentControls(communityName, ContentControls);
        expect(result).toEqual({ err: { status: 404, message: 'Content controls not found' } });
        expect(Community.findOne).toHaveBeenCalledWith({ name: 'SampleCommunity' });
        expect(CommunityContentControls.findById).toHaveBeenCalledWith('invalid ID');
    });
});