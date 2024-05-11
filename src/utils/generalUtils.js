/**
 * Utility functions related to user operations.
 * @module utils/generalUtils
 */

/**
 * Generates a response object based on the success status, status code, and message.
 * @param {boolean} success - Indicates whether the operation was successful or not.
 * @param {number} status - The status code of the response. Used only if success is false.
 * @param {string} message - The message associated with the response.
 * @returns {Object} A response object containing success status and message, or error status and message.
 */

export function generateResponse(success, status, message) {
  if (!success) {
    return {
      success: false,
      error: {
        status: status,
        message: message,
      },
    };
  } else {
    return {
      success: true,
      message: message,
    };
  }
}
