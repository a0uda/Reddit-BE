
import { getCommunityRules, addNewRuleToCommunity, editCommunityRule, deleteCommunityRule } from "../src/services/communityRulesAndRemovalReasons";

import * as communityUtils from "../src/utils/communities"; // Import the entire module
import { Rule } from "../src/db/models/Rule";

// Mock the entire module
jest.mock("../src/utils/communities");
jest.mock("../src/db/models/Rule");

describe('getCommunityRules', () => {
  it('should return community rules for a valid community name', async () => {
    // Mock the communityNameExists function to return a mock community
    const mockCommunity = {
      name: 'SampleCommunity',
      rules_ids: ['rule1', 'rule2', 'rule3'], // Mocked array of rule IDs
    };
    communityUtils.communityNameExists.mockReturnValue(mockCommunity); // Use communityUtils to access the mocked function

    // Mock the getRuleById function to return mock rules
    const mockRule1 = {
      rule_title: 'Sample Rule 1',
      rule_order: 1,
      applies_to: 'posts_and_comments',
      report_reason: 'Violation of community guidelines',
      full_description: 'This is a sample rule description.',
    };
    const mockRule2 = {
      rule_title: 'Sample Rule 2',
      rule_order: 2,
      applies_to: 'posts_only',
      report_reason: 'Spam',
    };
    communityUtils.getRuleById.mockImplementation((id) => {
      if (id === 'rule1') return mockRule1;
      else if (id === 'rule2') return mockRule2;
      else return null; // Mocking the case where rule does not exist
    });

    // Call the function with a valid community name
    const communityName = 'SampleCommunity';
    const result = await getCommunityRules(communityName);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(communityName);

    // Check if getRuleById was called with the correct arguments
    expect(communityUtils.getRuleById).toHaveBeenCalledWith('rule1');
    expect(communityUtils.getRuleById).toHaveBeenCalledWith('rule2');
    expect(communityUtils.getRuleById).toHaveBeenCalledWith('rule3'); // to ensure all IDs are fetched

    // Check if the result contains the expected rules
    expect(result).toEqual({
      rules: [mockRule1, mockRule2], // Only existing rules are returned
    });
  });
  it('should return an error for an invalid community name', async () => {

    // Mock the communityNameExists function to return null for an invalid community name
    communityUtils.communityNameExists.mockReturnValue(null);

    // Call the function with an invalid community name
    const communityName = 'InvalidCommunity';
    const result = await getCommunityRules(communityName);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(communityName);

    // Check if the result contains the expected error message
    expect(result).toEqual({
      err: {
        status: 500,
        message: expect.stringMatching(/^community name does not exist\s*$/),
      },
    });

  }
  );
});



describe('addNewRuleToCommunity', () => {
  beforeEach(() => {
    // Reset the mock implementation before each test
    communityUtils.communityNameExists.mockReset();
    Rule.mockReset();
  });

  it('should successfully add a new rule to an existing community', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      rule_title: 'Sample Rule',
      applies_to: 'posts_and_comments',
      report_reason: 'Violation of community guidelines',
      full_description: 'This is a sample rule description.',
    };

    // Mock the existing community
    const mockCommunity = {
      _id: 'community_id',
      rules_ids: [],
      save: jest.fn(),
    };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Mock the new rule
    const mockNewRule = {
      _id: 'new_rule_id',
      save: jest.fn(),
    };
    Rule.mockImplementation(() => mockNewRule);

    // Call the function
    const result = await addNewRuleToCommunity(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check if the Rule constructor was called with the correct arguments
    expect(Rule).toHaveBeenCalledWith({
      rule_title: requestBody.rule_title,
      rule_order: 1, // Assuming it's the first rule for simplicity
      applies_to: requestBody.applies_to,
      report_reason: requestBody.report_reason,
      full_description: requestBody.full_description,
    });

    // Check if the new rule was saved
    expect(mockNewRule.save).toHaveBeenCalled();

    // Check if the community was updated with the new rule's ID
    expect(mockCommunity.rules_ids).toContain('new_rule_id');
    expect(mockCommunity.save).toHaveBeenCalled();

    // Check the result
    expect(result).toEqual({ success: true });
  });

  it('should return an error when trying to add a rule to a non-existent community', async () => {
    const requestBody = {
      community_name: 'NonExistentCommunity',
      rule_title: 'Sample Rule',
      applies_to: 'posts_and_comments',
      report_reason: 'Violation of community guidelines',
      full_description: 'This is a sample rule description.',
    };

    // Mock the non-existent community
    communityUtils.communityNameExists.mockResolvedValue(null);

    // Call the function
    const result = await addNewRuleToCommunity(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check the result
    expect(result).toEqual({
      err: {
        status: 500,
        message: expect.stringMatching(/^community name does not exist\s*$/),
      },
    });
  });

  it('should return an error when an error occurs during rule creation or community update', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      rule_title: 'Sample Rule',
      applies_to: 'posts_and_comments',
      report_reason: 'Violation of community guidelines',
      full_description: 'This is a sample rule description.',
    };

    // Mock the existing community
    const mockCommunity = {
      _id: 'community_id',
      rules_ids: [],
      save: jest.fn().mockRejectedValue(new Error('Failed to save community')),
    };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Call the function
    const result = await addNewRuleToCommunity(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check the result
    expect(result).toEqual({
      err: {
        status: 500,
        message: expect.stringMatching(/^Failed to save community\s*$/),
      },
    });
  });
});


