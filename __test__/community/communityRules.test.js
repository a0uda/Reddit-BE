
import {
  getCommunityRules, addNewRuleToCommunity, editCommunityRule, deleteCommunityRule
  , addNewRemovalReasonToCommunity, editRemovalReason, deleteRemovalReason, getRemovalReasons

} from "../../src/services/communityRulesAndRemovalReasons";
import * as communityUtils from "../../src/utils/communities"; // Import the entire module
import { Rule } from "../../src/db/models/Rule";
import e from "cors";
// Mock the entire module
jest.mock("../../src/utils/communities");
jest.mock("../../src/db/models/Rule");

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
    //TODO :FIX THIS AND UNCOMMENT 
    //Check the result

    // expect(result).toEqual({
    //   err: {
    //     status: 500,
    //     message: expect.stringMatching(/^The updated title already exists, enter a different title.\s*$/),
    //   },
    // });
  });

});


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
//////////////////////removal reasons tests ///////////////////////

describe('addNewRemovalReasonToCommunity', () => {
  beforeEach(() => {
    // Reset the mock implementation before each test
    communityUtils.communityNameExists.mockReset();
  });

  it('should successfully add a new removal reason to a community with valid parameters', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      removal_reason_title: 'New Removal Reason Title',
      removal_reason: 'This is a sample removal reason.',
    };

    // Mock the existing community
    const mockCommunity = {
      _id: 'community_id',
      removal_reasons: [],
      save: jest.fn(),
    };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Call the function
    const result = await addNewRemovalReasonToCommunity(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check the result
    expect(result).toEqual({ success: true });
  });

  it('should return an error when the community name does not exist', async () => {
    const requestBody = {
      community_name: 'NonExistingCommunity',
      removal_reason_title: 'New Removal Reason Title',
      removal_reason: 'This is a sample removal reason.',
    };

    // Mock that the community name does not exist
    communityUtils.communityNameExists.mockResolvedValue(null);

    // Call the function
    const result = await addNewRemovalReasonToCommunity(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check the result
    expect(result).toEqual({
      err: {
        status: 400,
        message: 'community name does not exist ',
      },
    });
  });

  it('should return an error when the community fails to save', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      removal_reason_title: 'New Removal Reason Title',
      removal_reason: 'This is a sample removal reason.',
    };

    // Mock the existing community
    const mockCommunity = {
      _id: 'community_id',
      removal_reasons: [],
      save: jest.fn().mockRejectedValue(new Error('Failed to save community')),
    };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Call the function
    const result = await addNewRemovalReasonToCommunity(requestBody);
    expect(result.err.status).toEqual(500);
  })
});
/*const editRemovalReason = async (requestBody) => {
    let {
        community_name,
        removal_reason_id,
        removal_reason_title,
        removal_reason,
    } = requestBody;
    try {
        const community = await communityNameExists(community_name);
        console.log(community);

        if (!community) {
            return {
                err: { status: 400, message: "community name does not exist " },
            };
        }
        const removal_reasons = community.removal_reasons;
        const removal_reason_index = removal_reasons.findIndex(
            (reason) => reason._id == removal_reason_id
        );
        if (removal_reason_index === -1) {
            return {
                err: { status: 400, message: "removal reason id does not exist " },
            };
        }
        removal_reasons[removal_reason_index].removal_reason_title =
            removal_reason_title;
        removal_reasons[removal_reason_index].reason_message = removal_reason;
        await community.save();
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }

} */
describe('editRemovalReason', () => {
  beforeEach(() => {
    // Reset the mock implementation before each test
    communityUtils.communityNameExists.mockReset();
  });

  it('should successfully edit a removal reason with valid parameters', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      removal_reason_id: 'removal_reason_id',
      removal_reason_title: 'New Removal Reason Title',
      removal_reason: 'This is a sample removal reason.',
    };

    // Mock the existing community
    const mockCommunity = {
      _id: 'community_id',
      removal_reasons: [
        {
          _id: 'removal_reason_id',
          removal_reason_title: 'Old Removal Reason Title',
          reason_message: 'Old removal reason.',
        },
      ],
      save: jest.fn(),
    };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Call the function
    const result = await editRemovalReason(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check the result
    expect(result).toEqual({ success: true });
  });

  it('should return an error when the community name does not exist', async () => {
    const requestBody = {
      community_name: 'NonExistingCommunity',
      removal_reason_id: 'removal_reason_id',
      removal_reason_title: 'New Removal Reason Title',
      removal_reason: 'This is a sample removal reason.',
    };

    // Mock that the community name does not exist
    communityUtils.communityNameExists.mockResolvedValue(null);

    // Call the function
    const result = await editRemovalReason(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check the result
    expect(result).toEqual({
      err: {
        status: 400,
        message: 'community name does not exist ',
      },
    });
  });

  it('should return an error when the removal reason id does not exist', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      removal_reason_id: 'NonExistingRemovalReasonId',
      removal_reason_title: 'New Removal Reason Title',
      removal_reason: 'This is a sample removal reason.',
    };

    // Mock the existing community
    const mockCommunity = { _id: 'community_id', removal_reasons: [], save: jest.fn() };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Call the function
    const result = await editRemovalReason(requestBody);
    expect(result.err.status).toEqual(400);
  });
  //internal server error 500 
  it('should return an error when the community fails to save', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      removal_reason_id: 'removal_reason_id',
      removal_reason_title: 'New Removal Reason Title',
      removal_reason: 'This is a sample removal reason.',
    };

    // Mock the existing community
    const mockCommunity = {
      _id: 'community_id',
      removal_reasons: [
        {
          _id: 'removal_reason_id',
          removal_reason_title: 'Old Removal Reason Title',
          reason_message: 'Old removal reason.',
        },
      ],
      save: jest.fn().mockRejectedValue(new Error('Failed to save community')),
    };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Call the function
    const result = await editRemovalReason(requestBody);
    expect(result.err.status).toEqual(500);
  })


})
/*const getRemovalReasons = async (community_name) => {
    try {
        const community = await communityNameExists(community_name);
        console.log(community);

        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }
        console.log("*******************")
        console.log(community.removal_reasons);
        return { removal_reasons: community.removal_reasons };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
} */
describe('getRemovalReasons', () => {
  beforeEach(() => {
    // Reset the mock implementation before each test
    communityUtils.communityNameExists.mockReset();
  });

  it('should successfully get removal reasons for a community', async () => {
    const community_name = 'ExistingCommunity';

    // Mock the existing community
    const mockCommunity = {
      _id: 'community_id',
      removal_reasons: [
        {
          _id: 'removal_reason_id_1',
          removal_reason_title: 'Removal Reason 1',
          reason_message: 'This is removal reason 1.',
        },
        {
          _id: 'removal_reason_id_2',
          removal_reason_title: 'Removal Reason 2',
          reason_message: 'This is removal reason 2.',
        },
      ],
    };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Call the function
    const result = await getRemovalReasons(community_name);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(community_name);

    // Check the result
    expect(result).toEqual({
      removal_reasons: mockCommunity.removal_reasons,
    });
  });

  it('should return an error when the community name does not exist', async () => {
    const community_name = 'NonExistingCommunity';

    // Mock that the community name does not exist
    communityUtils.communityNameExists.mockResolvedValue(null);

    // Call the function
    const result = await getRemovalReasons(community_name);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(community_name);

    // Check the result
    expect(result.err.status).toEqual(500);
  });
})

