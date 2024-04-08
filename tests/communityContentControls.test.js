import { getCommunityContentControls, changeCommunityContentControls } from '../src/services/communities.js';
import { Community } from '../src/db/models/Community.js';
import { CommunityContentControls } from '../src/db/models/communityContentControls.js';

describe('getCommunityContentControls', () => {
    it('should return content controls for a valid community name', async () => {
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

        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'SampleCommunity';
        const result = await getCommunityContentControls(communityName);

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(result).toEqual({ content_controls: mockContentControls });
        expect(mockQuery.populate).toHaveBeenCalledWith('content_controls');
    });

    it('should return an error object when a database error occurs during query execution', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockRejectedValue(new Error('Database error')),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'SampleCommunity';

        try {
            const result = await getCommunityContentControls(communityName);
        } catch (result) {
            expect(result.err).toBeDefined();
            expect(result.err.status).toBe(500);
            expect(result.err.message).toBeDefined();
        }

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
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

        const { save, ...resultData } = result.updated_content_controls;

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(CommunityContentControls.findById).toHaveBeenCalledWith(mockCommunity.content_controls);
        expect(resultData).toEqual({ ...mockContentControls, ...updatedContentControls });
        expect(mockContentControlsInstance.save).toHaveBeenCalled();
    });

    it('should return an error object when a database error occurs during query execution', async () => {
        Community.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

        const communityName = 'SampleCommunity';
        const contentControls = {};

        try {
            const result = await changeCommunityContentControls(communityName, contentControls);
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
        const contentControls = {};
    
        try {
            const result = await changeCommunityContentControls(communityName, contentControls);
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
});