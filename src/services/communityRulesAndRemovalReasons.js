// Mod Tools --> Moderation --> Rules and Removal Reasons --> (Rules, Removal Reasons)
// TODO: Implement the Remove Removal Reasons page.

import { Rule } from "../db/models/Rule.js";

import {
    communityNameExists,
    getRuleByTitle,
    getRuleById,
    deleteRule,
} from "../utils/communities.js";

//////////////////////////////////////////////////////////////////////// Rules ////////////////////////////////////////////////////////////////////
/**
 * addNewRuleToCommunity - Adds a new rule to a community.
 * @param {Object} requestBody - The request body containing the details of the new rule.
 * @param {string} requestBody.community_name - The name of the community to add the rule to.
 * @param {string} requestBody.rule_title - The title of the new rule.
 * @param {string} requestBody.applies_to - The type of content the rule applies to.
 * @param {string} requestBody.report_reason - The reason for reporting content that violates the rule.
 * @param {string} requestBody.full_description - The full description of the rule.
 
 * @returns {Object} An object containing the success status or error message.
 * @property {boolean} success - The success status of the operation.
 * @property {Object} err - The error message and status code.
 * 
 * @example
 * Input:
 * {
 * community_name: 'example_community',
 * rule_title: 'No Hate Speech',
 * applies_to: 'Posts and comments',
 * report_reason: 'Hate Speech',
 * full_description: 'Hate speech is not allowed in this community.',
 * }
 * @example
 * Output:
 * {
 * success: true
 * }
 */
const addNewRuleToCommunity = async (requestBody) => {
    let {
        community_name,
        rule_title,
        applies_to,
        report_reason,
        full_description,
    } = requestBody;

    try {
        const community = await communityNameExists(community_name);
        console.log(community);

        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }
        const rule_order = community.rules_ids.length + 1;
        report_reason = report_reason || rule_title;
        full_description = full_description || "";

        const new_rule = new Rule({
            rule_title,
            rule_order,
            applies_to,
            report_reason,
            full_description,
        });
        if (!community.rules_ids) {
            community.rules_ids = [];
        }
        console.log("*******************")
        console.log(community.rules_ids)
        community.rules_ids.push(new_rule._id);
        await new_rule.save();
        await community.save();
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

/**
 * editCommunityRule - Edits an existing rule in a community.
 * @param {Object} requestBody - The request body containing the details of the rule to edit.
 * @param {string} requestBody.community_name - The name of the community to edit the rule in.
 * @param {string} requestBody.rule_id - The id of the rule to edit.
 * @param {string} requestBody.rule_title - The new title of the rule.
 * @param {string} requestBody.applies_to - The new type of content the rule applies to.
 * @param {string} requestBody.report_reason - The new reason for reporting content that violates the rule.
 * @param {string} requestBody.full_description - The new full description of the rule.
 * @param {number} requestBody.rule_order - The new order of the rule.
 * 
 * @returns {Object} An object containing the success status or error message.
 * @property {boolean} success - The success status of the operation.
 * @property {Object} err - The error message and status code.
 * 
 * @example
 * Input:
 * {
 * community_name: 'example_community',
 * rule_id: '60f7b3b3b3b3b3b3b3b3b3b3',
 * rule_title: 'No Hate Speech',
 * applies_to: 'Posts and comments',
 * report_reason: 'Hate Speech',
 * full_description: 'Hate speech is not allowed in this community.',
 * rule_order: 1
 * }
 * @example
 * Output:
 * {
 * success: true
 * }
 */
const editCommunityRule = async (requestBody) => {
    try {
        let {
            community_name,
            rule_id,
            rule_title,
            rule_order,
            applies_to,
            report_reason,
            full_description,
        } = requestBody;
        const rule = await getRuleById(rule_id);

        if (!rule) {
            return { err: "No rule found with this id, enter a valid id." };
        }

        if (rule_title) {
            const new_title = await getRuleByTitle(community_name, rule_title);
            if (new_title && new_title._id.toString() !== rule._id.toString()) {
                return {
                    err: {
                        status: 500,
                        message: `The updated title already exists, enter a different title.`
                    }
                };
            }
        }
        rule.rule_title = rule_title || rule.rule_title;
        rule.applies_to = applies_to || rule.applies_to;
        rule.report_reason = report_reason || rule.report_reason;
        rule.full_description = full_description || rule.full_description;
        rule.rule_order = rule_order || rule.rule_order;
        await rule.save();
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

/**
 *  deleteCommunityRule - Deletes a rule from a community.
 * @param {Object} requestBody - The request body containing the details of the rule to delete.
 * @param {string} requestBody.community_name - The name of the community to delete the rule from.
 * @param {string} requestBody.rule_id - The id of the rule to delete.
 * 
 * @returns {Object} An object containing the success status or error message.
 * @property {boolean} success - The success status of the operation.
 * @property {Object} err - The error message and status code.
 * 
 * @example
 * Input:
 * {
 * community_name: 'example_community',
 * rule_id: '60f7b3b3b3b3b3b3b3b3b3b3',
 * }
 * 
 * @example
 * Output:
 * {
 * success: true
 * }
 */
const deleteCommunityRule = async (requestBody) => {
    let { community_name, rule_id } = requestBody;
    try {
        const community = await communityNameExists(community_name);
        if (!community) {
            return {
                err: { status: 500, message: "community name does not exist " },
            };
        }
        //check if rule exists

        const rule = await getRuleById(rule_id);
        console.log(rule);
        if (!rule) {
            console.log("rule does not exist");
            return { err: { status: 500, message: "rule id does not exist" } };
        }

        community.rules_ids = community.rules_ids.filter(
            (rule) => rule !== rule_id
        );

        await community.save();
        await deleteRule(rule_id);
        return { success: true };
    } catch (error) {
        return { err: { status: 500, message: error.message } };
    }
};

/**
 * getCommunityRules - Gets all the rules in a community.
 * @param {string} community_name - The name of the community to get the rules from.
 * 
 * @returns {Object} An object containing the rules or error message.
 * @property {Array} rules - The rules in the community.
 * @property {Object} err - The error message and status code.
 * 
 * @example
 * Input:
 * 'example_community'
 * 
 * @example
 * Output:
 * {
 * rules: [
 * {
 * _id: '60f7b3b3b3b3b3b3b3b3b3b3',
 * rule_title: 'No Hate Speech',
 * applies_to: 'Posts and comments',
 * report_reason: 'Hate Speech',
 * full_description: 'Hate speech is not allowed in this community.',
 * rule_order: 1
 * },
 * {
 * _id: '60f7b3b3b3b3b3b3b3b3b3b4',
 * rule_title: 'No Bullying',
 * applies_to: 'Posts and comments',
 * report_reason: 'Bullying',
 * full_description: 'Bullying is not allowed in this community.',
 * rule_order: 2
 * }
 * ]
 * }
 */
const getCommunityRules = async (community_name) => {
    const community = await communityNameExists(community_name);
    if (!community) {
        return { err: { status: 500, message: "community name does not exist " } };
    }
    const ids = community.rules_ids;
    const rules = [];
    for (const id of ids) {
        const rule = await getRuleById(id);
        if (rule) {
            rules.push(rule);
        }
    }
    console.log(rules);
    console.log(community);
    return { rules: rules };
};

//////////////////////////////////////////////////////////////////////// Removal Reasons ////////////////////////////////////////////////////////////////////

export {
    addNewRuleToCommunity,
    editCommunityRule,
    deleteCommunityRule,
    getCommunityRules,
}