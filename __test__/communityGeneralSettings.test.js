import { getCommunityGenerlSettings, changeCommunityGeneralSettings } from '../src/services/communities.js';
import { Community } from '../src/db/models/Community.js';
import { CommunityGeneralSettings } from '../src/db/models/communityGeneralSettings.js';

describe('getCommunityGenerlSettings', () => {
    it('should return general settings for a valid community name', async () => {
        // Mock the Community model's findOne method
        const mockGeneralSettings = {
            description: 'Sample description',
            welcome_message: {
                send_welcome_message_flag: true,
                message: 'Welcome to our community!',
            },
            language: 'English',
            region: 'US',
            visibility: 'Public',
            nsfw_flag: false,
        };

        const mockCommunity = {
            name: 'SampleCommunity',
            general_settings: mockGeneralSettings,
        };

        // Create a mock query object that simulates the Mongoose Query object
        const mockQuery = {
            // Mock the 'populate' method to return the mock query object, enabling method chaining
            populate: jest.fn().mockReturnThis(),
            // Mock the 'exec' method to return a Promise that resolves to the mock community object
            // getCommunityGenerlSettings() is responsible for accessing the general_settings property of the community object returned from exec().
            exec: jest.fn().mockResolvedValue(mockCommunity),
        };

        // Replace the 'findOne' method on the Community model with a mock function
        // This mock function returns the mock query object when called
        Community.findOne = jest.fn().mockReturnValue(mockQuery);

        // Call the function with a valid community name
        const communityName = 'SampleCommunity';
        const result = await getCommunityGenerlSettings(communityName);

        // Check if Community.findOne was called with the correct argument
        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });

        // Check if the result contains the expected general settings
        expect(result).toEqual({ general_settings: mockGeneralSettings });

        // Check if the 'populate' method was called with the correct argument
        expect(mockQuery.populate).toHaveBeenCalledWith('general_settings');
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
            const result = await getCommunityGenerlSettings(communityName);
        } catch (result) {
            // Check if the result contains an error object
            expect(result.err).toBeDefined();
            expect(result.err.status).toBe(500);
            expect(result.err.message).toBeDefined();
        }

        // Check if Community.findOne was called with the correct argument
        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });

        // Check if the 'populate' method was called with the correct argument
        expect(mockQuery.populate).toHaveBeenCalledWith('general_settings');
    });

    it('should return an error object when an unexpected error occurs during the population of general_settings', async () => {
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
            const result = await getCommunityGenerlSettings(communityName);
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

describe('changeCommunityGeneralSettings', () => {
    it('should update and return the general settings for a valid community name', async () => {
        const mockGeneralSettings = {
            _id: '123',
            description: 'Sample description',
            welcome_message: {
                send_welcome_message_flag: true,
                message: 'Welcome to our community!',
            },
            language: 'English',
            region: 'US',
            visibility: 'Public',
            nsfw_flag: false,
        };

        const updatedGeneralSettings = {
            description: 'Updated description',
            welcome_message: {
                send_welcome_message_flag: false,
                message: 'Welcome!',
            },
            language: 'Spanish',
            region: 'ES',
            visibility: 'Private',
            nsfw_flag: true,
        };

        const mockCommunity = {
            name: 'SampleCommunity',
            general_settings: mockGeneralSettings._id,
        };

        const mockGeneralSettingsInstance = {
            ...mockGeneralSettings,
            save: jest.fn().mockResolvedValue({
                ...mockGeneralSettings,
                ...updatedGeneralSettings,
            }),
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityGeneralSettings.findById = jest.fn().mockResolvedValue(mockGeneralSettingsInstance);

        const communityName = 'SampleCommunity';
        const result = await changeCommunityGeneralSettings(communityName, updatedGeneralSettings);

        // Exclude the save function from the result object
        const { save, ...resultData } = result.updated_general_settings;

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(CommunityGeneralSettings.findById).toHaveBeenCalledWith(mockCommunity.general_settings);
        expect(resultData).toEqual({ ...mockGeneralSettings, ...updatedGeneralSettings });
        expect(mockGeneralSettingsInstance.save).toHaveBeenCalled();
    });

    it('should return an error object when a database error occurs during query execution', async () => {
        Community.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

        const communityName = 'SampleCommunity';
        const generalSettings = {};

        try {
            const result = await changeCommunityGeneralSettings(communityName, generalSettings);
        } catch (result) {
            const { err, ...resultData } = result;
            expect(err).toBeDefined();
            expect(err.status).toBe(500);
            expect(err.message).toBeDefined();
            expect(resultData).toEqual({});
        }

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
    });

    it('should return an error object when an unexpected error occurs during the update of general_settings', async () => {
        const mockCommunity = {
            name: 'SampleCommunity',
            general_settings: '123',
        };

        Community.findOne = jest.fn().mockResolvedValue(mockCommunity);
        CommunityGeneralSettings.findById = jest.fn().mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        const communityName = 'SampleCommunity';
        const generalSettings = {};

        try {
            const result = await changeCommunityGeneralSettings(communityName, generalSettings);
        } catch (result) {
            const { err, ...resultData } = result;
            expect(err).toBeDefined();
            expect(err.status).toBe(500);
            expect(err.message).toBeDefined();
            expect(resultData).toEqual({});
        }

        expect(Community.findOne).toHaveBeenCalledWith({ name: communityName });
        expect(CommunityGeneralSettings.findById).toHaveBeenCalledWith(mockCommunity.general_settings);
    });
});