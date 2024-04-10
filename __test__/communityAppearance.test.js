import { getAppearanceOptions, getAppearanceOption, updateAppearanceOptions, updateAppearanceOption } from '../src/services/communityAppearance';
import { Community } from '../src/db/models/Community';

const mockAppearance = {
    avatar: { url: 'avatar_url', alt: 'avatar_alt' },
    banner: { url: 'banner_url', alt: 'banner_alt' },
    key_color: { hue: 1, saturation: 1, hex: '#000000' },
    base_color: { hue: 1, saturation: 1, hex: '#000000' },
    sticky_post_color: { hue: 1, saturation: 1, hex: '#000000' },
    dark_mode: true
};

describe('getAppearanceOptions', () => {
    it('should return appearance options for a valid community name', async () => {
        const mockCommunity = {
            name: 'SampleCommunity',
            appearance: mockAppearance,
        };

        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'SampleCommunity';
        const result = await getAppearanceOptions(communityName);

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(result).toEqual({ appearance: mockAppearance });
        expect(mockQuery.populate).toHaveBeenCalledWith('appearance');
    });

    it('should return an error object when a database error occurs during query execution', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockRejectedValue(new Error('Database error')),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'SampleCommunity';

        try {
            const result = await getAppearanceOptions(communityName);
        } catch (result) {
            expect(result.err).toBeDefined();
            expect(result.err.status).toBe(500);
            expect(result.err.message).toBeDefined();
        }

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(mockQuery.populate).toHaveBeenCalledWith('appearance');
    });

    it('should return an error object when community_name is not a string', async () => {
        const communityName = 123;
        const response = await getAppearanceOptions(communityName);

        expect(response).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when the community does not exist', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(null),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'nonexistent_community';
        const response = await getAppearanceOptions(communityName);

        expect(response).toEqual({ err: { status: 404, message: 'Community not found' } });
    });

    it('should return an error object when the community has an invalid appearance ID', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue({ appearance: 'invalid_id' }),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const communityName = 'SampleCommunity';
        const response = await getAppearanceOptions(communityName);

        expect(response).toEqual({ err: { status: 500, message: 'Invalid appearance ID' } });
    });
});

describe('getAppearanceOption', () => {
    it('should return an error object when community_name or option_name is not a string', async () => {
        const response1 = await getAppearanceOption(123, 'option');
        const response2 = await getAppearanceOption('community', 123);

        expect(response1).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
        expect(response2).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when the community does not exist', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(null),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const response = await getAppearanceOption('nonexistent_community', 'option');

        expect(response).toEqual({ err: { status: 404, message: 'Community not found' } });
    });

    it('should return an error object when the community has an invalid appearance ID', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue({ appearance: 'invalid_id' }),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const response = await getAppearanceOption('SampleCommunity', 'option');

        expect(response).toEqual({ err: { status: 500, message: 'Invalid appearance ID' } });
    });

    it('should return an error object when the option does not exist', async () => {
        const mockCommunity = {
            name: 'SampleCommunity',
            appearance: mockAppearance,
        };

        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const response = await getAppearanceOption('SampleCommunity', 'nonexistent_option');

        expect(response).toEqual({ err: { status: 404, message: 'Option not found' } });
    });

    it('should return the correct appearance option when given a valid community name and option name', async () => {
        const mockCommunity = {
            name: 'SampleCommunity',
            appearance: mockAppearance,
        };

        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const response = await getAppearanceOption('SampleCommunity', 'avatar');

        expect(response).toEqual({ appearance_option: { url: 'avatar_url', alt: 'avatar_alt' } });
    });
});