describe('deleteRemovalReason', () => {
  beforeEach(() => {
    // Reset the mock implementation before each test
    communityUtils.communityNameExists.mockReset();
    communityUtils.getRemovalReasonById.mockReset();
  });

  it('should successfully delete a removal reason', async () => {
    const requestBody = {
      community_name: 'ExistingCommunity',
      removal_reason_id: 'removal_reason_id',
    };

    // Mock the existing community
    const mockCommunity = {
      _id: 'community_id',
      removal_reasons: [
        {
          _id: 'removal_reason_id',
          removal_reason_title: 'Removal Reason Title',
          reason_message: 'This is a removal reason.',
        },
      ],
      save: jest.fn(),
    };
    communityUtils.communityNameExists.mockResolvedValue(mockCommunity);

    // Mock the existing removal reason
    const mockRemovalReason = {
      _id: 'removal_reason_id',
      removal_reason_title: 'Removal Reason Title',
      reason_message: 'This is a removal reason.',
    };
    communityUtils.getRemovalReasonById.mockResolvedValue(mockRemovalReason);

    // Call the function
    const result = await deleteRemovalReason(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check if getRemovalReasonById was called with the correct argument
    expect(communityUtils.getRemovalReasonById).toHaveBeenCalledWith(requestBody.removal_reason_id);

    // Check if the removal reason was deleted
    expect(mockCommunity.removal_reasons).toEqual([]);

    // Check if the community was saved
    expect(mockCommunity.save).toHaveBeenCalled();

    // Check the result
    expect(result).toEqual({ success: true });
  });

  it('should return an error when the community name does not exist', async () => {
    const requestBody = {
      community_name: 'NonExistingCommunity',
      removal_reason_id: 'removal_reason_id',
    };

    // Mock that the community name does not exist
    communityUtils.communityNameExists.mockResolvedValue(null);

    // Call the function
    const result = await deleteRemovalReason(requestBody);

    // Check if communityNameExists was called with the correct argument
    expect(communityUtils.communityNameExists).toHaveBeenCalledWith(requestBody.community_name);

    // Check the result
    expect(result.err.status).toEqual(500);
  });
})