import { objectItem } from '../../src/services/communityQueueService.js'
import { Community } from '../../src/db/models/Community.js'
import { Post } from '../../src/db/models/Post.js'
import { Comment } from '../../src/db/models/Comment.js'

jest.mock('../../src/db/models/Community.js');
jest.mock('../../src/db/models/Post.js');
jest.mock('../../src/db/models/Comment.js');

describe('objectItem', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return an error for invalid item type', async () => {
        const result = await objectItem('id', 'invalid', 'reported', 'user', 'Harassment', 'community');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid item type' } });
    });

    it('should return an error for invalid objection type', async () => {
        const result = await objectItem('id', 'post', 'invalid', 'user', 'Harassment', 'community');
        expect(result).toEqual({ err: { status: 400, message: `Invalid objection type, the allowed types are 'reported', 'spammed', 'removed'.` } });
    });

    it('should return an error for invalid report reason', async () => {
        const result = await objectItem('id', 'post', 'reported', 'user', 'Invalid', 'community');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid objection type value, check the report reasons' } });
    });

    it('should return an error for invalid removal reason', async () => {
        Community.findOne.mockResolvedValue({ removal_reasons: [] });
        const result = await objectItem('id', 'post', 'removed', 'user', 'Invalid', 'community');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid objection type value, check the community removal reasons' } });
    });

    it('should return an error for non-existing item', async () => {
        Post.findById.mockResolvedValue(null);
        const result = await objectItem('id', 'post', 'reported', 'user', 'Harassment', 'community');
        expect(result).toEqual({ err: { status: 404, message: 'Post not found' } });
    });

    it('should return an error for edited item with no action taken', async () => {
        Post.findById.mockResolvedValue({
            community_moderator_details: {
                edit_history: [{
                    edited_at: new Date(),
                    approved_edit_flag: false,
                    removed_edit_flag: false
                }]
            }
        });
        const result = await objectItem('id', 'post', 'reported', 'user', 'Harassment', 'community');
        expect(result).toEqual({ err: { status: 400, message: 'Post has been edited, no action taken on last edit, can\'t object' } });
    });

    it('should return an error for item with existing objection', async () => {
        Post.findById.mockResolvedValue({
            community_moderator_details: {
                reported: { flag: true },
                edit_history: []
            }
        });
        const result = await objectItem('id', 'post', 'reported', 'user', 'Harassment', 'community');
        expect(result).toEqual({ err: { status: 400, message: 'Post already has an objection' } });
    });

    it('should object the item successfully', async () => {
        Post.findById.mockResolvedValue({
            community_moderator_details: {
                reported: { flag: false },
                edit_history: []
            }
        });
        Post.findByIdAndUpdate.mockResolvedValue(true);
        const result = await objectItem('id', 'post', 'reported', 'user', 'Harassment', 'community');
        expect(result).toEqual({ message: 'Post reported successfully' });
    });

    it('should handle unexpected errors', async () => {
        const errorMessage = 'Unexpected error';
        const item_id = 'item1';
        const item_type = 'post';
        const objection_type = 'reported';
        const objected_by = 'user1';
        const objection_type_value = 'Harassment';
        const community_name = 'community1';

        // Mock the Post model's findById method to throw an error
        Post.findById.mockImplementation(() => {
            throw new Error(errorMessage);
        });

        const result = await objectItem(item_id, item_type, objection_type, objected_by, objection_type_value, community_name);

        expect(result).toEqual({ err: { status: 500, message: errorMessage } });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { editItem } from '../../src/services/communityQueueService.js';

jest.mock('../../src/db/models/Post.js');
jest.mock('../../src/db/models/Comment.js');

describe('editItem', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return an error for non-existent item', async () => {
        Post.findById.mockResolvedValue(null);
        const result = await editItem('id', 'post', 'new content', { username: 'user' });
        expect(result).toEqual({ err: { status: 404, message: 'Post not found' } });
    });

    it('should return an error for non-author user', async () => {
        Post.findById.mockResolvedValue({ username: 'other' });
        const result = await editItem('id', 'post', 'new content', { username: 'user' });
        expect(result).toEqual({ err: { status: 403, message: 'Access denied. You must be the author of the item to edit it.' } });
    });

    it('should return an error for item with objection', async () => {
        Post.findById.mockResolvedValue({
            username: 'user',
            community_moderator_details: {
                reported: { flag: true }
            }
        });
        const result = await editItem('id', 'post', 'new content', { username: 'user' });
        expect(result).toEqual({ err: { status: 400, message: 'Post has an objection, no action taken on objection, can\'t edit' } });
    });

    it('should return an error for invalid new content', async () => {
        Post.findById.mockResolvedValue({ username: 'user' });
        const result = await editItem('id', 'post', 123, { username: 'user' });
        expect(result).toEqual({ err: { status: 400, message: 'Invalid new content' } });
    });

    it('should edit the item successfully', async () => {
        Post.findById.mockResolvedValue({
            username: 'user',
            community_moderator_details: {
                edit_history: []
            },
            moderator_details: {
                edited_at: null
            }
        });
        Post.findByIdAndUpdate.mockResolvedValue(true);
        const result = await editItem('id', 'post', 'new content', { username: 'user' });
        expect(result).toEqual({ message: 'Post edited successfully' });
    });

    it('should return an error for database error', async () => {
        Post.findById.mockRejectedValue(new Error('Database error'));
        const result = await editItem('id', 'post', 'new content', { username: 'user' });
        expect(result).toEqual({ err: { status: 500, message: 'Database error' } });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { handleObjection } from '../../src/services/communityQueueService.js';

jest.mock('../../src/db/models/Post.js');
jest.mock('../../src/db/models/Comment.js');

describe('handleObjection', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return an error for non-existent item', async () => {
        Post.findById.mockResolvedValue(null);
        const result = await handleObjection('id', 'post', 'objection', 'approve');
        expect(result).toEqual({ err: { status: 404, message: 'Post not found' } });
    });

    it('should return an error for non-existent objection', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { objection: { flag: false } } });
        const result = await handleObjection('id', 'post', 'objection', 'approve');
        expect(result).toEqual({ err: { status: 400, message: 'No objection objection exists on this post' } });
    });

    it('should return an error for invalid action', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { objection: { flag: true } } });
        const result = await handleObjection('id', 'post', 'objection', 'invalid');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid action. Action must be either \'approve\' or \'remove\'' } });
    });

    it('should return an error for handled objection', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { objection: { flag: true, confirmed: true } } });
        const result = await handleObjection('id', 'post', 'objection', 'approve');
        expect(result).toEqual({ err: { status: 400, message: 'The objection objection cannot be approved because it has already been handled.' } });
    });

    it('should handle the objection successfully', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { removed: { flag: true, confirmed: false } } });
        Post.findByIdAndUpdate.mockResolvedValue(true);
        const result = await handleObjection('id', 'post', 'removed', 'approve');
        expect(result).toEqual({ message: 'Removed objection approved successfully' });
    });

    it('should return an error for database error', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { objection: { flag: true, confirmed: false } } });
        Post.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));
        const result = await handleObjection('id', 'post', 'objection', 'approve');
        expect(result).toEqual({ err: { status: 500, message: 'Database error' } });
    });

    it('should handle the remove action', async () => {
        const item_id = 'item1';
        const item_type = 'post';
        const objection_type = 'reported';
        const action = 'remove';

        // Mock the Post model's findById method to return a mocked item
        Post.findById.mockResolvedValue({
            community_moderator_details: {
                [objection_type]: {
                    flag: true,
                    confirmed: false
                }
            }
        });

        // Mock the Post model's findByIdAndUpdate method to do nothing
        Post.findByIdAndUpdate.mockResolvedValue();

        const result = await handleObjection(item_id, item_type, objection_type, action);

        expect(result).toEqual({ message: `${objection_type.charAt(0).toUpperCase() + objection_type.slice(1)} objection ${action}d successfully` });
    });

    it('should handle unexpected errors', async () => {
        const errorMessage = 'Unexpected error';
        const item_id = 'item1';
        const item_type = 'post';
        const objection_type = 'reported';
        const action = 'remove';

        // Mock the Post model's findById method to throw an error
        Post.findById.mockImplementation(() => {
            throw new Error(errorMessage);
        });

        const result = await handleObjection(item_id, item_type, objection_type, action);

        expect(result).toEqual({ err: { status: 500, message: errorMessage } });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { handleEdit } from '../../src/services/communityQueueService.js';

jest.mock('../../src/db/models/Post.js');
jest.mock('../../src/db/models/Comment.js');

describe('handleEdit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an error if the item is not found', async () => {
        Post.findById.mockResolvedValue(null);
        const result = await handleEdit('id', 'post', 'approve');
        expect(result).toEqual({ err: { status: 404, message: 'Item not found' } });
    });

    it('should return an error if the action is invalid', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { edit_history: [{}] } });
        const result = await handleEdit('id', 'post', 'invalid');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid action' } });
    });

    it('should return an error if the last edit is already approved or removed', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { edit_history: [{ approved_edit_flag: true, removed_edit_flag: false }] } });
        const result = await handleEdit('id', 'post', 'approve');
        expect(result).toEqual({ err: { status: 400, message: 'The last edit is already approved or removed' } });
    });

    it('should approve the last edit successfully', async () => {
        const mockItem = { community_moderator_details: { edit_history: [{ approved_edit_flag: false, removed_edit_flag: false }], unmoderated: { any_action_taken: false } }, save: jest.fn().mockResolvedValue(true) };
        Post.findById.mockResolvedValue(mockItem);
        const result = await handleEdit('id', 'post', 'approve');
        expect(result).toEqual({ message: 'Edit approved successfully' });
        expect(mockItem.community_moderator_details.edit_history[0].approved_edit_flag).toBe(true);
        expect(mockItem.community_moderator_details.unmoderated.any_action_taken).toBe(true);
    });

    it('should remove the last edit successfully', async () => {
        const mockItem = { community_moderator_details: { edit_history: [{ approved_edit_flag: false, removed_edit_flag: false }], unmoderated: { any_action_taken: false } }, save: jest.fn().mockResolvedValue(true) };
        Post.findById.mockResolvedValue(mockItem);
        const result = await handleEdit('id', 'post', 'remove');
        expect(result).toEqual({ message: 'Edit removed successfully' });
        expect(mockItem.community_moderator_details.edit_history[0].removed_edit_flag).toBe(true);
        expect(mockItem.community_moderator_details.unmoderated.any_action_taken).toBe(true);
    });

    it('should handle errors when fetching the item', async () => {
        const errorMessage = 'Error fetching item';
        const item_id = 'item1';
        const item_type = 'post';
        const action = 'approve';

        // Mock the Post model's findById method to throw an error
        Post.findById.mockImplementation(() => {
            throw new Error(errorMessage);
        });

        const result = await handleEdit(item_id, item_type, action);

        expect(result).toEqual({ err: { status: 500, message: errorMessage } });
    });

    it('should handle errors when saving the item', async () => {
        const errorMessage = 'Error saving item';
        const item_id = 'item1';
        const item_type = 'post';
        const action = 'approve';

        // Mock the Post model's findById method to return an item
        Post.findById.mockImplementation(() => {
            return {
                community_moderator_details: {
                    edit_history: [{ approved_edit_flag: false, removed_edit_flag: false }],
                    unmoderated: { any_action_taken: false },
                },
                save: () => {
                    throw new Error(errorMessage);
                },
            };
        });

        const result = await handleEdit(item_id, item_type, action);

        expect(result).toEqual({ err: { status: 500, message: `Error while saving the item after ${action}ing its edit: ${errorMessage}` } });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { handleUnmoderatedItem } from '../../src/services/communityQueueService.js';

jest.mock('../../src/db/models/Post.js');
jest.mock('../../src/db/models/Comment.js');

describe('handleUnmoderatedItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an error if the item is not found', async () => {
        Post.findById.mockResolvedValue(null);
        const result = await handleUnmoderatedItem('id', 'post', 'user1', 'approve');
        expect(result).toEqual({ err: { status: 404, message: 'Post not found' } });
    });

    it('should return an error if the action is invalid', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { unmoderated: { any_action_taken: false } } });
        const result = await handleUnmoderatedItem('id', 'post', 'user1', 'invalid');
        expect(result).toEqual({ err: { status: 400, message: 'Invalid action' } });
    });

    it('should return an error if the item is already approved or removed', async () => {
        Post.findById.mockResolvedValue({ community_moderator_details: { unmoderated: { any_action_taken: true } } });
        const result = await handleUnmoderatedItem('id', 'post', 'user1', 'approve');
        expect(result).toEqual({ err: { status: 400, message: 'This item is already approved or removed' } });
    });

    it('should approve the item successfully', async () => {
        const mockItem = {
            community_moderator_details: {
                unmoderated: {
                    any_action_taken: false,
                    approved: { flag: false, by: null, date: null }
                }
            },
            moderator_details: { approved_flag: false, approved_by: null, approved_date: null },
            save: jest.fn().mockResolvedValue(true)
        };
        Post.findById.mockResolvedValue(mockItem);
        const result = await handleUnmoderatedItem('id', 'post', 'user1', 'approve');
        expect(result).toEqual({ message: 'Post approved successfully' });
        expect(mockItem.community_moderator_details.unmoderated.approved.flag).toBe(true);
        expect(mockItem.community_moderator_details.unmoderated.approved.by).toBe('user1');
        expect(mockItem.community_moderator_details.unmoderated.any_action_taken).toBe(true);
    });

    it('should handle errors when saving the item', async () => {
        const errorMessage = 'Error saving item';
        const item_id = 'item1';
        const item_type = 'post';
        const action = 'approve';

        // Mock the Post model's findById method to return an item
        Post.findById.mockImplementation(() => {
            return {
                community_moderator_details: {
                    edit_history: [{ approved_edit_flag: false, removed_edit_flag: false }],
                    unmoderated: { any_action_taken: false },
                },
                save: () => {
                    throw new Error(errorMessage);
                },
            };
        });

        const result = await handleEdit(item_id, item_type, action);

        expect(result).toEqual({ err: { status: 500, message: `Error while saving the item after ${action}ing its edit: ${errorMessage}` } });
    });

    it('should handle unexpected errors', async () => {
        const errorMessage = 'Unexpected error';
        const item_id = 'item1';
        const item_type = 'post';
        const objection_type = 'reported';
        const objected_by = 'user1';
        const objection_type_value = 'Harassment';
        const community_name = 'community1';

        // Mock the Post model's findById method to throw an error
        Post.findById.mockImplementation(() => {
            throw new Error(errorMessage);
        });

        const result = await objectItem(item_id, item_type, objection_type, objected_by, objection_type_value, community_name);

        expect(result).toEqual({ err: { status: 500, message: errorMessage } });
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { getItemsFromQueue } from '../../src/services/communityQueueService.js';

jest.mock('../../src/db/models/Post.js');
jest.mock('../../src/db/models/Comment.js');

describe('getItemsFromQueue', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an error if the time filter is invalid', async () => {
        const result = await getItemsFromQueue('invalid', 'posts', 'reported', 'community1', {}, 1, 10);
        expect(result).toEqual({ err: { status: 400, message: 'Invalid time filter' } });
    });

    it('should return an error if the posts or comments value is invalid', async () => {
        const result = await getItemsFromQueue('newest first', 'invalid', 'reported', 'community1', {}, 1, 10);
        expect(result).toEqual({ err: { status: 400, message: 'Invalid posts or comments value' } });
    });

    it('should return an error if the queue type is invalid', async () => {
        const result = await getItemsFromQueue('newest first', 'posts', 'invalid', 'community1', {}, 1, 10);
        expect(result).toEqual({ err: { status: 400, message: `Invalid queue type. Queue type must be either 'reported', 'removed', 'spammed', 'unmoderated' or 'edited' ` } });
    });

    // Repeat the above pattern for the other queue types
    ['removed', 'reported', 'unmoderated', 'edited'].forEach(queueType => {
        it(`should handle "${queueType}" queue type`, async () => {
            const mockUser = { upvotes_posts_ids: [], downvotes_posts_ids: [] };

            const mockPosts = [{ _id: 'post1', _doc: { created_at: new Date() } }];
            const mockPostFind = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockPosts),
            };
            Post.find.mockReturnValue(mockPostFind);

            const result = await getItemsFromQueue('newest first', 'posts', queueType, 'community1', mockUser, 1, 10);

            expect(result).toEqual({ items: mockPosts.map(post => ({ ...post._doc, userVote: 'none' })) });
        });
    });

    it('should add userVote attribute to each post', async () => {
        const mockPosts = [
            { _id: 'post1', _doc: { created_at: new Date() } },
            { _id: 'post2', _doc: { created_at: new Date() } },
            { _id: 'post3', _doc: { created_at: new Date() } },
        ];
        const mockUser = {
            upvotes_posts_ids: ['post1'],
            downvotes_posts_ids: ['post2'],
        };

        const mockPostFind = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(mockPosts),
        };

        Post.find.mockReturnValue(mockPostFind);

        const result = await getItemsFromQueue('newest first', 'posts', 'reported', 'community1', mockUser, 1, 10);

        expect(result).toEqual({
            items: [
                { ...mockPosts[0]._doc, userVote: 'up' },
                { ...mockPosts[1]._doc, userVote: 'down' },
                { ...mockPosts[2]._doc, userVote: 'none' },
            ],
        });
    });

    it('should return a 500 error if an unexpected error occurs', async () => {
        const mockError = new Error('Unexpected error');

        // Mock the Post.find and Comment.find methods to throw an error
        Post.find = jest.fn(() => {
            throw mockError;
        });
        Comment.find = jest.fn(() => {
            throw mockError;
        });

        const result = await getItemsFromQueue('newest first', 'posts', 'reported', 'community1', {}, 1, 10);

        // Check that the function correctly returns a 500 status code and the error message
        expect(result).toEqual({ err: { status: 500, message: mockError.message } });
    });
});