describe('editCommunityRule', () => {
  beforeEach(() => {
    // Reset the mock implementation before each test
    communityUtils.getRuleById.mockReset();
    communityUtils.communityNameExists.mockReset();
  });

  it('should successfully edit a community rule with valid parameters', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      rule_id: 'existing_rule_id',
      rule_title: 'New Rule Title',
      rule_order: 2,
      applies_to: 'comments_only',
      report_reason: 'Offensive content',
      full_description: 'This is an updated rule description.',
    };

    // Mock the existing rule
    const mockRule = {
      _id: 'existing_rule_id',
      rule_title: 'Old Rule Title',
      rule_order: 1,
      applies_to: 'posts_and_comments',
      report_reason: 'Violation of community guidelines',
      full_description: 'This is an old rule description.',
      save: jest.fn(),
    };
    communityUtils.getRuleById.mockResolvedValue(mockRule);

    // Mock the check for existing rule title
    communityUtils.getRuleByTitle.mockResolvedValue(null); // Assuming the new title doesn't exist

    // Call the function
    const result = await editCommunityRule(requestBody);

    // Check if getRuleById was called with the correct arguments
    expect(communityUtils.getRuleById).toHaveBeenCalledWith(requestBody.rule_id);

    // Check the result
    expect(result).toEqual({ success: true });
  });
  it('should return an error when trying to edit a rule with an existing title', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      rule_id: 'existing_rule_id',
      rule_title: 'Existing Rule Title', // Assuming this title already exists
      // Other parameters are not relevant for this test
    };

    // Mock the existing rule
    const mockRule = {
      _id: 'existing_rule_id',
      rule_title: 'Existing Rule Title',
      save: jest.fn().mockResolvedValue()

    };
    communityUtils.getRuleById.mockResolvedValue(mockRule);

    // Mock the check for existing rule title
    communityUtils.getRuleByTitle.mockResolvedValue(mockRule); // Mock that the title already exists

    // Call the function
    const result = await editCommunityRule(requestBody);

    // Check if getRuleByTitle was called with the correct arguments
    expect(communityUtils.getRuleByTitle).toHaveBeenCalledWith(requestBody.community_name, requestBody.rule_title);

    //Check the result

    expect(result).toEqual({
      err: {
        status: 500,
        message: expect.stringMatching(/^The updated title already exists, enter a different title.\s*$/),
      },
    });
  });

});




// const deleteCommunityRule = async (requestBody) => {
//   let { community_name, rule_id } = requestBody;
//   try {
//     const community = await communityNameExists(community_name);
//     if (!community) {
//       return {
//         err: { status: 500, message: "community name does not exist " },
//       };
//     }

//     community.rules_ids = community.rules_ids.filter(
//       (rule) => rule !== rule_id
//     );

//     await community.save();
//     await deleteRule(rule_id);
//     return { success: true };
//   } catch (error) {
//     return { err: { status: 500, message: error.message } };
//   }
// };
describe('deleteRule', () => {
  it('should delete a rule successfully', async () => {
    // Mock the deleted rule object
    const mockCommunity = {
      rules_ids: ['rule_id'],
      save: jest.fn(),
    };
    const mockDeletedRule = { _id: 'rule_id' };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);
    Rule.findByIdAndDelete.mockResolvedValue(mockDeletedRule);
    const result = await deleteCommunityRule({ community_name: 'CommunityName', rule_id: 'rule_id' });
    // Check if Rule.findByIdAndDelete was called with the correct argument
    // expect(Rule.findByIdAndDelete).toHaveBeenCalledWith('rule_id');
    // Check if the result is as expected
    expect(result).toEqual({ success: true });
  });
  it('should return an error when the rule is not found', async () => {
    communityUtils.communityNameExists.mockResolvedValue({ rules_ids: [], save: jest.fn() });
    Rule.findByIdAndDelete.mockResolvedValue(null);
    communityUtils.getRuleById.mockResolvedValue(null);
    // Call the function
    const result = await deleteCommunityRule('non_existing_rule_id');
    // Check if Rule.findByIdAndDelete was called with the correct argument
    // expect(Rule.findByIdAndDelete).toHaveBeenCalledWith('non_existing_rule_id');
    // Check the result
    expect(result).toEqual({
      err: {
        status: 500,
        message: expect.stringMatching(/^rule id does not exist*$/),
      },
    });
  });
});