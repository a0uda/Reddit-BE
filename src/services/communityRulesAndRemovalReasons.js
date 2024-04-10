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