describe('updateAppearanceOptions', () => {
    it('should return an error object when community_name is not a string or new_appearance is not an object', async () => {
        const response1 = await updateAppearanceOptions(123, mockAppearance);
        const response2 = await updateAppearanceOptions('community', 'string');

        expect(response1).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
        expect(response2).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when the community does not exist', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(null),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const response = await updateAppearanceOptions('nonexistent_community', mockAppearance);

        expect(response).toEqual({ err: { status: 404, message: 'Community not found' } });
    });

    it('should return an error object when the community has an invalid appearance ID', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue({ appearance: 'invalid_id' }),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const response = await updateAppearanceOptions('SampleCommunity', mockAppearance);

        expect(response).toEqual({ err: { status: 500, message: 'Invalid appearance ID' } });
    });

    it('should update the appearance options and return the updated appearance when given a valid community name and new_appearance object', async () => {
        // Mock the appearance object with the set and save methods
        const mockCommunityAppearance = {
            ...mockAppearance,
            set: jest.fn().mockReturnThis(),
            save: jest.fn().mockResolvedValue(true),
        };

        // Mock the community object with the appearance object
        const mockCommunity = {
            name: 'SampleCommunity',
            appearance: mockCommunityAppearance,
        };

        // Mock the query object with the populate and exec methods
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        // Mock the Community.findOne method to return the mock query object
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        // Create a new appearance object with updated values
        const newAppearance = {
            avatar: { url: 'new_avatar_url', alt: 'new_avatar_alt' },
            banner: { url: 'new_banner_url', alt: 'new_banner_alt' },
            key_color: { hue: 2, saturation: 2, hex: '#FFFFFF' },
            base_color: { hue: 2, saturation: 2, hex: '#FFFFFF' },
            sticky_post_color: { hue: 2, saturation: 2, hex: '#FFFFFF' },
            dark_mode: false
        };

        // Call the updateAppearanceOptions function with the community name and new appearance object
        const response = await updateAppearanceOptions('SampleCommunity', newAppearance);

        // Check that the set method was called with the new appearance object
        expect(mockCommunityAppearance.set).toHaveBeenCalledWith(newAppearance);

        // Check that the save method was called
        expect(mockCommunityAppearance.save).toHaveBeenCalled();

        // Check that the response is the expected object
        expect(response).toEqual({ updates_appearance: mockCommunityAppearance });
    });
});

describe('updateAppearanceOption', () => {
    it('should return an error object when community_name or option_name is not a string', async () => {
        const response1 = await updateAppearanceOption(123, 'option', {});
        const response2 = await updateAppearanceOption('community', 123, {});

        expect(response1).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
        expect(response2).toEqual({ err: { status: 400, message: 'Invalid arguments' } });
    });

    it('should return an error object when new_value is not a boolean for dark_mode', async () => {
        const response = await updateAppearanceOption('SampleCommunity', 'dark_mode', 'string');

        expect(response).toEqual({ err: { status: 400, message: 'Invalid value for dark_mode. Expected a boolean.' } });
    });

    it('should return an error object when new_value is not an object for non-dark_mode options', async () => {
        const response = await updateAppearanceOption('SampleCommunity', 'avatar', 'string');

        expect(response).toEqual({ err: { status: 400, message: 'Invalid value for avatar. Expected an object with the same structure as (ie. containing all the attributes of) the existing appearance option. ' } });
    });

    it('should return an error object when the community does not exist', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(null),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const response = await updateAppearanceOption('nonexistent_community', 'avatar', { url: 'new_url', alt: 'new_alt' });

        expect(response).toEqual({ err: { status: 404, message: 'Community not found' } });
    });

    it('should return an error object when the community has an invalid appearance ID', async () => {
        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue({ appearance: 'invalid_id' }),
        };
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const response = await updateAppearanceOption('SampleCommunity', 'avatar', { url: 'new_url', alt: 'new_alt' });

        expect(response).toEqual({ err: { status: 500, message: 'Invalid appearance ID' } });
    });

    it('should update the appearance option and return the updated option when given a valid community name, option name, and new_value', async () => {
        const mockCommunityAppearance = {
            ...mockAppearance,
            save: jest.fn().mockResolvedValue(true),
        };

        const mockCommunity = {
            name: 'SampleCommunity',
            appearance: mockCommunityAppearance,
        };

        const mockQuery = {
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        const newValue = { url: 'new_url', alt: 'new_alt' };
        const response = await updateAppearanceOption('SampleCommunity', 'avatar', newValue);

        expect(mockCommunityAppearance.avatar).toEqual(newValue);
        expect(mockCommunityAppearance.save).toHaveBeenCalled();
        expect(response).toEqual({ updates_appearance_option: newValue });
    });
});